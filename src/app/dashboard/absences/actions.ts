"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { deriveLessonValue, postManualCorrection } from "@/lib/ledger";

async function findOwnMakeUpLesson(makeUpLessonRowId: string, teacherId: string) {
  return prisma.makeUpLesson.findFirst({
    where: { id: makeUpLessonRowId, originalLesson: { teacherId } },
    include: { originalLesson: { include: { subscription: true } } },
  });
}

export async function applyAsCreditAction(
  makeUpLessonRowId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState's required signature
  _prevState: string | undefined
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const row = await findOwnMakeUpLesson(makeUpLessonRowId, session.user.id);
  if (!row) return "Not found";
  if (row.completedAt) return "Already resolved.";

  const { originalLesson } = row;
  if (!originalLesson.subscriptionId || !originalLesson.subscription) {
    return "This lesson has no subscription attached — nothing to credit.";
  }

  const lessonValue = await deriveLessonValue(originalLesson.subscriptionId, {
    durationMins: originalLesson.durationMins,
    schoolId: originalLesson.schoolId,
  });

  await postManualCorrection(
    originalLesson.subscriptionId,
    lessonValue,
    "CREDIT",
    `Next-period credit for no-show on ${originalLesson.scheduledAt.toLocaleDateString("en-GB")} (makeup:${row.id})`
  );

  await prisma.subscription.update({
    where: { id: originalLesson.subscriptionId },
    data: { creditAppliedNextPeriod: { increment: lessonValue } },
  });

  await prisma.makeUpLesson.update({ where: { id: row.id }, data: { completedAt: new Date() } });

  revalidatePath("/dashboard/absences");
  revalidatePath(`/dashboard/subscriptions/${originalLesson.subscriptionId}`);
}

const linkSchema = z.object({
  makeUpLessonRowId: z.string().min(1),
  lessonId: z.string().min(1),
});

export async function scheduleMakeUpAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = linkSchema.safeParse({
    makeUpLessonRowId: formData.get("makeUpLessonRowId"),
    lessonId: formData.get("lessonId"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const row = await findOwnMakeUpLesson(parsed.data.makeUpLessonRowId, session.user.id);
  if (!row) return "Not found";
  if (row.completedAt) return "Already resolved.";

  const lesson = await prisma.lesson.findFirst({
    where: { id: parsed.data.lessonId, teacherId: session.user.id, studentId: row.studentId },
  });
  if (!lesson) return "Lesson not found for this student.";

  await prisma.makeUpLesson.update({
    where: { id: row.id },
    data: { makeUpLessonId: lesson.id, confirmedAt: new Date() },
  });

  revalidatePath("/dashboard/absences");
}
