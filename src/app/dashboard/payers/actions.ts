"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { payerSchema } from "@/lib/validations";
import { generateUniqueAccessCode } from "@/lib/access-code";

export async function createPayerAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = payerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    contactPref: formData.get("contactPref") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const accessCode = await generateUniqueAccessCode();

  await prisma.payer.create({
    data: { ...parsed.data, teacherId: session.user.id, accessCode },
  });

  revalidatePath("/dashboard/payers");
  redirect("/dashboard/payers");
}

export async function updatePayerAction(
  payerId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const payer = await prisma.payer.findFirst({ where: { id: payerId, teacherId: session.user.id } });
  if (!payer) return "Payer not found";

  const parsed = payerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    contactPref: formData.get("contactPref") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.payer.update({ where: { id: payerId }, data: parsed.data });

  revalidatePath(`/dashboard/payers/${payerId}`);
  revalidatePath("/dashboard/payers");
  redirect(`/dashboard/payers/${payerId}`);
}

export async function regenerateAccessCodeAction(payerId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const accessCode = await generateUniqueAccessCode();
  await prisma.payer.updateMany({
    where: { id: payerId, teacherId: session.user.id },
    data: { accessCode, accessCodeUpdatedAt: new Date() },
  });
  revalidatePath("/dashboard/payers");
}
