"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { payerSchema } from "@/lib/validations";
import { generateUniqueAccessCode } from "@/lib/access-code";

export async function createPayerAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = payerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const accessCode = await generateUniqueAccessCode();

  await prisma.payer.create({
    data: { ...parsed.data, accessCode },
  });

  revalidatePath("/dashboard/payers");
  redirect("/dashboard/payers");
}

export async function regenerateAccessCodeAction(payerId: string) {
  const accessCode = await generateUniqueAccessCode();
  await prisma.payer.update({
    where: { id: payerId },
    data: { accessCode, accessCodeUpdatedAt: new Date() },
  });
  revalidatePath("/dashboard/payers");
}
