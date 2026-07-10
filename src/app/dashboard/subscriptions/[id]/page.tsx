import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { calculateCashBalance, calculateMakeUpCreditsOwed } from "@/lib/ledger";
import { getCurrentContract, getAcceptanceForContract } from "@/lib/contracts";
import { RecordPaymentForm } from "./record-payment-form";
import { RequestPaymentForm } from "./request-payment-form";

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

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {subscription.student.name} — subscription
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Payer: {subscription.payer.name} · {subscription.billingModel} · {subscription.status}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Cash balance</p>
          <p
            className={`mt-2 text-3xl font-semibold ${
              cashBalance < 0 ? "text-red-600" : "text-neutral-900"
            }`}
          >
            £{cashBalance.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {cashBalance >= 0 ? "In credit" : "Owed to teacher"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Make-up lessons owed</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{makeUpCreditsOwed}</p>
        </div>
      </div>

      {currentContract && (
        <div
          className={`rounded-xl p-4 text-sm shadow-sm ${
            acceptance ? "bg-white text-neutral-600" : "bg-amber-50 text-amber-800"
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
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-600">Cancelling calculates the payout automatically.</p>
          <Link
            href={`/dashboard/subscriptions/${subscription.id}/cancel`}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            Cancel subscription
          </Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Request a payment from the parent</h2>
        {teacher.stripeConnectOnboarded ? (
          <RequestPaymentForm subscriptionId={subscription.id} />
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm text-neutral-500 shadow-sm">
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
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
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
                  <tr key={entry.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-500">
                      {entry.date.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-neutral-900">{entry.reason}</td>
                    <td className="px-4 py-3 text-neutral-500">{entry.operation}</td>
                    <td className="px-4 py-3 text-neutral-500">£{entry.amount.toString()}</td>
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
