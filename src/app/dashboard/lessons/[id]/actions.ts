"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { deriveLessonValue, postLessonDelivered, postMakeUpCreditIssued, postMakeUpCreditRedeemed } from "@/lib/ledger";

const noteSchema = z.object({
  lessonId: z.string().min(1),
  content: z.string().trim().min(1, "Note can't be empty"),
});

export async function saveLessonNoteAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = noteSchema.safeParse({
    lessonId: formData.get("lessonId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: parsed.data.lessonId, teacherId: session.user.id },
  });
  if (!lesson) return "Lesson not found";

  await prisma.lessonNote.upsert({
    where: { lessonId: parsed.data.lessonId },
    update: { content: parsed.data.content },
    create: { lessonId: parsed.data.lessonId, content: parsed.data.content },
  });

  revalidatePath(`/dashboard/lessons/${parsed.data.lessonId}`);
  revalidatePath("/dashboard/lessons");
}

/**
 * LedgerEntry has no lessonId FK (it's keyed only to subscriptionId per the spec's ledger design),
 * so attendance-already-marked is tracked via a note tag rather than a relation, avoiding a schema
 * migration for what's otherwise a one-line guard against double-posting on a page re-submit.
 */
function attendanceNoteTag(lessonId: string) {
  return `lesson:${lessonId}`;
}

async function findOwnLessonWithSubscription(lessonId: string, teacherId: string) {
  return prisma.lesson.findFirst({
    where: { id: lessonId, teacherId },
    include: { subscription: true },
  });
}

export async function markPresentAction(
  lessonId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState's required signature
  _prevState: string | undefined
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const lesson = await findOwnLessonWithSubscription(lessonId, session.user.id);
  if (!lesson) return "Lesson not found";
  if (!lesson.subscriptionId || !lesson.subscription) {
    return "This lesson has no subscription attached — nothing to bill.";
  }

  const alreadyMarked = await prisma.ledgerEntry.findFirst({
    where: { subscriptionId: lesson.subscriptionId, note: attendanceNoteTag(lessonId) },
  });
  if (alreadyMarked) return "Attendance already marked for this lesson.";

  const lessonValue = await deriveLessonValue(lesson.subscriptionId, {
    durationMins: lesson.durationMins,
    locationId: lesson.locationId,
  });
  await postLessonDelivered(lesson.subscriptionId, lessonValue, attendanceNoteTag(lessonId));

  // If this lesson is itself a scheduled make-up slot for an earlier no-show, redeem the banked
  // credit and close out that MakeUpLesson — reuses the existing issued/redeemed ledger pair
  // rather than inventing a new mechanism for "make-up lesson completed".
  const asMakeUp = await prisma.makeUpLesson.findUnique({ where: { makeUpLessonId: lessonId } });
  if (asMakeUp && !asMakeUp.completedAt) {
    await postMakeUpCreditRedeemed(lesson.subscriptionId, `makeup:${asMakeUp.id}`);
    await prisma.makeUpLesson.update({ where: { id: asMakeUp.id }, data: { completedAt: new Date() } });
  }

  revalidatePath(`/dashboard/lessons/${lessonId}`);
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/absences");
}

/**
 * Books an Add-on onto a lesson. `priceAtTime` snapshots the AddOn's current price so a later
 * price change never retroactively alters an already-booked charge (same pattern as
 * ContractAcceptance.contractSnapshot). Deliberately does not touch the ledger — per spec this
 * sits outside the core Subscription/billing model; the teacher collects/invoices for it
 * separately.
 */
export async function addAddOnBookingAction(
  lessonId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const addOnId = formData.get("addOnId") as string;
  const quantity = Number(formData.get("quantity")) || 1;
  if (!addOnId) return "Choose an add-on.";
  if (quantity < 1) return "Quantity must be at least 1.";

  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, teacherId: session.user.id } });
  if (!lesson) return "Lesson not found";

  const addOn = await prisma.addOn.findFirst({ where: { id: addOnId, teacherId: session.user.id } });
  if (!addOn) return "Add-on not found";

  await prisma.addOnBooking.create({
    data: { addOnId, lessonId, quantity, priceAtTime: addOn.price },
  });

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

export async function removeAddOnBookingAction(lessonId: string, bookingId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const booking = await prisma.addOnBooking.findFirst({
    where: { id: bookingId, lessonId, lesson: { teacherId: session.user.id } },
  });
  if (!booking) return;

  await prisma.addOnBooking.delete({ where: { id: bookingId } });
  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

export async function markAbsentMakeUpAction(
  lessonId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState's required signature
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const lesson = await findOwnLessonWithSubscription(lessonId, session.user.id);
  if (!lesson) return "Lesson not found";
  if (!lesson.subscriptionId) {
    return "This lesson has no subscription attached — nothing to bank a make-up credit against.";
  }

  const alreadyMarked = await prisma.ledgerEntry.findFirst({
    where: { subscriptionId: lesson.subscriptionId, note: attendanceNoteTag(lessonId) },
  });
  if (alreadyMarked) return "Attendance already marked for this lesson.";

  const noShowReason = (formData.get("noShowReason") as string) || null;

  await postMakeUpCreditIssued(lesson.subscriptionId, attendanceNoteTag(lessonId));

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { noShowConfirmed: true, noShowReason },
  });

  await prisma.makeUpLesson.create({
    data: { originalLessonId: lessonId, studentId: lesson.studentId },
  });

  revalidatePath(`/dashboard/lessons/${lessonId}`);
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/absences");
}
