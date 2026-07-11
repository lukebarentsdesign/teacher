"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { studentSchema, newStudentWizardSchema, type WizardPayer } from "@/lib/validations";
import { generateUniqueAccessCode } from "@/lib/access-code";
import { isAtLeast18 } from "@/lib/age";

export async function createStudentAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    dob: formData.get("dob") || undefined,
    discipline: formData.get("discipline"),
    source: formData.get("source"),
    schoolId: formData.get("schoolId") || undefined,
    igCardId: formData.get("igCardId") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { dob, ...rest } = parsed.data;

  await prisma.student.create({
    data: {
      ...rest,
      teacherId: session.user.id,
      dob: dob ? new Date(dob) : undefined,
    },
  });

  revalidatePath("/dashboard/students");
  redirect("/dashboard/students");
}

export type WizardResult = { error?: string; studentId?: string };

/**
 * Resolves a payer entry to an existing Payer id: an explicit payerId wins; otherwise a
 * search-before-create match on (name + phone) or (name + email) among the teacher's payers.
 * Returns the matched id, or null if a new payer should be created. Prevents duplicate households.
 */
async function findExistingPayerId(teacherId: string, entry: WizardPayer): Promise<string | null> {
  if (entry.payerId) return entry.payerId;
  const name = entry.name?.trim();
  if (!name) return null;

  const matches = await prisma.payer.findMany({
    where: {
      teacherId,
      name: { equals: name, mode: "insensitive" },
      OR: [
        ...(entry.phone ? [{ phone: entry.phone }] : []),
        ...(entry.email ? [{ email: { equals: entry.email, mode: "insensitive" as const } }] : []),
      ],
    },
    take: 1,
  });
  return matches[0]?.id ?? null;
}

export async function createStudentWithRelationshipsAction(payload: unknown): Promise<WizardResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const teacherId = session.user.id;

  const parsed = newStudentWizardSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const isAdult = data.dob ? isAtLeast18(new Date(data.dob)) : false;

  // --- Validation rules (server-authoritative; the client mirrors these for UX only) ---
  const billingPayers = data.payers.filter((p) => !p.isEmergencyContactOnly);
  const schoolInvoiced = data.paymentResponsibility === "SCHOOL" && !!data.invoicingSchoolId;

  if (billingPayers.length === 0 && !schoolInvoiced) {
    return { error: "A student needs at least one paying payer, or a school to invoice." };
  }
  if (!isAdult && data.payers.length === 0) {
    return { error: "Under-18 students need at least one payer or emergency contact on file." };
  }
  if (data.paymentResponsibility === "SELF" && !isAdult) {
    return { error: "Only students aged 18 or over can pay for themselves." };
  }

  const newStudentId = await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        teacherId,
        name: data.name,
        dob: data.dob ? new Date(data.dob) : undefined,
        discipline: data.discipline,
        source: data.source,
        schoolId: data.schoolId || undefined,
      },
    });

    for (const [index, entry] of data.payers.entries()) {
      const existingId = await findExistingPayerId(teacherId, entry);
      let payerId = existingId;

      if (!payerId) {
        payerId = (
          await tx.payer.create({
            data: {
              teacherId,
              name: entry.name!.trim(),
              email: entry.email || undefined,
              phone: entry.phone || undefined,
              contactPref: entry.contactPref,
              notes: entry.notes || undefined,
              isSelf: !!entry.isSelf,
              isEmergencyContactOnly: !!entry.isEmergencyContactOnly,
              accessCode: await generateUniqueAccessCode(),
            },
          })
        ).id;
      }

      await tx.studentPayerLink.create({
        data: {
          studentId: student.id,
          payerId,
          // First billing payer is primary; emergency-only contacts are never primary.
          isPrimary: !entry.isEmergencyContactOnly && index === 0,
          splitPercent: entry.splitPercent != null ? entry.splitPercent : undefined,
        },
      });
    }

    return student.id;
  });

  revalidatePath("/dashboard/students");
  return { studentId: newStudentId };
}
