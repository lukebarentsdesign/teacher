import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { mapStripeSubscriptionStatus } from "@/lib/billing";
import { prisma } from "@/lib/db";

/**
 * Single webhook endpoint for both Learnio's own platform billing (this teacher paying us) and
 * Stripe Connect events (their connected account status). Connect events arrive with `event.account`
 * set to the connected account ID; platform events don't have it.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handlePlatformSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "account.updated":
      await handleConnectAccountUpdated(event.data.object as Stripe.Account);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const teacherId = session.metadata?.teacherId;
  if (!teacherId || typeof session.subscription !== "string") return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      platformSubscriptionId: subscription.id,
      platformStatus: mapStripeSubscriptionStatus(subscription.status),
    },
  });
}

async function handlePlatformSubscriptionChange(subscription: Stripe.Subscription) {
  const teacherId = subscription.metadata?.teacherId;
  if (!teacherId) return;

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      platformSubscriptionId: subscription.id,
      platformStatus: mapStripeSubscriptionStatus(subscription.status),
    },
  });
}

async function handleConnectAccountUpdated(account: Stripe.Account) {
  const teacher = await prisma.teacher.findUnique({
    where: { stripeConnectAccountId: account.id },
  });
  if (!teacher) return;

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: { stripeConnectOnboarded: Boolean(account.details_submitted && account.charges_enabled) },
  });
}
