import { prisma } from "@/lib/db";

/**
 * The Unavailability workflow — spec-core ("solves the teacher-forgets-to-alert-everyone risk").
 * A teacher declares a window they can't teach; the system scans affected bookings, shows them for
 * confirmation, then auto-cancels, credits each affected subscription, and emails guardians.
 *
 * Design choices (from the spec's "cash or make-up" latitude):
 * - A teacher-cancelled lesson is not the student's fault, so each affected lesson's subscription
 *   gets a MAKE_UP_CREDIT_ISSUED (a banked lesson, no cash movement) — reusing the exact same
 *   ledger semantics as the "Absent, make-up owed" attendance path, rather than inventing a cash
 *   refund the teacher didn't ask for. Cash resolution stays a manual MANUAL_CORRECTION if needed.
 * - GroupClasses recur weekly with no concrete dated instances or per-date subscription link, so
 *   they're surfaced in the affected list as an informational heads-up but are NOT auto-cancelled
 *   or auto-credited (there's no per-occurrence record to cancel or bill). Lessons carry the
 *   concrete date + subscription, so they're the unit the ledger/cancellation acts on.
 */

export type AffectedLesson = {
  id: string;
  scheduledAt: Date;
  studentName: string;
  subscriptionId: string | null;
  guardianEmails: string[];
};

export type AffectedGroupClass = {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
};

export type AffectedBookings = {
  lessons: AffectedLesson[];
  groupClasses: AffectedGroupClass[];
};

export async function findAffectedBookings(
  teacherId: string,
  start: Date,
  end: Date,
  locationId?: string
): Promise<AffectedBookings> {
  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId,
      status: "HELD",
      scheduledAt: { gte: start, lte: end },
      ...(locationId ? { locationId } : {}),
    },
    include: {
      student: { include: { payerLinks: { include: { payer: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // GroupClasses recur weekly; include any whose weekday falls within the window's span. If the
  // window is 7+ days it covers every weekday, so all the teacher's (optionally location-scoped)
  // classes qualify; otherwise only the specific weekdays the window touches.
  const weekdaysInWindow = weekdaysBetween(start, end);
  const groupClasses = await prisma.groupClass.findMany({
    where: { teacherId, ...(locationId ? { locationId } : {}), dayOfWeek: { in: weekdaysInWindow } },
    orderBy: { name: "asc" },
  });

  return {
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      scheduledAt: lesson.scheduledAt,
      studentName: lesson.student.name,
      subscriptionId: lesson.subscriptionId,
      guardianEmails: lesson.student.payerLinks
        .map((link) => link.payer.email)
        .filter((email): email is string => !!email),
    })),
    groupClasses: groupClasses.map((gc) => ({
      id: gc.id,
      name: gc.name,
      dayOfWeek: gc.dayOfWeek,
      startTime: gc.startTime,
    })),
  };
}

/** Distinct weekdays (0-6) covered by [start, end]. Caps at all 7 once the span reaches a week. */
function weekdaysBetween(start: Date, end: Date): number[] {
  const days = new Set<number>();
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  while (cursor <= last && days.size < 7) {
    days.add(cursor.getDay());
    cursor.setDate(cursor.getDate() + 1);
  }
  return [...days];
}

export type ConfirmResult = {
  unavailabilityId: string;
  cancelledCount: number;
  creditedCount: number;
  guardianEmails: { studentName: string; emails: string[] }[];
};

/**
 * Commits the declared unavailability: records it (confirmed), cancels affected lessons, and posts
 * a make-up credit per affected subscription — all in one transaction so a partial failure can't
 * leave lessons cancelled without their credits (or vice versa). Returns the guardian emails to
 * notify (the actual sending is a post-commit side effect the caller handles, so a mail failure
 * never rolls back the cancellation).
 */
export async function confirmUnavailability(
  teacherId: string,
  start: Date,
  end: Date,
  locationId: string | undefined,
  reason: string | undefined
): Promise<ConfirmResult> {
  const affected = await findAffectedBookings(teacherId, start, end, locationId);

  const result = await prisma.$transaction(async (tx) => {
    const unavailability = await tx.unavailability.create({
      data: {
        teacherId,
        locationId: locationId || null,
        startDatetime: start,
        endDatetime: end,
        reason: reason || null,
        confirmedAt: new Date(),
      },
    });

    let cancelledCount = 0;
    let creditedCount = 0;

    for (const lesson of affected.lessons) {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: { status: "CANCELLED_BY_TEACHER" },
      });
      cancelledCount++;

      if (lesson.subscriptionId) {
        // Reuse the same ledger primitive as the attendance "make-up owed" path.
        await tx.ledgerEntry.create({
          data: {
            subscriptionId: lesson.subscriptionId,
            amount: 0,
            operation: "CREDIT",
            reason: "MAKE_UP_CREDIT_ISSUED",
            note: `Teacher unavailable ${lesson.scheduledAt.toLocaleDateString("en-GB")} (unavailability:${unavailability.id})`,
          },
        });
        creditedCount++;
      }
    }

    return { unavailabilityId: unavailability.id, cancelledCount, creditedCount };
  });

  return {
    ...result,
    guardianEmails: affected.lessons
      .filter((l) => l.guardianEmails.length > 0)
      .map((l) => ({ studentName: l.studentName, emails: l.guardianEmails })),
  };
}
