import { prisma } from "@/lib/db";
import { stripe, getAppUrl } from "@/lib/stripe";

/**
 * Same destination-charge pattern as createParentPaymentCheckoutSession (src/lib/payments.ts) —
 * money lands with the teacher's connected account, no platform take-rate. Distinct metadata key
 * (courseId, not subscriptionId) so the shared webhook can tell the two "payment" mode Checkout
 * sessions apart — see handleCheckoutSessionCompleted in the webhook route.
 */
export async function createCoursePurchaseCheckoutSession(courseId: string, payerId: string): Promise<string> {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: { teacher: true },
  });

  if (!course.price) throw new Error("This course is free — no payment needed");
  if (!course.isPublished) throw new Error("This course isn't published yet");

  const teacher = course.teacher;
  if (!teacher.stripeConnectAccountId || !teacher.stripeConnectOnboarded) {
    throw new Error("The teacher hasn't finished connecting Stripe yet");
  }

  const existing = await prisma.coursePurchase.findUnique({
    where: { courseId_payerId: { courseId, payerId } },
  });
  if (existing) throw new Error("Already purchased");

  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(Number(course.price) * 100),
          product_data: { name: course.title },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: teacher.stripeConnectAccountId },
    },
    metadata: { courseId, payerId },
    success_url: `${appUrl}/parent/course-purchase-return?status=success`,
    cancel_url: `${appUrl}/parent/course-purchase-return?status=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return session.url;
}
