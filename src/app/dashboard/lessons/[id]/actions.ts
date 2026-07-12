"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  deriveLessonValue,
  postLessonDelivered,
  postMakeUpCreditIssued,
  postMakeUpCreditRedeemed,
  postVenueFeeIfItemised,
  postLateCancellationCharge,
} from "@/lib/ledger";
import { resolveCancellationOutcome } from "@/lib/cancellation-policy";

const noteSchema = z.object({
  lessonId: z.string().min(1),
  content: z.string().trim().min(1, "Note can't be empty"),
});

/**
 * The covering instructor must be in the same Organisation as the lesson's own teacher — this
 * doesn't transfer ownership of the Lesson (still owned by the original teacherId), it's purely a
 * record of who actually taught it. See "Multi-Instructor Support" in CLAUDE.md.
 */
export async function addCoverAssignmentAction(
  lessonId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, teacherId: session.user.id } });
  if (!lesson) return "Lesson not found";

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!teacher.organisationId) return "Not part of an organisation";

  const coveringInstructorId = formData.get("coveringInstructorId") as string;
  if (!coveringInstructorId) return "Pick a covering instructor";

  const covering = await prisma.teacher.findFirst({
    where: { id: coveringInstructorId, organisationId: teacher.organisationId },
  });
  if (!covering) return "That instructor isn't in your organisation";

  const reason = (formData.get("reason") as string)?.trim() || null;

  await prisma.coverAssignment.create({
    data: { lessonId, originalInstructorId: session.user.id, coveringInstructorId, reason },
  });

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

export async function deleteCoverAssignmentAction(coverAssignmentId: string, lessonId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.coverAssignment.deleteMany({
    where: { id: coverAssignmentId, lessonId, originalInstructorId: session.user.id },
  });

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

export async function saveMeetingUrlAction(
  lessonId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, teacherId: session.user.id } });
  if (!lesson) return "Lesson not found";

  const raw = (formData.get("meetingUrl") as string)?.trim();
  if (raw) {
    const parsed = z.string().url("Enter a valid URL").safeParse(raw);
    if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid URL";
  }

  await prisma.lesson.update({ where: { id: lessonId }, data: { meetingUrl: raw || null } });

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

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
  await postVenueFeeIfItemised(lesson.subscriptionId, lesson.locationId, lessonValue, attendanceNoteTag(lessonId));

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

/**
 * Resolves the CancellationPolicy that applies to a lesson — a location-scoped policy overrides
 * the teacher's own bare (locationId: null) default, matching TermCalendar's "assignment, not
 * merge" pattern elsewhere in this app. No policy at either level = null, meaning the caller falls
 * back to the original always-free behavior.
 */
async function resolveApplicablePolicy(teacherId: string, locationId: string) {
  const locationPolicy = await prisma.cancellationPolicy.findUnique({ where: { locationId } });
  if (locationPolicy) return locationPolicy;
  return prisma.cancellationPolicy.findFirst({ where: { teacherId, locationId: null } });
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
  if (lesson.noShowConfirmed) return "Attendance already marked for this lesson.";

  const alreadyMarked = await prisma.ledgerEntry.findFirst({
    where: { subscriptionId: lesson.subscriptionId, note: attendanceNoteTag(lessonId) },
  });
  if (alreadyMarked) return "Attendance already marked for this lesson.";

  const noShowReason = (formData.get("noShowReason") as string) || null;
  const informedAtRaw = formData.get("informedAt") as string;
  const informedAt = informedAtRaw ? new Date(informedAtRaw) : new Date();

  const policy = await resolveApplicablePolicy(session.user.id, lesson.locationId);
  const outcome = resolveCancellationOutcome(policy, lesson.scheduledAt, informedAt);

  if (outcome.action === "FULL_CHARGE" || outcome.action === "PARTIAL_CHARGE") {
    const lessonValue = await deriveLessonValue(lesson.subscriptionId, {
      durationMins: lesson.durationMins,
      locationId: lesson.locationId,
    });
    await postLateCancellationCharge(
      lesson.subscriptionId,
      lessonValue * outcome.chargeFraction,
      attendanceNoteTag(lessonId)
    );
  } else if (outcome.action === "CREDIT") {
    await postMakeUpCreditIssued(lesson.subscriptionId, attendanceNoteTag(lessonId));
    await prisma.makeUpLesson.create({
      data: { originalLessonId: lessonId, studentId: lesson.studentId },
    });
  }
  // FORFEIT: no ledger entry, no make-up owed — the student simply loses the slot.

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { noShowConfirmed: true, noShowReason },
  });

  revalidatePath(`/dashboard/lessons/${lessonId}`);
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/absences");
}
