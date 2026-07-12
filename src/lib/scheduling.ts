export type TimeSlot = {
  dayOfWeek: number; // 0-6, Sunday-Saturday — matches GroupClass.dayOfWeek convention
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
};

export type ProtectedBlock = TimeSlot & { label?: string };

export type ScheduledLesson = {
  scheduledAt: Date;
  durationMins: number;
  slot: TimeSlot;
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function slotDurationMins(slot: TimeSlot): number {
  return parseTimeToMinutes(slot.endTime) - parseTimeToMinutes(slot.startTime);
}

/** Generic half-open range overlap — shared by both time-of-day (minutes) and absolute (ms) checks. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function timeRangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return rangesOverlap(aStart, aEnd, bStart, bEnd);
}

/**
 * Whether two absolute-datetime lessons overlap in real time — used for teacher/room
 * double-booking checks. Unlike slot-vs-protected-block checks (time-of-day only), this compares
 * actual instants, so lessons on different calendar dates never spuriously "overlap".
 */
export function lessonsOverlap(
  a: { scheduledAt: Date; durationMins: number },
  b: { scheduledAt: Date; durationMins: number }
): boolean {
  const aStart = a.scheduledAt.getTime();
  const aEnd = aStart + a.durationMins * 60_000;
  const bStart = b.scheduledAt.getTime();
  const bEnd = bStart + b.durationMins * 60_000;
  return rangesOverlap(aStart, aEnd, bStart, bEnd);
}

/** True if scheduling this slot would fall inside a protected block (assembly, lunch, exams). */
export function slotHitsProtectedBlock(slot: TimeSlot, protectedBlocks: ProtectedBlock[]): boolean {
  return protectedBlocks.some((block) => {
    if (block.dayOfWeek !== slot.dayOfWeek) return false;
    return timeRangesOverlap(
      parseTimeToMinutes(slot.startTime),
      parseTimeToMinutes(slot.endTime),
      parseTimeToMinutes(block.startTime),
      parseTimeToMinutes(block.endTime)
    );
  });
}

/** Drops any candidate slot that would violate a protected block. Validated up-front, not per-week. */
export function filterAvailableSlots(
  candidates: TimeSlot[],
  protectedBlocks: ProtectedBlock[]
): TimeSlot[] {
  return candidates.filter((slot) => !slotHitsProtectedBlock(slot, protectedBlocks));
}

function applyTimeToDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/** Every date in [termStart, termEnd] (inclusive) that falls on the given weekday. */
export function getWeeklyDatesInRange(termStart: Date, termEnd: Date, dayOfWeek: number): Date[] {
  const dates: Date[] = [];
  const current = new Date(termStart);
  current.setHours(0, 0, 0, 0);

  const daysUntilTarget = (dayOfWeek - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + daysUntilTarget);

  const end = new Date(termEnd);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

/** FIXED mode: the same weekly slot for the whole term. */
export function generateFixedSchedule(termStart: Date, termEnd: Date, slot: TimeSlot): ScheduledLesson[] {
  const dates = getWeeklyDatesInRange(termStart, termEnd, slot.dayOfWeek);
  const durationMins = slotDurationMins(slot);
  return dates.map((date) => ({
    scheduledAt: applyTimeToDate(date, slot.startTime),
    durationMins,
    slot,
  }));
}

export function getSundayOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

export function getWeekStarts(termStart: Date, termEnd: Date): Date[] {
  const starts: Date[] = [];
  const current = getSundayOfWeek(termStart);

  while (current <= termEnd) {
    starts.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return starts;
}

/**
 * FLUID mode: rotates round-robin through candidateSlots, one lesson per term-week, so no single
 * weekday carries every lesson. Each slot is used floor(weeks/N) or ceil(weeks/N) times — a
 * difference of at most one lesson — which is how "equal total teaching time" is guaranteed here.
 * candidateSlots should already be run through filterAvailableSlots.
 */
export function generateFluidSchedule(
  termStart: Date,
  termEnd: Date,
  candidateSlots: TimeSlot[]
): ScheduledLesson[] {
  if (candidateSlots.length === 0) return [];

  const end = new Date(termEnd);
  end.setHours(23, 59, 59, 999);

  const weekStarts = getWeekStarts(termStart, end);

  return weekStarts
    .map((weekStart, index) => {
      const slot = candidateSlots[index % candidateSlots.length];
      const date = new Date(weekStart);
      date.setDate(date.getDate() + slot.dayOfWeek);
      return {
        scheduledAt: applyTimeToDate(date, slot.startTime),
        durationMins: slotDurationMins(slot),
        slot,
      };
    })
    .filter((lesson) => lesson.scheduledAt >= termStart && lesson.scheduledAt <= end);
}

/**
 * Derives the distinct (dayOfWeek, startTime, durationMins) slots a student has historically had
 * lessons in, from their raw past Lesson rows — no dayOfWeek/time column exists on Lesson itself,
 * only `scheduledAt`, so this is computed here rather than queried directly. Feeds the FLUID-mode
 * "ghost overlay" calendar visual (see docs/spec.md's lesson-history overlay requirement).
 */
export function deriveGhostSlots(pastLessons: { scheduledAt: Date; durationMins: number }[]): TimeSlot[] {
  const seen = new Map<string, TimeSlot>();
  for (const lesson of pastLessons) {
    const dayOfWeek = lesson.scheduledAt.getDay();
    const hours = String(lesson.scheduledAt.getHours()).padStart(2, "0");
    const minutes = String(lesson.scheduledAt.getMinutes()).padStart(2, "0");
    const startTime = `${hours}:${minutes}`;
    const endMinutes = lesson.scheduledAt.getHours() * 60 + lesson.scheduledAt.getMinutes() + lesson.durationMins;
    const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    const key = `${dayOfWeek}-${startTime}-${lesson.durationMins}`;
    if (!seen.has(key)) seen.set(key, { dayOfWeek, startTime, endTime });
  }
  return [...seen.values()];
}

/** Projects a TimeSlot onto the specific week (Sunday-start) containing `weekOf`. */
export function projectSlotOntoWeek(slot: TimeSlot, weekOf: Date): Date {
  const weekStart = getSundayOfWeek(weekOf);
  const date = new Date(weekStart);
  date.setDate(date.getDate() + slot.dayOfWeek);
  return applyTimeToDate(date, slot.startTime);
}

/** Counts how many lessons landed on each candidate slot — used to sanity-check fairness. */
export function countLessonsBySlot(lessons: ScheduledLesson[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    const key = `${lesson.slot.dayOfWeek}-${lesson.slot.startTime}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
