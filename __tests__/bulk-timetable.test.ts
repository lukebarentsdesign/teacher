import {
  buildConcreteSlots,
  planBulkTimetable,
  type AvailabilityWindow,
} from "@/lib/bulk-timetable";

// A generous single window: Mondays 15:00–18:00 (dayOfWeek 1).
const mondayWindow: AvailabilityWindow[] = [{ dayOfWeek: 1, startTime: "15:00", endTime: "18:00" }];

// A term spanning ~4 Mondays: 2026-01-05 (Mon) .. 2026-02-02 (Mon).
const termStart = new Date("2026-01-05T00:00:00");
const termEnd = new Date("2026-02-02T23:59:59");

describe("buildConcreteSlots", () => {
  it("packs lessons with the gap and skips holidays", () => {
    // 3h window, 30-min lessons + 10-min gap → 4 slots/day (30+10 repeating: 4*30 + 3*10 = 150 ≤ 180).
    const noHoliday = buildConcreteSlots(termStart, termEnd, mondayWindow, 30, 10, []);
    // 5 Mondays in [Jan 5 .. Feb 2]: 5, 12, 19, 26, Feb 2 → 5 * 4 = 20 slots.
    expect(noHoliday).toHaveLength(20);

    // Blank out the 2026-01-12 week as a holiday → lose 4 slots.
    const withHoliday = buildConcreteSlots(termStart, termEnd, mondayWindow, 30, 10, [
      { startDate: new Date("2026-01-12T00:00:00"), endDate: new Date("2026-01-16T00:00:00") },
    ]);
    expect(withHoliday).toHaveLength(16);
  });

  it("drops a window too short for even one lesson", () => {
    const tiny: AvailabilityWindow[] = [{ dayOfWeek: 1, startTime: "15:00", endTime: "15:20" }];
    expect(buildConcreteSlots(termStart, termEnd, tiny, 30, 10, [])).toHaveLength(0);
  });
});

describe("planBulkTimetable", () => {
  it("gives each student their target, spread one-per-day, never double-booking a slot", () => {
    const plan = planBulkTimetable({
      termStart,
      termEnd,
      windows: mondayWindow,
      durationMins: 30,
      minGapMinutes: 10,
      holidays: [],
      existingLessons: [],
      studentIds: ["a", "b", "c"],
      targetPerStudent: 4,
    });

    expect(plan.unfilled).toHaveLength(0);
    expect(plan.assignments).toHaveLength(12); // 3 students * 4

    // No student gets two lessons on the same day.
    for (const id of ["a", "b", "c"]) {
      const days = plan.assignments.filter((x) => x.studentId === id).map((x) => x.scheduledAt.toDateString());
      expect(new Set(days).size).toBe(days.length);
    }

    // No two lessons share the exact same start time (each concrete slot used once).
    const times = plan.assignments.map((x) => x.scheduledAt.getTime());
    expect(new Set(times).size).toBe(times.length);
  });

  it("flags students who can't be fully scheduled instead of under-booking silently", () => {
    // 20 total slots, but ask for 8 each across 3 students = 24 needed → 4 short.
    const plan = planBulkTimetable({
      termStart,
      termEnd,
      windows: mondayWindow,
      durationMins: 30,
      minGapMinutes: 10,
      holidays: [],
      existingLessons: [],
      studentIds: ["a", "b", "c"],
      targetPerStudent: 8,
    });

    // Only 5 Mondays exist, so the one-per-day rule caps each student at 5 regardless of slot count.
    expect(plan.assignments.length).toBeLessThanOrEqual(20);
    expect(plan.unfilled.length).toBeGreaterThan(0);
    plan.unfilled.forEach((u) => expect(u.scheduled).toBeLessThan(u.wanted));
  });

  it("avoids slots that clash with the teacher's existing lessons", () => {
    // Block the very first slot (2026-01-05 15:00) with an existing lesson.
    const plan = planBulkTimetable({
      termStart,
      termEnd,
      windows: mondayWindow,
      durationMins: 30,
      minGapMinutes: 10,
      holidays: [],
      existingLessons: [{ scheduledAt: new Date("2026-01-05T15:00:00"), durationMins: 30 }],
      studentIds: ["a"],
      targetPerStudent: 1,
    });

    const clash = plan.assignments.find(
      (x) => x.scheduledAt.getTime() === new Date("2026-01-05T15:00:00").getTime()
    );
    expect(clash).toBeUndefined();
  });
});
