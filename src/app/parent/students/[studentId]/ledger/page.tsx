import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { calculateCashBalance, calculateMakeUpCreditsOwed } from "@/lib/ledger";

export default async function StudentLedgerPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  if (!context.canSeeLedger) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Ledger</h1>
        <p className="rounded-xl bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Your guardian hasn&apos;t shared the financial ledger with you.
        </p>
      </div>
    );
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { studentId },
    include: {
      payer: true,
      ledgerEntries: { orderBy: { date: "desc" } },
      invoices: { orderBy: { issueDate: "desc" } },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Ledger</h1>

      {subscriptions.length === 0 ? (
        <p className="text-sm text-neutral-500">No subscription on file yet.</p>
      ) : (
        subscriptions.map((subscription) => {
          const cashBalance = calculateCashBalance(subscription.ledgerEntries);
          const makeUpCreditsOwed = calculateMakeUpCreditsOwed(subscription.ledgerEntries);

          return (
            <div key={subscription.id} className="space-y-6">
              {/* Invoices List */}
              {subscription.invoices && subscription.invoices.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-neutral-800">Invoices & Receipts</h3>
                  <div className="overflow-hidden rounded-xl bg-white border border-neutral-100 shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="border-b border-neutral-200 bg-neutral-50/50 text-left text-neutral-500">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Invoice #</th>
                          <th className="px-4 py-2.5 font-medium">Issue Date</th>
                          <th className="px-4 py-2.5 font-medium">Due Date</th>
                          <th className="px-4 py-2.5 font-medium">Amount</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                          <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscription.invoices.map((inv) => (
                          <tr key={inv.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                            <td className="px-4 py-3 font-semibold text-neutral-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 text-neutral-500">
                              {inv.issueDate.toLocaleDateString("en-GB")}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                              {inv.dueDate.toLocaleDateString("en-GB")}
                            </td>
                            <td className="px-4 py-3 font-medium text-neutral-900">£{Number(inv.amount).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-semibold ${
                                inv.status === "PAID"
                                  ? "bg-green-50 text-green-700 border border-green-200/50"
                                  : inv.status === "OVERDUE"
                                  ? "bg-red-50 text-red-700 border border-red-200/50"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/50"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <a
                                href={`/api/invoices/${inv.id}/pdf`}
                                className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-1 text-3xs font-bold text-white hover:bg-neutral-800 transition-colors"
                              >
                                Download PDF
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-neutral-500">Balance</p>
                  <p
                    className={`mt-2 text-2xl font-semibold ${
                      cashBalance < 0 ? "text-red-600" : "text-neutral-900"
                    }`}
                  >
                    £{cashBalance.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {cashBalance >= 0 ? "In credit" : "Owed"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-neutral-500">Make-up lessons owed</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-900">{makeUpCreditsOwed}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 text-left text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscription.ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-3 text-neutral-500">
                          {entry.date.toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-4 py-3 text-neutral-900">{entry.reason}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          {entry.operation === "CREDIT" ? "+" : "−"}£{entry.amount.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
