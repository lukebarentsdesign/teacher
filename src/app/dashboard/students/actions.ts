"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { newStudentWizardSchema, type WizardPayer } from "@/lib/validations";
import { generateUniqueAccessCode } from "@/lib/access-code";
import { isAtLeast18 } from "@/lib/age";

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
  const locationInvoiced = data.paymentResponsibility === "SCHOOL" && !!data.invoicingSchoolId;

  if (billingPayers.length === 0 && !locationInvoiced) {
    return { error: "A student needs at least one paying payer, or a teaching location to invoice." };
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
        locationId: data.locationId || undefined,
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

const editStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  dob: z.string().optional(),
  discipline: z.string().trim().min(1, "Discipline is required"),
  source: z.enum(["HOME", "SCHOOL_INQUIRY", "COLLEGE"]),
  locationId: z.string().optional(),
});

/** Edits the student's own core fields — separate from payer/subject relationships, which have
 * their own management UI elsewhere on the detail page. */
export async function updateStudentAction(
  studentId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  });
  if (!student) return "Student not found";

  const parsed = editStudentSchema.safeParse({
    name: formData.get("name"),
    dob: formData.get("dob") || undefined,
    discipline: formData.get("discipline"),
    source: formData.get("source"),
    locationId: formData.get("locationId") || undefined,
  });

  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.student.update({
    where: { id: studentId },
    data: {
      name: parsed.data.name,
      dob: parsed.data.dob ? new Date(parsed.data.dob) : null,
      discipline: parsed.data.discipline,
      source: parsed.data.source,
      locationId: parsed.data.locationId ?? null,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/students");
  redirect(`/dashboard/students/${studentId}`);
}

/** Sets the student's IG Card wallet-pass identifier, used only for CheckIn scan lookups. */
export async function updateIgCardIdAction(
  studentId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const igCardId = (formData.get("igCardId") as string)?.trim() || null;

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  });
  if (!student) return "Student not found";

  await prisma.student.update({ where: { id: studentId }, data: { igCardId } });
  revalidatePath(`/dashboard/students/${studentId}`);
}

/**
 * Replaces the student's full subject tag set with the checked ones from the form — a student can
 * be taught more than one subject (e.g. Piano + Music Theory), additive to (not a replacement for)
 * the original free-text `discipline` field. `set` on an implicit m2m overwrites the relation in
 * one call, so unchecking a box removes it without a separate disconnect step.
 */
export async function updateStudentSubjectsAction(
  studentId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  });
  if (!student) return "Student not found";

  const subjectIds = formData.getAll("subjectIds") as string[];
  const ownSubjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id, id: { in: subjectIds } },
    select: { id: true },
  });

  await prisma.student.update({
    where: { id: studentId },
    data: { subjects: { set: ownSubjects.map((s) => ({ id: s.id })) } },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/students");
}
