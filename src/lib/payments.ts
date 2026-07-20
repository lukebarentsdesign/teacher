import { prisma } from "@/lib/db";
import { stripe, getAppUrl } from "@/lib/stripe";
import { hasAcceptedCurrentContract } from "@/lib/contracts";

/**
 * Creates a Checkout Session for a parent to pay a Subscription directly, using a destination
 * charge so the money lands with the teacher's connected account (minus Stripe's processing
 * fees) rather than TeachBase's platform account. No application fee is taken — see CLAUDE.md.
 *
 * There's no full parent microsite yet (calendar/ledger view is a later build step), so this
 * returns a shareable URL for the teacher to send the parent themselves, rather than emailing it
 * automatically. Parent contract acceptance (src/app/parent) is the one piece of parent-facing
 * auth that already exists, and this function gates on it.
 */
export async function createParentPaymentCheckoutSession(
  subscriptionId: string,
  amount: number
): Promise<string> {
  const subscription = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
    include: { student: { include: { teacher: true } }, payer: true },
  });

  const teacher = subscription.student.teacher;
  if (!teacher.stripeConnectAccountId || !teacher.stripeConnectOnboarded) {
    throw new Error("Teacher hasn't finished connecting Stripe yet");
  }

  if (!(await hasAcceptedCurrentContract(subscription.payerId, teacher.id))) {
    throw new Error(
      "This payer hasn't accepted the current contract yet — ask them to log in and accept it before paying."
    );
  }

  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `Lesson payment — ${subscription.student.name}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: teacher.stripeConnectAccountId },
    },
    metadata: { subscriptionId },
    success_url: `${appUrl}/pay/${subscriptionId}?status=success`,
    cancel_url: `${appUrl}/pay/${subscriptionId}?status=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return session.url;
}
