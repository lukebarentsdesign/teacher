import { prisma } from "@/lib/db";
import { stripe, getAppUrl } from "@/lib/stripe";

async function getOrCreateConnectAccount(teacherId: string): Promise<string> {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (teacher.stripeConnectAccountId) return teacher.stripeConnectAccountId;

  const account = await stripe.accounts.create({
    type: "express",
    email: teacher.email,
    business_type: "individual",
    metadata: { teacherId },
  });

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { stripeConnectAccountId: account.id },
  });

  return account.id;
}

/**
 * Stripe-hosted Express onboarding link. `refresh_url` is where Stripe sends the teacher back if
 * the link expires mid-flow (must re-request a fresh one); `return_url` is where they land after
 * completing (or abandoning) onboarding — actual completion is confirmed via the account.updated
 * webhook, not by trusting this redirect alone.
 */
export async function createConnectOnboardingLink(teacherId: string): Promise<string> {
  const accountId = await getOrCreateConnectAccount(teacherId);
  const appUrl = getAppUrl();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard/payments?refresh=true`,
    return_url: `${appUrl}/dashboard/payments?onboarding=complete`,
    type: "account_onboarding",
  });

  return accountLink.url;
}
