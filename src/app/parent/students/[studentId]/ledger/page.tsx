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
    include: { payer: true, ledgerEntries: { orderBy: { date: "desc" } } },
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
            <div key={subscription.id} className="space-y-4">
              <a
                href={`/api/subscriptions/${subscription.id}/invoice`}
                className="inline-block rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100"
              >
                Download invoice PDF
              </a>
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
