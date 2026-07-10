import { prisma } from "@/lib/db";
import {
  filterAvailableSlots,
  generateFixedSchedule,
  generateFluidSchedule,
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

export type TimetablePreviewResult = {
  lessons: ScheduledLesson[];
  conflicts: ScheduledLesson[]; // subset of `lessons` that clash with an existing Lesson
  clean: ScheduledLesson[]; // lessons safe to create
};

/** Marks lessons that overlap an existing HELD lesson for the same teacher as conflicts. */
async function splitConflicts(teacherId: string, lessons: ScheduledLesson[]): Promise<TimetablePreviewResult> {
  if (lessons.length === 0) return { lessons, conflicts: [], clean: [] };

  const windowStart = lessons.reduce((min, l) => (l.scheduledAt < min ? l.scheduledAt : min), lessons[0].scheduledAt);
  const windowEnd = lessons.reduce((max, l) => (l.scheduledAt > max ? l.scheduledAt : max), lessons[0].scheduledAt);

  const existing = await prisma.lesson.findMany({
    where: {
      teacherId,
      status: "HELD",
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
  });

  const conflicts: ScheduledLesson[] = [];
  const clean: ScheduledLesson[] = [];

  for (const lesson of lessons) {
    const hasConflict = existing.some((e) => e.scheduledAt.getTime() === lesson.scheduledAt.getTime());
    if (hasConflict) conflicts.push(lesson);
    else clean.push(lesson);
  }

  return { lessons, conflicts, clean };
}

export async function previewFixedTimetable(
  teacherId: string,
  termStart: Date,
  termEnd: Date,
  slot: TimeSlot
): Promise<TimetablePreviewResult> {
  const lessons = generateFixedSchedule(termStart, termEnd, slot);
  return splitConflicts(teacherId, lessons);
}

export async function previewFluidTimetable(
  teacherId: string,
  termStart: Date,
  termEnd: Date,
  candidateSlots: TimeSlot[]
): Promise<TimetablePreviewResult> {
  const lessons = generateFluidSchedule(termStart, termEnd, candidateSlots);
  return splitConflicts(teacherId, lessons);
}

export type CreateLessonsInput = {
  studentId: string;
  teacherId: string;
  schoolId: string;
  lessons: ScheduledLesson[];
};

/** Creates one Lesson row per scheduled slot. Caller should have already excluded conflicts. */
export async function createLessonsFromSchedule({
  studentId,
  teacherId,
  schoolId,
  lessons,
}: CreateLessonsInput) {
  if (lessons.length === 0) return { count: 0 };

  const result = await prisma.lesson.createMany({
    data: lessons.map((lesson) => ({
      studentId,
      teacherId,
      schoolId,
      scheduledAt: lesson.scheduledAt,
      durationMins: lesson.durationMins,
    })),
  });

  return { count: result.count };
}
