"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { postPayment, cancelSubscription } from "@/lib/ledger";

const recordPaymentSchema = z.object({
  subscriptionId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
});

export async function recordPaymentAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = recordPaymentSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await postPayment(parsed.data.subscriptionId, parsed.data.amount, parsed.data.note);

  revalidatePath(`/dashboard/subscriptions/${parsed.data.subscriptionId}`);
}

export async function confirmCancellationAction(subscriptionId: string) {
  await cancelSubscription(subscriptionId);
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}`);
}
