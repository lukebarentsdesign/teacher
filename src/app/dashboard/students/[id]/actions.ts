"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { subscriptionSchema } from "@/lib/validations";
import { z } from "zod";

const linkPayerSchema = z.object({
  studentId: z.string().min(1),
  payerId: z.string().min(1),
});

export async function linkPayerAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = linkPayerSchema.safeParse({
    studentId: formData.get("studentId"),
    payerId: formData.get("payerId"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const existingLinkCount = await prisma.studentPayerLink.count({
    where: { studentId: parsed.data.studentId },
  });

  await prisma.studentPayerLink.create({
    data: {
      studentId: parsed.data.studentId,
      payerId: parsed.data.payerId,
      isPrimary: existingLinkCount === 0,
    },
  });

  revalidatePath(`/dashboard/students/${parsed.data.studentId}`);
}

export async function createSubscriptionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = subscriptionSchema.safeParse({
    studentId: formData.get("studentId"),
    payerId: formData.get("payerId"),
    annualFee: formData.get("annualFee"),
    billingModel: formData.get("billingModel"),
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { startDate, ...rest } = parsed.data;

  await prisma.subscription.create({
    data: {
      ...rest,
      startDate: new Date(startDate),
    },
  });

  revalidatePath(`/dashboard/students/${parsed.data.studentId}`);
}
