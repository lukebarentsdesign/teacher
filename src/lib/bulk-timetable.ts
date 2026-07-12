import { getWeeklyDatesInRange, rangesOverlap, type TimeSlot } from "@/lib/scheduling";

/**
 * Term-based bulk timetable generation (spec Part 4.6). Pure and unit-testable — takes fully
 * resolved inputs (availability windows, term range, holidays, the teacher's existing lessons,
 * the student set) and returns a concrete assignment plan plus a list of students who couldn't be
 * fully scheduled. All DB access lives in the caller (the preview action); nothing here touches
 * Prisma, so the packing/fairness logic can be tested in isolation.
 */

export type AvailabilityWindow = TimeSlot; // { dayOfWeek, startTime "HH:mm", endTime "HH:mm" }
export type HolidayRange = { startDate: Date; endDate: Date };
export type ExistingLesson = { scheduledAt: Date; durationMins: number };

export type PlannedLesson = { studentId: string; scheduledAt: Date; durationMins: number };
export type UnfilledStudent = { studentId: string; scheduled: number; wanted: number };
export type BulkPlan = { assignments: PlannedLesson[]; unfilled: UnfilledStudent[]; totalSlots: number };

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function applyMinutesToDate(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

function dateInAnyHoliday(date: Date, holidays: HolidayRange[]): boolean {
  const day = new Date(date);
  day.setHours(12, 0, 0, 0); // midday, to sidestep DST edge cases at midnight
  return holidays.some((h) => {
    const start = new Date(h.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(h.endDate);
    end.setHours(23, 59, 59, 999);
    return day >= start && day <= end;
  });
}

/**
 * Enumerates every concrete (date + start-time) slot across the term: for each availability window,
 * on each matching weekday within [termStart, termEnd] that isn't inside a holiday, pack
 * back-to-back lessons of `durationMins` separated by `minGapMinutes`. Sorted chronologically.
 */
export function buildConcreteSlots(
  termStart: Date,
  termEnd: Date,
  windows: AvailabilityWindow[],
  durationMins: number,
  minGapMinutes: number,
  holidays: HolidayRange[]
): { scheduledAt: Date; durationMins: number }[] {
  const slots: { scheduledAt: Date; durationMins: number }[] = [];

  for (const window of windows) {
    const windowStart = toMinutes(window.startTime);
    const windowEnd = toMinutes(window.endTime);
    if (windowEnd - windowStart < durationMins) continue;

    const dates = getWeeklyDatesInRange(termStart, termEnd, window.dayOfWeek);
    for (const date of dates) {
      if (dateInAnyHoliday(date, holidays)) continue;
      let t = windowStart;
      while (t + durationMins <= windowEnd) {
        slots.push({ scheduledAt: applyMinutesToDate(date, t), durationMins });
        t += durationMins + minGapMinutes;
      }
    }
  }

  slots.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  return slots;
}

function overlapsExisting(
  slot: { scheduledAt: Date; durationMins: number },
  existing: ExistingLesson[]
): boolean {
  const start = slot.scheduledAt.getTime();
  const end = start + slot.durationMins * 60_000;
  return existing.some((e) => {
    const es = e.scheduledAt.getTime();
    return rangesOverlap(start, end, es, es + e.durationMins * 60_000);
  });
}

/**
 * Greedy fair allocation: walk concrete slots chronologically; each is used at most once (so the
 * teacher is never double-booked). Assign each slot to the student who still needs lessons, has the
 * fewest so far, and doesn't already have a lesson that day (spreads lessons across weeks rather
 * than clustering). Students left below target are returned in `unfilled` — the spec's "flag anyone
 * who can't be fully scheduled rather than silently under-book them".
 */
export function planBulkTimetable(input: {
  termStart: Date;
  termEnd: Date;
  windows: AvailabilityWindow[];
  durationMins: number;
  minGapMinutes: number;
  holidays: HolidayRange[];
  existingLessons: ExistingLesson[];
  studentIds: string[];
  targetPerStudent: number;
}): BulkPlan {
  const concrete = buildConcreteSlots(
    input.termStart,
    input.termEnd,
    input.windows,
    input.durationMins,
    input.minGapMinutes,
    input.holidays
  ).filter((slot) => !overlapsExisting(slot, input.existingLessons));

  const counts = new Map<string, number>(input.studentIds.map((id) => [id, 0]));
  const usedDates = new Map<string, Set<string>>(input.studentIds.map((id) => [id, new Set()]));
  const assignments: PlannedLesson[] = [];

  for (const slot of concrete) {
    if (input.studentIds.every((id) => (counts.get(id) ?? 0) >= input.targetPerStudent)) break;

    const dateKey = slot.scheduledAt.toDateString();
    const candidate = input.studentIds
      .filter((id) => (counts.get(id) ?? 0) < input.targetPerStudent && !usedDates.get(id)!.has(dateKey))
      .sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0))[0];
    if (!candidate) continue;

    counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    usedDates.get(candidate)!.add(dateKey);
    assignments.push({ studentId: candidate, scheduledAt: slot.scheduledAt, durationMins: slot.durationMins });
  }

  assignments.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const unfilled: UnfilledStudent[] = input.studentIds
    .map((id) => ({ studentId: id, scheduled: counts.get(id) ?? 0, wanted: input.targetPerStudent }))
    .filter((u) => u.scheduled < u.wanted);

  return { assignments, unfilled, totalSlots: concrete.length };
}
