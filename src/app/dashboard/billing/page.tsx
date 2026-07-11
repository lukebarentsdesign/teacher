import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { startCheckoutAction, openBillingPortalAction, disconnectGmailAction } from "./actions";
import { BrandSettingsForm } from "./brand-settings-form";

const STATUS_COPY: Record<string, string> = {
  TRIALING: "You're on a trial — full access, nothing charged yet.",
  ACTIVE: "Your subscription is active.",
  PAST_DUE: "Your last payment failed — please update your card.",
  CANCELED: "Your subscription is cancelled.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; gmail?: string }>;
}) {
  const { checkout, gmail } = await searchParams;
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
      {gmail === "connected" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Gmail connected.</p>
      )}
      {gmail === "error" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          Couldn&apos;t connect Gmail — please try again.
        </p>
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

      <div>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Email</h2>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {teacher.gmailConnected ? (
            <>
              <p className="text-sm text-neutral-600">
                Connected as <span className="font-medium text-neutral-900">{teacher.gmailConnectedEmail}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Emails to guardians are sent from this address.
              </p>
              <form action={disconnectGmailAction} className="mt-4">
                <button
                  type="submit"
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
                >
                  Disconnect
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-600">
                Connect your Gmail so emails to guardians come from your real address, not a generic sender.
              </p>
              <a
                href="/api/gmail/connect"
                className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
              >
                Connect Gmail
              </a>
            </>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Your brand &amp; settings</h2>
        <BrandSettingsForm
          personalBrandColor={teacher.personalBrandColor}
          autoApplyCreditToNextPayment={teacher.autoApplyCreditToNextPayment}
        />
      </div>
    </div>
  );
}
