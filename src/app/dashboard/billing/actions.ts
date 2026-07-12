"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createPlatformCheckoutSession, createBillingPortalSession } from "@/lib/billing";
import { teacherBrandSchema } from "@/lib/validations";
import { disconnectGmailAccount } from "@/lib/gmail";

export async function startCheckoutAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const url = await createPlatformCheckoutSession(session.user.id);
  redirect(url);
}

export async function openBillingPortalAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const url = await createBillingPortalSession(session.user.id);
  redirect(url);
}

export async function updateBrandSettingsAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = teacherBrandSchema.safeParse({
    personalBrandColor: formData.get("personalBrandColor") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.teacher.update({
    where: { id: session.user.id },
    data: {
      personalBrandColor: parsed.data.personalBrandColor,
      autoApplyCreditToNextPayment: formData.get("autoApplyCreditToNextPayment") === "true",
    },
  });

  revalidatePath("/dashboard/billing");
}

const emergencyContactSchema = z.object({
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  emergencyContactEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
});

export async function updateEmergencyContactAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = emergencyContactSchema.safeParse({
    emergencyContactName: formData.get("emergencyContactName") || undefined,
    emergencyContactPhone: formData.get("emergencyContactPhone") || undefined,
    emergencyContactEmail: formData.get("emergencyContactEmail") || "",
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.teacher.update({
    where: { id: session.user.id },
    data: {
      emergencyContactName: parsed.data.emergencyContactName || null,
      emergencyContactPhone: parsed.data.emergencyContactPhone || null,
      emergencyContactEmail: parsed.data.emergencyContactEmail || null,
    },
  });

  revalidatePath("/dashboard/billing");
}

export async function disconnectGmailAction() {
  const session = await auth();
  if (!session?.user?.id) return;

  await disconnectGmailAccount(session.user.id);
  revalidatePath("/dashboard/billing");
}
