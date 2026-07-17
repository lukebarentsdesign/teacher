import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { calculateCashBalance, calculateMakeUpCreditsOwed } from "@/lib/ledger";
import { getCurrentContract, getAcceptanceForContract } from "@/lib/contracts";
import { RecordPaymentForm } from "./record-payment-form";
import { RequestPaymentForm } from "./request-payment-form";
import { generateInvoiceAction } from "./actions";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [subscription, teacher] = await Promise.all([
    prisma.subscription.findFirst({
      where: { id, student: { teacherId: session!.user.id } },
      include: {
        student: true,
        payer: true,
        ledgerEntries: { orderBy: { date: "desc" } },
        invoices: { orderBy: { issueDate: "desc" } },
      },
    }),
    prisma.teacher.findUniqueOrThrow({ where: { id: session!.user.id } }),
  ]);

  if (!subscription) notFound();

  const cashBalance = calculateCashBalance(subscription.ledgerEntries);
  const makeUpCreditsOwed = calculateMakeUpCreditsOwed(subscription.ledgerEntries);

  const currentContract = await getCurrentContract(session!.user.id);
  const acceptance = currentContract
    ? await getAcceptanceForContract(subscription.payerId, currentContract.version)
    : null;

  const calcSnapshot = subscription.calculationSnapshot as any;

  async function handleGenerateInvoice() {
    "use server";
    await generateInvoiceAction(id);
  }

  return (
    <div className="max-w-2xl space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {subscription.student.name} — subscription
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Payer: {subscription.payer.name} · {subscription.billingModel} · {subscription.status}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-neutral-100">
          <p className="text-sm text-neutral-500 font-medium">Cash balance</p>
          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${
              cashBalance < 0 ? "text-red-600" : "text-neutral-900"
            }`}
          >
            £{cashBalance.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {cashBalance >= 0 ? "In credit" : "Owed to teacher"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-neutral-100">
          <p className="text-sm text-neutral-500 font-medium">Make-up lessons owed</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{makeUpCreditsOwed}</p>
          <p className="mt-1 text-xs text-neutral-400">Lessons to reschedule</p>
        </div>
      </div>

      {calcSnapshot && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-neutral-100 space-y-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Billing Plan</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
            <div className="flex justify-between border-b border-neutral-50 pb-2">
              <span className="text-neutral-400">Total Lessons:</span>
              <span className="font-semibold text-neutral-900">{calcSnapshot.lessonCount}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-50 pb-2">
              <span className="text-neutral-400">Lesson Price:</span>
              <span className="font-semibold text-neutral-900">£{Number(calcSnapshot.lessonPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-50 pb-2">
              <span className="text-neutral-400">Spread Over:</span>
              <span className="font-semibold text-neutral-900">{calcSnapshot.months} months</span>
            </div>
            <div className="flex justify-between border-b border-neutral-50 pb-2">
              <span className="text-neutral-400">Monthly Cost:</span>
              <span className="font-semibold text-brand-600 font-bold">£{Number(calcSnapshot.monthlyAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {currentContract && (
        <div
          className={`rounded-xl p-4 text-sm shadow-sm border ${
            acceptance ? "bg-white text-neutral-600 border-neutral-100" : "bg-amber-50 text-amber-800 border-amber-100"
          }`}
        >
          {acceptance ? (
            <>
              {subscription.payer.name} accepted contract v{acceptance.contractVersion} on{" "}
              {acceptance.acceptedAt.toLocaleDateString("en-GB")}.
            </>
          ) : (
            <>
              {subscription.payer.name} hasn&apos;t accepted the current contract (v
              {currentContract.version}) yet — lesson booking and payment collection are blocked
              until they do.
            </>
          )}
        </div>
      )}

      {subscription.status === "ACTIVE" && (
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-neutral-100">
          <p className="text-sm text-neutral-600">Cancelling calculates the payout automatically.</p>
          <Link
            href={`/dashboard/subscriptions/${subscription.id}/cancel`}
            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            Cancel subscription
          </Link>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">Invoices</h2>
          <form action={handleGenerateInvoice}>
            <button
              type="submit"
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-neutral-800 shadow-sm"
            >
              Generate Invoice
            </button>
          </form>
        </div>
        {subscription.invoices.length === 0 ? (
          <p className="text-sm text-neutral-500 bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center">
            No invoices generated yet. Use the button above to compile outstanding ledger entries.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-neutral-100">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice No.</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscription.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-neutral-500">{inv.issueDate.toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-neutral-500">{inv.dueDate.toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-neutral-900 font-semibold">£{inv.amount.toString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${
                        inv.status === "PAID" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Request a payment from the parent</h2>
        {Number(subscription.creditAppliedNextPeriod) > 0 && (
          <p className="mb-2 text-sm text-neutral-500">
            Credit available: £{Number(subscription.creditAppliedNextPeriod).toFixed(2)}
            {teacher.autoApplyCreditToNextPayment
              ? " — already subtracted from the suggested amount below."
              : " — not auto-applied (see Billing settings); account for it manually if needed."}
          </p>
        )}
        {teacher.stripeConnectOnboarded ? (
          <RequestPaymentForm
            subscriptionId={subscription.id}
            creditAppliedNextPeriod={Number(subscription.creditAppliedNextPeriod)}
            autoApplyCredit={teacher.autoApplyCreditToNextPayment}
          />
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm text-neutral-500 shadow-sm border border-neutral-100">
            <Link href="/dashboard/payments" className="text-neutral-900 underline">
              Connect Stripe
            </Link>{" "}
            first so payments can land with you.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Record a payment manually</h2>
        <RecordPaymentForm subscriptionId={subscription.id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Ledger</h2>
        {subscription.ledgerEntries.length === 0 ? (
          <p className="text-sm text-neutral-500">No entries yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-neutral-100">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Operation</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {subscription.ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-neutral-500">
                      {entry.date.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 font-medium">
                      {entry.reason}
                      {entry.invoiceId && (
                        <span className="ml-2 text-2xs text-neutral-400 font-normal">
                          (Invoiced)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{entry.operation}</td>
                    <td className="px-4 py-3 text-neutral-500 font-semibold">£{entry.amount.toString()}</td>
                    <td className="px-4 py-3 text-neutral-400">{entry.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
