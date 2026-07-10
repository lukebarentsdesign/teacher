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

function timeRangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
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

function getSundayOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function getWeekStarts(termStart: Date, termEnd: Date): Date[] {
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

/** Counts how many lessons landed on each candidate slot — used to sanity-check fairness. */
export function countLessonsBySlot(lessons: ScheduledLesson[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    const key = `${lesson.slot.dayOfWeek}-${lesson.slot.startTime}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
