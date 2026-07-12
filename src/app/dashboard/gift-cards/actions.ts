"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { postPayment } from "@/lib/ledger";

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

const createSchema = z.object({
  initialValue: z.coerce.number().positive("Value must be more than 0"),
  purchasedByPayerId: z.string().optional(),
});

export async function createGiftCardAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = createSchema.safeParse({
    initialValue: formData.get("initialValue"),
    purchasedByPayerId: formData.get("purchasedByPayerId") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  if (parsed.data.purchasedByPayerId) {
    const payer = await prisma.payer.findFirst({
      where: { id: parsed.data.purchasedByPayerId, teacherId: session.user.id },
    });
    if (!payer) return "Payer not found";
  }

  await prisma.giftCard.create({
    data: {
      teacherId: session.user.id,
      code: generateCode(),
      initialValue: parsed.data.initialValue,
      remainingBalance: parsed.data.initialValue,
      purchasedByPayerId: parsed.data.purchasedByPayerId || null,
    },
  });

  revalidatePath("/dashboard/gift-cards");
}

const redeemSchema = z.object({
  code: z.string().trim().min(1, "Enter a gift card code"),
  subscriptionId: z.string().min(1, "Pick a subscription"),
  amount: z.coerce.number().positive("Amount must be more than 0"),
});

export async function redeemGiftCardAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = redeemSchema.safeParse({
    code: formData.get("code"),
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const giftCard = await prisma.giftCard.findFirst({
    where: { code: parsed.data.code.toUpperCase(), teacherId: session.user.id },
  });
  if (!giftCard) return "Gift card not found";
  if (Number(giftCard.remainingBalance) < parsed.data.amount) return "Amount exceeds remaining balance";

  const subscription = await prisma.subscription.findFirst({
    where: { id: parsed.data.subscriptionId, student: { teacherId: session.user.id } },
  });
  if (!subscription) return "Subscription not found";

  await prisma.$transaction([
    prisma.giftCard.update({
      where: { id: giftCard.id },
      data: { remainingBalance: { decrement: parsed.data.amount } },
    }),
  ]);
  await postPayment(subscription.id, parsed.data.amount, `giftcard:${giftCard.code}`);

  revalidatePath("/dashboard/gift-cards");
}

export async function deleteGiftCardAction(giftCardId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.giftCard.deleteMany({ where: { id: giftCardId, teacherId: session.user.id } });
  revalidatePath("/dashboard/gift-cards");
}
