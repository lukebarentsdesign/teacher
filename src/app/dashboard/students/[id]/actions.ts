"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { subscriptionSchema, assessmentSchema } from "@/lib/validations";
import { generateUniqueAccessCode } from "@/lib/access-code";
import { isAtLeast16 } from "@/lib/age";
import { z } from "zod";

async function findOwnStudent(studentId: string, teacherId: string) {
  return prisma.student.findFirst({ where: { id: studentId, teacherId } });
}

const linkPayerSchema = z.object({
  studentId: z.string().min(1),
  payerId: z.string().min(1),
});

export async function linkPayerAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = linkPayerSchema.safeParse({
    studentId: formData.get("studentId"),
    payerId: formData.get("payerId"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const [student, payer] = await Promise.all([
    prisma.student.findFirst({ where: { id: parsed.data.studentId, teacherId: session.user.id } }),
    prisma.payer.findFirst({ where: { id: parsed.data.payerId, teacherId: session.user.id } }),
  ]);
  if (!student || !payer) return "Student or payer not found";

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

import { calculateSubscriptionSchedule } from "@/lib/billing";

export async function createSubscriptionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = subscriptionSchema.safeParse({
    studentId: formData.get("studentId"),
    payerId: formData.get("payerId"),
    annualFee: formData.get("annualFee"),
    billingModel: formData.get("billingModel"),
    startDate: formData.get("startDate"),
    lessonCount: formData.get("lessonCount"),
    lessonPrice: formData.get("lessonPrice"),
    months: formData.get("months"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const [student, payer] = await Promise.all([
    prisma.student.findFirst({ where: { id: parsed.data.studentId, teacherId: session.user.id } }),
    prisma.payer.findFirst({ where: { id: parsed.data.payerId, teacherId: session.user.id } }),
  ]);
  if (!student || !payer) return "Student or payer not found";

  const { startDate, lessonCount, lessonPrice, months, ...rest } = parsed.data;

  let calculationSnapshot = null;
  if (rest.billingModel === "SMOOTHED_SUBSCRIPTION" && lessonCount && lessonPrice) {
    const calcResult = calculateSubscriptionSchedule(
      lessonCount,
      lessonPrice,
      months ?? 12,
      new Date(startDate)
    );
    calculationSnapshot = JSON.parse(JSON.stringify(calcResult));
  }

  await prisma.subscription.create({
    data: {
      ...rest,
      startDate: new Date(startDate),
      calculationSnapshot: calculationSnapshot || undefined,
    },
  });

  revalidatePath(`/dashboard/students/${parsed.data.studentId}`);
}

export async function grantIndependentAccessAction(
  studentId: string
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const student = await findOwnStudent(studentId, session.user.id);
  if (!student) return "Student not found";

  if (!student.dob) return "Add a date of birth before granting independent access.";
  if (!isAtLeast16(student.dob)) return "This student isn't 16 yet.";

  const code = await generateUniqueAccessCode();

  await prisma.student.update({
    where: { id: studentId },
    data: { hasIndependentAccess: true, studentAccessCode: code, studentAccessCodeUpdatedAt: new Date() },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function revokeIndependentAccessAction(studentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const student = await findOwnStudent(studentId, session.user.id);
  if (!student) return;

  await prisma.student.update({
    where: { id: studentId },
    data: { hasIndependentAccess: false, studentAccessCode: null, studentAccessCodeUpdatedAt: null },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function regenerateStudentAccessCodeAction(studentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const student = await findOwnStudent(studentId, session.user.id);
  if (!student || !student.hasIndependentAccess) return;

  const code = await generateUniqueAccessCode();

  await prisma.student.update({
    where: { id: studentId },
    data: { studentAccessCode: code, studentAccessCodeUpdatedAt: new Date() },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function declinePrivateTuitionRequestAction(requestId: string, studentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.privateTuitionRequest.updateMany({
    where: { id: requestId, teacherId: session.user.id, status: "PENDING" },
    data: { status: "DECLINED" },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function createAssessmentAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const studentId = formData.get("studentId") as string;
  const student = await findOwnStudent(studentId, session.user.id);
  if (!student) return "Student not found";

  const roomId = (formData.get("roomId") as string) || undefined;
  if (roomId) {
    const room = await prisma.room.findFirst({ where: { id: roomId, locationId: student.locationId ?? undefined } });
    if (!room) return "Room not found";
  }

  const parsed = assessmentSchema.safeParse({
    studentId,
    level: formData.get("level"),
    date: formData.get("date"),
    canContinue: formData.get("canContinue") === "true",
    appointmentAt: formData.get("appointmentAt") || undefined,
    roomId,
    examBoard: formData.get("examBoard") || undefined,
    examFee: formData.get("examFee") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.assessment.create({
    data: {
      studentId,
      teacherId: session.user.id,
      level: parsed.data.level,
      date: new Date(parsed.data.date),
      canContinue: parsed.data.canContinue ?? true,
      appointmentAt: parsed.data.appointmentAt ? new Date(parsed.data.appointmentAt) : null,
      roomId: parsed.data.roomId,
      examBoard: parsed.data.examBoard,
      examFee: parsed.data.examFee,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function toggleShareBalanceAction(
  studentId: string,
  shareBalanceWithStudent: boolean
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const student = await findOwnStudent(studentId, session.user.id);
  if (!student) return;

  await prisma.student.update({
    where: { id: studentId },
    data: { shareBalanceWithStudent },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}
