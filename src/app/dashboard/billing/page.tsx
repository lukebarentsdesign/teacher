import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { startCheckoutAction, openBillingPortalAction } from "./actions";

const STATUS_COPY: Record<string, string> = {
  TRIALING: "You're on a trial — full access, nothing charged yet.",
  ACTIVE: "Your subscription is active.",
  PAST_DUE: "Your last payment failed — please update your card.",
  CANCELED: "Your subscription is cancelled.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const session = await auth();

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Billing</h1>

      {checkout === "success" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Thanks — your subscription is being set up.
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">Checkout cancelled.</p>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Plan status</p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">{teacher.platformStatus}</p>
        <p className="mt-2 text-sm text-neutral-600">{STATUS_COPY[teacher.platformStatus]}</p>

        <div className="mt-4">
          {teacher.platformSubscriptionId ? (
            <form action={openBillingPortalAction}>
              <button
                type="submit"
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
              >
                Manage billing
              </button>
            </form>
          ) : (
            <form action={startCheckoutAction}>
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
              >
                Subscribe to Learnio
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
