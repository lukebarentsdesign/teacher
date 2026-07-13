import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { mapStripeSubscriptionStatus } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { postPayment } from "@/lib/ledger";

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
  if (session.mode === "subscription") {
    await handlePlatformCheckoutCompleted(session);
  } else if (session.mode === "payment") {
    // Two different "payment" mode Checkout flows share this endpoint — courseId in metadata
    // distinguishes a Course purchase from an ordinary parent-pays-the-ledger payment.
    if (session.metadata?.courseId) {
      await handleCoursePurchaseCheckoutCompleted(session);
    } else {
      await handleParentPaymentCheckoutCompleted(session);
    }
  }
}

async function handlePlatformCheckoutCompleted(session: Stripe.Checkout.Session) {
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

/** A parent paying a Subscription's ledger — creates the Payment row and posts a ledger credit. */
async function handleParentPaymentCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.metadata?.subscriptionId;
  if (!subscriptionId || typeof session.payment_intent !== "string") return;

  const existing = await prisma.payment.findUnique({
    where: { stripePaymentId: session.payment_intent },
  });
  if (existing) return; // webhook retry — already recorded

  const amount = (session.amount_total ?? 0) / 100;

  await prisma.payment.create({
    data: {
      subscriptionId,
      stripePaymentId: session.payment_intent,
      amount,
      status: "SUCCEEDED",
    },
  });

  await postPayment(subscriptionId, amount, "Parent payment via Stripe Checkout");
}

/**
 * A guardian buying a Course via Stripe — creates CoursePurchase directly (not via the ledger;
 * see "Sellable Course Content" in CLAUDE.md for why CoursePurchase deliberately doesn't touch
 * LedgerEntry). Idempotent via the same unique (courseId, payerId) constraint the manual
 * teacher-recorded path already relies on.
 */
async function handleCoursePurchaseCheckoutCompleted(session: Stripe.Checkout.Session) {
  const courseId = session.metadata?.courseId;
  const payerId = session.metadata?.payerId;
  if (!courseId || !payerId) return;

  const existing = await prisma.coursePurchase.findUnique({
    where: { courseId_payerId: { courseId, payerId } },
  });
  if (existing) return; // webhook retry — already recorded

  const amountPaid = (session.amount_total ?? 0) / 100;

  await prisma.coursePurchase.create({
    data: { courseId, payerId, amountPaid },
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
