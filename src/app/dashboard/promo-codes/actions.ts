"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { postManualCorrection } from "@/lib/ledger";
import { isPromoCodeValid, computeDiscountAmount } from "@/lib/promo-code";
import { hasModule } from "@/lib/modules";

const createSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  discountType: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Value must be more than 0"),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  lessonTypeId: z.string().optional(),
});

export async function createPromoCodeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "COMMERCE"))) {
    return "The Commerce add-ons module isn't enabled on this account";
  }

  const parsed = createSchema.safeParse({
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    value: formData.get("value"),
    validFrom: formData.get("validFrom") || undefined,
    validTo: formData.get("validTo") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    lessonTypeId: formData.get("lessonTypeId") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.promoCode.findUnique({
    where: { teacherId_code: { teacherId: session.user.id, code: parsed.data.code.toUpperCase() } },
  });
  if (existing) return "You already have a promo code with that name";

  await prisma.promoCode.create({
    data: {
      teacherId: session.user.id,
      code: parsed.data.code.toUpperCase(),
      discountType: parsed.data.discountType,
      value: parsed.data.value,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
      validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : null,
      usageLimit: parsed.data.usageLimit ?? null,
      lessonTypeId: parsed.data.lessonTypeId || null,
    },
  });

  revalidatePath("/dashboard/promo-codes");
}

const applySchema = z.object({
  code: z.string().trim().min(1, "Enter a promo code"),
  subscriptionId: z.string().min(1, "Pick a subscription"),
  baseAmount: z.coerce.number().positive("Amount must be more than 0"),
});

/** Posts a MANUAL_CORRECTION credit for the discount and increments the usage counter. */
export async function applyPromoCodeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = applySchema.safeParse({
    code: formData.get("code"),
    subscriptionId: formData.get("subscriptionId"),
    baseAmount: formData.get("baseAmount"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const promo = await prisma.promoCode.findFirst({
    where: { code: parsed.data.code.toUpperCase(), teacherId: session.user.id },
  });
  if (!promo) return "Promo code not found";

  const validity = isPromoCodeValid(
    { ...promo, value: Number(promo.value) },
    new Date()
  );
  if (!validity.valid) return validity.reason ?? "Promo code not valid";

  const subscription = await prisma.subscription.findFirst({
    where: { id: parsed.data.subscriptionId, student: { teacherId: session.user.id } },
  });
  if (!subscription) return "Subscription not found";

  const discount = computeDiscountAmount({ discountType: promo.discountType, value: Number(promo.value) }, parsed.data.baseAmount);

  await postManualCorrection(subscription.id, discount, "CREDIT", `promo:${promo.code}`);
  await prisma.promoCode.update({ where: { id: promo.id }, data: { timesUsed: { increment: 1 } } });

  revalidatePath("/dashboard/promo-codes");
}

export async function deletePromoCodeAction(promoCodeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.promoCode.deleteMany({ where: { id: promoCodeId, teacherId: session.user.id } });
  revalidatePath("/dashboard/promo-codes");
}
