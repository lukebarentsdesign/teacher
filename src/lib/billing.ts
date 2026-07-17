import { prisma } from "@/lib/db";
import { stripe, getAppUrl } from "@/lib/stripe";

async function getOrCreateStripeCustomer(teacherId: string): Promise<string> {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (teacher.stripeCustomerId) return teacher.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: teacher.email,
    name: teacher.name,
    metadata: { teacherId },
  });

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/** Checkout Session for the teacher's own flat monthly/annual Learnio subscription. */
export async function createPlatformCheckoutSession(teacherId: string): Promise<string> {
  const priceId = process.env.STRIPE_PLATFORM_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PLATFORM_PRICE_ID is not configured");

  const customerId = await getOrCreateStripeCustomer(teacherId);
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    metadata: { teacherId },
    subscription_data: { metadata: { teacherId } },
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return session.url;
}

/** Stripe-hosted portal for the teacher to manage/cancel their platform subscription. */
export async function createBillingPortalSession(teacherId: string): Promise<string> {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (!teacher.stripeCustomerId) {
    throw new Error("No Stripe customer on file yet — subscribe first");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: teacher.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  return session.url;
}

const STRIPE_TO_PLATFORM_STATUS = {
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "PAST_DUE",
  incomplete_expired: "CANCELED",
  paused: "CANCELED",
} as const;

export function mapStripeSubscriptionStatus(
  status: string
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" {
  return STRIPE_TO_PLATFORM_STATUS[status as keyof typeof STRIPE_TO_PLATFORM_STATUS] ?? "PAST_DUE";
}

// ---------------------------------------------------------------------------
// MVP Smooth-Payment Subscription Calculator
// ---------------------------------------------------------------------------

export * from "./billing-calculations";
