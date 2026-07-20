import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { startConnectOnboardingAction } from "./actions";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; refresh?: string }>;
}) {
  const { onboarding } = await searchParams;
  const session = await auth();

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Getting paid by parents</h1>
      <p className="text-sm text-neutral-500">
        Connect a Stripe account so parent payments land directly with you — TeachBase never holds
        or takes a cut of lesson payments.
      </p>

      {onboarding === "complete" && !teacher.stripeConnectOnboarded && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe is still finishing verification — this page will update automatically once
          they&apos;ve confirmed your details.
        </p>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Status</p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          {teacher.stripeConnectOnboarded ? "Connected" : "Not connected yet"}
        </p>

        {!teacher.stripeConnectOnboarded && (
          <form action={startConnectOnboardingAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
            >
              Connect with Stripe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
