import { prisma } from "@/lib/db";
import { deriveLessonValue, postLessonDelivered, postMakeUpCreditRedeemed } from "@/lib/ledger";

/**
 * Card-based sign-in/out (spec section "CheckIn"): a lightweight reuse of the existing IG Card
 * wallet pass's scannable identifier (`Student.igCardId`), not full account linking. Most
 * barcode/QR scanners act as a USB keyboard, typing the scanned value + Enter into whatever input
 * has focus — so "scanning" here is just a text field, no camera/scanning library needed.
 *
 * Sign-in on a lesson auto-fires the same LESSON_DELIVERED ledger post as the manual "Mark
 * present" attendance action (src/app/dashboard/lessons/[id]/actions.ts) — this is the "replaces
 * manual attendance marking" behaviour from the spec. Group-class sign-ins are attendance/
 * safeguarding records only; GroupClass has no per-occurrence billing to trigger (recurs weekly
 * with no dated instance — same reasoning as the Unavailability workflow's group-class handling).
 */

export type ScanTarget =
  | { type: "lesson"; id: string; label: string; time: string }
  | { type: "groupClass"; id: string; label: string; time: string };

export type ScanResult = {
  studentId: string;
  studentName: string;
  targets: ScanTarget[];
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Looks up the student by scanned card ID and finds today's lesson(s)/group class(es) for them. */
export async function findScanTargets(teacherId: string, igCardId: string): Promise<ScanResult | null> {
  const student = await prisma.student.findFirst({
    where: { teacherId, igCardId },
  });
  if (!student) return null;

  const { start, end } = todayRange();
  const today = start.getDay();

  const lessons = await prisma.lesson.findMany({
    where: {
      studentId: student.id,
      status: "HELD",
      scheduledAt: { gte: start, lt: end },
    },
    include: { checkIn: true },
    orderBy: { scheduledAt: "asc" },
  });

  const groupClasses = await prisma.groupClass.findMany({
    where: { dayOfWeek: today, members: { some: { studentId: student.id, leftAt: null } } },
    orderBy: { startTime: "asc" },
  });

  const targets: ScanTarget[] = [
    ...lessons.map((l): ScanTarget => ({
      type: "lesson",
      id: l.id,
      label: "Lesson",
      time: fmtTime(l.scheduledAt),
    })),
    ...groupClasses.map((gc): ScanTarget => ({
      type: "groupClass",
      id: gc.id,
      label: gc.name,
      time: gc.startTime,
    })),
  ];

  return { studentId: student.id, studentName: student.name, targets };
}

function attendanceNoteTag(lessonId: string) {
  return `lesson:${lessonId}`;
}

/**
 * Records a sign-in scan. For a lesson target, also posts LESSON_DELIVERED (guarded by the same
 * note-tag idempotency check the manual attendance path uses, so a lesson can't be double-billed
 * whether it was marked present by hand or by a later/earlier scan) and redeems any make-up credit
 * this lesson slot was covering.
 */
export async function signIn(
  teacherId: string,
  studentId: string,
  target: { type: "lesson" | "groupClass"; id: string }
): Promise<{ checkInId: string }> {
  if (target.type === "lesson") {
    const lesson = await prisma.lesson.findFirst({
      where: { id: target.id, studentId, teacherId },
      include: { subscription: true },
    });
    if (!lesson) throw new Error("Lesson not found");

    const checkIn = await prisma.checkIn.upsert({
      where: { lessonId: lesson.id },
      update: { signedInAt: new Date() },
      create: { lessonId: lesson.id, studentId, signedInAt: new Date() },
    });

    if (lesson.subscriptionId) {
      const alreadyMarked = await prisma.ledgerEntry.findFirst({
        where: { subscriptionId: lesson.subscriptionId, note: attendanceNoteTag(lesson.id) },
      });
      if (!alreadyMarked) {
        const lessonValue = await deriveLessonValue(lesson.subscriptionId, {
          durationMins: lesson.durationMins,
          schoolId: lesson.schoolId,
        });
        await postLessonDelivered(lesson.subscriptionId, lessonValue, attendanceNoteTag(lesson.id));

        const asMakeUp = await prisma.makeUpLesson.findUnique({ where: { makeUpLessonId: lesson.id } });
        if (asMakeUp && !asMakeUp.completedAt) {
          await postMakeUpCreditRedeemed(lesson.subscriptionId, `makeup:${asMakeUp.id}`);
          await prisma.makeUpLesson.update({ where: { id: asMakeUp.id }, data: { completedAt: new Date() } });
        }
      }
    }

    return { checkInId: checkIn.id };
  }

  const { start, end } = todayRange();
  const openToday = await prisma.checkIn.findFirst({
    where: {
      groupClassId: target.id,
      studentId,
      signedOutAt: null,
      signedInAt: { gte: start, lt: end },
    },
  });
  if (openToday) return { checkInId: openToday.id };

  const checkIn = await prisma.checkIn.create({
    data: { groupClassId: target.id, studentId, signedInAt: new Date() },
  });
  return { checkInId: checkIn.id };
}

/** Records a sign-out scan against the most recent open (no signedOutAt) check-in for this target. */
export async function signOut(
  studentId: string,
  target: { type: "lesson" | "groupClass"; id: string }
): Promise<{ checkInId: string } | null> {
  const openCheckIn = await prisma.checkIn.findFirst({
    where: {
      studentId,
      signedOutAt: null,
      ...(target.type === "lesson" ? { lessonId: target.id } : { groupClassId: target.id }),
    },
    orderBy: { signedInAt: "desc" },
  });
  if (!openCheckIn) return null;

  await prisma.checkIn.update({ where: { id: openCheckIn.id }, data: { signedOutAt: new Date() } });
  return { checkInId: openCheckIn.id };
}
