import { prisma } from "@/lib/db";
import {
  filterAvailableSlots,
  generateFixedSchedule,
  generateFluidSchedule,
  lessonsOverlap,
  type ScheduledLesson,
  type TimeSlot,
} from "@/lib/scheduling";
import { parseAvailability, parseProtectedBlocks } from "@/lib/schedule-json";

export async function getAvailableSlotsForLink(teacherSchoolLinkId: string): Promise<TimeSlot[]> {
  const link = await prisma.teacherSchoolLink.findUniqueOrThrow({
    where: { id: teacherSchoolLinkId },
  });

  const availability = parseAvailability(link.availability);
  const protectedBlocks = parseProtectedBlocks(link.protectedBlocks);

  return filterAvailableSlots(availability, protectedBlocks);
}

export type ConflictReason = "TEACHER" | "ROOM";

export type ScheduledLessonConflict = ScheduledLesson & { reason: ConflictReason };

export type TimetablePreviewResult = {
  lessons: ScheduledLesson[];
  conflicts: ScheduledLessonConflict[]; // subset of `lessons` that clash with an existing booking
  clean: ScheduledLesson[]; // lessons safe to create
};

/**
 * Marks lessons that overlap an existing HELD lesson for the same teacher (double-booking the
 * teacher) or, when roomId is given, an existing lesson/GroupClass occupying that room (booked by
 * anyone — a room can be double-booked across different teachers sharing a school/venue, so this
 * axis is NOT scoped by teacherId). Overlap is time-range based (via lessonsOverlap), not exact
 * timestamp equality, so two different-length lessons that overlap without sharing a start time
 * are now caught too — previously they slipped through undetected.
 */
async function splitConflicts(
  teacherId: string,
  lessons: ScheduledLesson[],
  roomId?: string
): Promise<TimetablePreviewResult> {
  if (lessons.length === 0) return { lessons, conflicts: [], clean: [] };

  const windowStart = lessons.reduce((min, l) => (l.scheduledAt < min ? l.scheduledAt : min), lessons[0].scheduledAt);
  const windowEnd = lessons.reduce((max, l) => (l.scheduledAt > max ? l.scheduledAt : max), lessons[0].scheduledAt);
  // Widen the query window by the longest candidate duration so a lesson starting just before
  // windowEnd (or ending just after windowStart) can still be matched by an overlap check.
  const maxDurationMs = Math.max(...lessons.map((l) => l.durationMins)) * 60_000;
  const queryStart = new Date(windowStart.getTime() - maxDurationMs);
  const queryEnd = new Date(windowEnd.getTime() + maxDurationMs);

  const existingTeacherLessons = await prisma.lesson.findMany({
    where: { teacherId, status: "HELD", scheduledAt: { gte: queryStart, lte: queryEnd } },
  });

  const existingRoomLessons = roomId
    ? await prisma.lesson.findMany({
        where: { roomId, status: "HELD", scheduledAt: { gte: queryStart, lte: queryEnd } },
      })
    : [];

  const roomGroupClasses = roomId ? await prisma.groupClass.findMany({ where: { roomId } }) : [];

  const conflicts: ScheduledLessonConflict[] = [];
  const clean: ScheduledLesson[] = [];

  for (const lesson of lessons) {
    const teacherConflict = existingTeacherLessons.some((e) => lessonsOverlap(e, lesson));
    const roomLessonConflict = existingRoomLessons.some((e) => lessonsOverlap(e, lesson));
    const roomGroupClassConflict = roomGroupClasses.some(
      (gc) =>
        gc.dayOfWeek === lesson.scheduledAt.getDay() &&
        lessonsOverlap(
          { scheduledAt: lesson.scheduledAt, durationMins: lesson.durationMins },
          groupClassSlotOnDate(gc, lesson.scheduledAt)
        )
    );

    if (teacherConflict) {
      conflicts.push({ ...lesson, reason: "TEACHER" });
    } else if (roomLessonConflict || roomGroupClassConflict) {
      conflicts.push({ ...lesson, reason: "ROOM" });
    } else {
      clean.push(lesson);
    }
  }

  return { lessons, conflicts, clean };
}

/** Projects a recurring GroupClass's weekly HH:mm slot onto the same calendar date as `onDate`. */
function groupClassSlotOnDate(
  groupClass: { startTime: string; endTime: string },
  onDate: Date
): { scheduledAt: Date; durationMins: number } {
  const [startHours, startMinutes] = groupClass.startTime.split(":").map(Number);
  const [endHours, endMinutes] = groupClass.endTime.split(":").map(Number);
  const scheduledAt = new Date(onDate);
  scheduledAt.setHours(startHours, startMinutes, 0, 0);
  const durationMins = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  return { scheduledAt, durationMins };
}

export async function previewFixedTimetable(
  teacherId: string,
  termStart: Date,
  termEnd: Date,
  slot: TimeSlot,
  roomId?: string
): Promise<TimetablePreviewResult> {
  const lessons = generateFixedSchedule(termStart, termEnd, slot);
  return splitConflicts(teacherId, lessons, roomId);
}

export async function previewFluidTimetable(
  teacherId: string,
  termStart: Date,
  termEnd: Date,
  candidateSlots: TimeSlot[],
  roomId?: string
): Promise<TimetablePreviewResult> {
  const lessons = generateFluidSchedule(termStart, termEnd, candidateSlots);
  return splitConflicts(teacherId, lessons, roomId);
}

export type CreateLessonsInput = {
  studentId: string;
  teacherId: string;
  schoolId: string;
  roomId?: string;
  lessons: ScheduledLesson[];
};

/** Creates one Lesson row per scheduled slot. Caller should have already excluded conflicts. */
export async function createLessonsFromSchedule({
  studentId,
  teacherId,
  schoolId,
  roomId,
  lessons,
}: CreateLessonsInput) {
  if (lessons.length === 0) return { count: 0 };

  const result = await prisma.lesson.createMany({
    data: lessons.map((lesson) => ({
      studentId,
      teacherId,
      schoolId,
      roomId,
      scheduledAt: lesson.scheduledAt,
      durationMins: lesson.durationMins,
    })),
  });

  return { count: result.count };
}
