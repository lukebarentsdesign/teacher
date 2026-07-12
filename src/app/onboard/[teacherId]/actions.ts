"use server";

import { prisma } from "@/lib/db";
import { selfServeOnboardingSchema } from "@/lib/validations";
import { generateUniqueAccessCode } from "@/lib/access-code";
import { isAtLeast18 } from "@/lib/age";

export type SelfServeResult = { error?: string; success?: boolean };

/**
 * Public, unauthenticated submission — no session, teacherId comes from the URL the teacher
 * shared. Mirrors createStudentWithRelationshipsAction's validation rules exactly (spec Part 4.2
 * reuses Part 2 Step 2-3's payer-resolution branch verbatim), but always lands as
 * status: PENDING_REVIEW rather than the wizard's implicit ACTIVE — nothing here is live until the
 * teacher reviews and approves it, so a bad submission or mis-picked lesson type can't silently
 * create a real enrolment.
 */
export async function submitSelfServeOnboardingAction(
  teacherId: string,
  _prevState: SelfServeResult,
  formData: FormData
): Promise<SelfServeResult> {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return { error: "This onboarding link is no longer valid." };

  const rawPayers = JSON.parse((formData.get("payers") as string) || "[]");

  const parsed = selfServeOnboardingSchema.safeParse({
    name: formData.get("name"),
    dob: formData.get("dob") || undefined,
    lessonTypeId: formData.get("lessonTypeId"),
    paymentResponsibility: formData.get("paymentResponsibility"),
    locationId: formData.get("locationId") || undefined,
    invoicingSchoolId: formData.get("invoicingSchoolId") || undefined,
    payers: rawPayers,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const lessonType = await prisma.lessonType.findFirst({
    where: { id: data.lessonTypeId, teacherId, active: true },
  });
  if (!lessonType) return { error: "That lesson type is no longer available." };

  const isAdult = data.dob ? isAtLeast18(new Date(data.dob)) : false;

  const billingPayers = data.payers.filter((p) => !p.isEmergencyContactOnly);
  const locationInvoiced = data.paymentResponsibility === "SCHOOL" && !!data.invoicingSchoolId;

  if (billingPayers.length === 0 && !locationInvoiced) {
    return { error: "Add at least one paying contact, or select the school to invoice." };
  }
  if (!isAdult && data.payers.length === 0) {
    return { error: "Under-18 students need at least one parent/guardian or emergency contact." };
  }
  if (data.paymentResponsibility === "SELF" && !isAdult) {
    return { error: "Only students aged 18 or over can pay for themselves." };
  }

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        teacherId,
        name: data.name,
        dob: data.dob ? new Date(data.dob) : undefined,
        discipline: lessonType.name,
        source: "SCHOOL_INQUIRY",
        locationId: data.locationId || undefined,
        status: "PENDING_REVIEW",
        requestedLessonTypeId: lessonType.id,
      },
    });

    for (const [index, entry] of data.payers.entries()) {
      const name = entry.name?.trim();
      if (!name) continue;

      const existing = await tx.payer.findFirst({
        where: {
          teacherId,
          name: { equals: name, mode: "insensitive" },
          OR: [
            ...(entry.phone ? [{ phone: entry.phone }] : []),
            ...(entry.email ? [{ email: { equals: entry.email, mode: "insensitive" as const } }] : []),
          ],
        },
      });

      const payerId = existing
        ? existing.id
        : (
            await tx.payer.create({
              data: {
                teacherId,
                name,
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

      await tx.studentPayerLink.create({
        data: {
          studentId: student.id,
          payerId,
          isPrimary: !entry.isEmergencyContactOnly && index === 0,
          splitPercent: entry.splitPercent != null ? entry.splitPercent : undefined,
        },
      });
    }
  });

  return { success: true };
}
