"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { postPayment, cancelSubscription } from "@/lib/ledger";
import { createParentPaymentCheckoutSession } from "@/lib/payments";

const recordPaymentSchema = z.object({
  subscriptionId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
});

async function assertOwnsSubscription(subscriptionId: string, teacherId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, student: { teacherId } },
    select: { id: true },
  });
  return !!subscription;
}

export async function recordPaymentAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = recordPaymentSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  if (!(await assertOwnsSubscription(parsed.data.subscriptionId, session.user.id))) {
    return "Subscription not found";
  }

  await postPayment(parsed.data.subscriptionId, parsed.data.amount, parsed.data.note);

  revalidatePath(`/dashboard/subscriptions/${parsed.data.subscriptionId}`);
}

const requestPaymentSchema = z.object({
  subscriptionId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  resetCredit: z.string().optional(),
});

export type RequestPaymentState =
  | { error?: string; url?: string; chargedAmount?: number; creditApplied?: number }
  | undefined;

export async function requestPaymentAction(
  _prevState: RequestPaymentState,
  formData: FormData
): Promise<RequestPaymentState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = requestPaymentSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
    resetCredit: formData.get("resetCredit") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { id: parsed.data.subscriptionId, student: { teacherId: session.user.id } },
  });
  if (!subscription) return { error: "Subscription not found" };

  const creditToApply = parsed.data.resetCredit === "true" ? Number(subscription.creditAppliedNextPeriod) : 0;
  const chargedAmount = Math.max(0, parsed.data.amount - creditToApply);

  try {
    const url = await createParentPaymentCheckoutSession(parsed.data.subscriptionId, chargedAmount);

    if (creditToApply > 0) {
      await prisma.subscription.update({
        where: { id: parsed.data.subscriptionId },
        data: { creditAppliedNextPeriod: 0 },
      });
    }

    return { url, chargedAmount, creditApplied: creditToApply > 0 ? creditToApply : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create payment link" };
  }
}

export async function confirmCancellationAction(subscriptionId: string) {
  const session = await auth();
  if (!session?.user?.id || !(await assertOwnsSubscription(subscriptionId, session.user.id))) {
    return;
  }

  await cancelSubscription(subscriptionId);
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}`);
}
