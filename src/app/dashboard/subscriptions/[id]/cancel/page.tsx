import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { previewCancellationPayout } from "@/lib/ledger";
import { ConfirmCancellationButton } from "./confirm-cancellation-button";

export default async function CancelSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { student: true, payer: true },
  });

  if (!subscription) notFound();

  const payout = await previewCancellationPayout(id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Cancel {subscription.student.name}&apos;s subscription
      </h1>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Current cash balance</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">
          £{payout.cashBalance.toFixed(2)}
        </p>

        {payout.refundOwedToParent > 0 && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            {subscription.payer.name} has paid more than they&apos;ve consumed —{" "}
            <strong>£{payout.refundOwedToParent.toFixed(2)} refund owed</strong> to them.
          </p>
        )}

        {payout.amountOwedToTeacher > 0 && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {subscription.payer.name} has consumed more than they&apos;ve paid —{" "}
            <strong>£{payout.amountOwedToTeacher.toFixed(2)} owed to you</strong>.
          </p>
        )}

        {payout.cashBalance === 0 && (
          <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            Balance is exactly zero — nothing owed either way.
          </p>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Cancelling only marks the subscription as cancelled — it doesn&apos;t automatically move
        money. Issue the refund or invoice the amount owed yourself, then record it against this
        subscription&apos;s ledger.
      </p>

      <div className="flex items-center gap-3">
        <ConfirmCancellationButton subscriptionId={subscription.id} />
        <Link
          href={`/dashboard/subscriptions/${subscription.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
