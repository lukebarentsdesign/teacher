"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";

export async function requestPrivateTuitionAction(studentId: string): Promise<void> {
  const session = await getMicrositeSession();
  if (!session || session.type !== "guardian") return;

  const link = await prisma.studentPayerLink.findFirst({ where: { studentId, payerId: session.payerId } });
  if (!link) return;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || !student.locationId) return;

  const existingPending = await prisma.privateTuitionRequest.findFirst({
    where: { studentId, status: "PENDING" },
  });
  if (existingPending) return;

  await prisma.privateTuitionRequest.create({
    data: {
      studentId,
      teacherId: student.teacherId,
      sourceLocationId: student.locationId,
    },
  });

  revalidatePath(`/parent/students/${studentId}`);
}

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comments: z.string().trim().optional(),
});

/**
 * Guardian-only (a student microsite login has no Payer row to attribute feedback to — see
 * StudentViewContext.payerId). Upserts on the (lessonId, payerId) unique constraint so re-
 * submitting updates the same feedback rather than erroring or duplicating.
 */
export async function submitLessonFeedbackAction(
  studentId: string,
  lessonId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await getMicrositeSession();
  if (!session || session.type !== "guardian") return "Only a guardian can leave feedback.";

  const link = await prisma.studentPayerLink.findFirst({ where: { studentId, payerId: session.payerId } });
  if (!link) return "Not authorized";

  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, studentId } });
  if (!lesson) return "Lesson not found";

  const parsed = feedbackSchema.safeParse({
    rating: formData.get("rating"),
    comments: formData.get("comments") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.lessonFeedback.upsert({
    where: { lessonId_payerId: { lessonId, payerId: session.payerId } },
    update: { rating: parsed.data.rating, comments: parsed.data.comments || null, submittedAt: new Date() },
    create: { lessonId, payerId: session.payerId, rating: parsed.data.rating, comments: parsed.data.comments || null },
  });

  revalidatePath(`/parent/students/${studentId}/notes`);
}
