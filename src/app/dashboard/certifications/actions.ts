"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const certSchema = z.object({
  certType: z.string().trim().min(1, "Certification type is required"),
  certNumber: z.string().trim().optional(),
  issuedDate: z.string().min(1, "Issued date is required"),
  expiryDate: z.string().optional(),
  reminderDaysBefore: z.coerce.number().int().positive().optional(),
});

export async function createCertificationAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = certSchema.safeParse({
    certType: formData.get("certType"),
    certNumber: formData.get("certNumber") || undefined,
    issuedDate: formData.get("issuedDate"),
    expiryDate: formData.get("expiryDate") || undefined,
    reminderDaysBefore: formData.get("reminderDaysBefore") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.instructorCertification.create({
    data: {
      teacherId: session.user.id,
      certType: parsed.data.certType,
      certNumber: parsed.data.certNumber || null,
      issuedDate: new Date(parsed.data.issuedDate),
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      reminderDaysBefore: parsed.data.reminderDaysBefore ?? null,
    },
  });

  revalidatePath("/dashboard/certifications");
}

export async function deleteCertificationAction(certId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.instructorCertification.deleteMany({ where: { id: certId, teacherId: session.user.id } });
  revalidatePath("/dashboard/certifications");
}
