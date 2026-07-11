import {
  slotHitsProtectedBlock,
  filterAvailableSlots,
  getWeeklyDatesInRange,
  generateFixedSchedule,
  generateFluidSchedule,
  countLessonsBySlot,
  slotDurationMins,
  lessonsOverlap,
  deriveGhostSlots,
  projectSlotOntoWeek,
  type TimeSlot,
  type ProtectedBlock,
} from "@/lib/scheduling";

describe("slotHitsProtectedBlock", () => {
  const protectedBlocks: ProtectedBlock[] = [
    { dayOfWeek: 1, startTime: "12:00", endTime: "13:00", label: "Lunch" },
  ];

  it("flags a slot that overlaps a protected block on the same day", () => {
    const slot: TimeSlot = { dayOfWeek: 1, startTime: "12:30", endTime: "13:00" };
    expect(slotHitsProtectedBlock(slot, protectedBlocks)).toBe(true);
  });

  it("does not flag a slot on a different day", () => {
    const slot: TimeSlot = { dayOfWeek: 2, startTime: "12:30", endTime: "13:00" };
    expect(slotHitsProtectedBlock(slot, protectedBlocks)).toBe(false);
  });

  it("does not flag a slot that is adjacent but non-overlapping", () => {
    const slot: TimeSlot = { dayOfWeek: 1, startTime: "13:00", endTime: "13:30" };
    expect(slotHitsProtectedBlock(slot, protectedBlocks)).toBe(false);
  });

  it("flags a slot that fully contains the protected block", () => {
    const slot: TimeSlot = { dayOfWeek: 1, startTime: "11:00", endTime: "14:00" };
    expect(slotHitsProtectedBlock(slot, protectedBlocks)).toBe(true);
  });
});

describe("filterAvailableSlots", () => {
  it("drops only the slots that violate a protected block", () => {
    const protectedBlocks: ProtectedBlock[] = [
      { dayOfWeek: 1, startTime: "12:00", endTime: "13:00" },
    ];
    const candidates: TimeSlot[] = [
      { dayOfWeek: 1, startTime: "12:30", endTime: "13:00" }, // hits it
      { dayOfWeek: 2, startTime: "12:30", endTime: "13:00" }, // different day, fine
      { dayOfWeek: 1, startTime: "09:00", endTime: "09:30" }, // same day, no overlap
    ];
    const result = filterAvailableSlots(candidates, protectedBlocks);
    expect(result).toHaveLength(2);
    expect(result).not.toContainEqual(candidates[0]);
  });
});

describe("getWeeklyDatesInRange", () => {
  it("returns every occurrence of the weekday within the range", () => {
    // 2026 Jan 1 is a Thursday; range covers exactly 4 Mondays (dayOfWeek 1)
    const termStart = new Date("2026-01-01T00:00:00");
    const termEnd = new Date("2026-01-28T00:00:00");
    const mondays = getWeeklyDatesInRange(termStart, termEnd, 1);
    expect(mondays).toHaveLength(4);
    mondays.forEach((date) => expect(date.getDay()).toBe(1));
  });

  it("returns an empty array when the range is shorter than a week and misses the day", () => {
    const termStart = new Date("2026-01-01T00:00:00"); // Thursday
    const termEnd = new Date("2026-01-02T00:00:00"); // Friday
    expect(getWeeklyDatesInRange(termStart, termEnd, 1)).toHaveLength(0);
  });
});

describe("generateFixedSchedule", () => {
  it("produces one lesson per week at the same time, for the whole term", () => {
    const termStart = new Date("2026-01-01T00:00:00");
    const termEnd = new Date("2026-01-28T00:00:00");
    const slot: TimeSlot = { dayOfWeek: 1, startTime: "16:00", endTime: "16:30" };

    const lessons = generateFixedSchedule(termStart, termEnd, slot);

    expect(lessons).toHaveLength(4);
    expect(slotDurationMins(slot)).toBe(30);
    lessons.forEach((lesson) => {
      expect(lesson.durationMins).toBe(30);
      expect(lesson.scheduledAt.getDay()).toBe(1);
      expect(lesson.scheduledAt.getHours()).toBe(16);
      expect(lesson.scheduledAt.getMinutes()).toBe(0);
    });
  });
});

describe("generateFluidSchedule", () => {
  const termStart = new Date("2026-01-01T00:00:00"); // Thursday
  const termEnd = new Date("2026-03-26T00:00:00"); // ~12 weeks later

  const candidateSlots: TimeSlot[] = [
    { dayOfWeek: 1, startTime: "16:00", endTime: "16:30" },
    { dayOfWeek: 3, startTime: "16:00", endTime: "16:30" },
    { dayOfWeek: 5, startTime: "16:00", endTime: "16:30" },
  ];

  it("rotates through every candidate slot rather than pinning to one day", () => {
    const lessons = generateFluidSchedule(termStart, termEnd, candidateSlots);
    const usedDays = new Set(lessons.map((l) => l.slot.dayOfWeek));
    expect(usedDays.size).toBe(3);
  });

  it("keeps usage counts within one lesson of each other across all slots", () => {
    const lessons = generateFluidSchedule(termStart, termEnd, candidateSlots);
    const counts = Array.from(countLessonsBySlot(lessons).values());
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("returns no lessons when there are no available candidate slots", () => {
    expect(generateFluidSchedule(termStart, termEnd, [])).toHaveLength(0);
  });

  it("never schedules outside the term boundaries", () => {
    const lessons = generateFluidSchedule(termStart, termEnd, candidateSlots);
    lessons.forEach((lesson) => {
      expect(lesson.scheduledAt.getTime()).toBeGreaterThanOrEqual(termStart.getTime());
      expect(lesson.scheduledAt.getTime()).toBeLessThanOrEqual(termEnd.getTime() + 24 * 60 * 60 * 1000);
    });
  });
});

describe("lessonsOverlap", () => {
  it("flags an exact match", () => {
    const a = { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 30 };
    const b = { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 30 };
    expect(lessonsOverlap(a, b)).toBe(true);
  });

  it("flags a partial overlap even with different durations and start times", () => {
    const a = { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 60 };
    const b = { scheduledAt: new Date("2026-01-05T16:30:00"), durationMins: 30 };
    expect(lessonsOverlap(a, b)).toBe(true);
  });

  it("does not flag adjacent, non-overlapping lessons", () => {
    const a = { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 30 };
    const b = { scheduledAt: new Date("2026-01-05T16:30:00"), durationMins: 30 };
    expect(lessonsOverlap(a, b)).toBe(false);
  });

  it("flags one lesson fully containing another", () => {
    const a = { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 120 };
    const b = { scheduledAt: new Date("2026-01-05T16:30:00"), durationMins: 15 };
    expect(lessonsOverlap(a, b)).toBe(true);
  });

  it("does not flag the same time-of-day on different calendar dates", () => {
    const a = { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 30 };
    const b = { scheduledAt: new Date("2026-01-12T16:00:00"), durationMins: 30 };
    expect(lessonsOverlap(a, b)).toBe(false);
  });
});

describe("deriveGhostSlots", () => {
  it("de-duplicates repeated historical slots into one distinct entry", () => {
    const pastLessons = [
      { scheduledAt: new Date("2026-01-05T16:00:00"), durationMins: 30 }, // Monday
      { scheduledAt: new Date("2026-01-12T16:00:00"), durationMins: 30 }, // Monday, same slot
      { scheduledAt: new Date("2026-01-07T10:00:00"), durationMins: 45 }, // Wednesday
    ];
    const slots = deriveGhostSlots(pastLessons);
    expect(slots).toHaveLength(2);
    expect(slots.some((s) => s.dayOfWeek === 1 && s.startTime === "16:00")).toBe(true);
    expect(slots.some((s) => s.dayOfWeek === 3 && s.startTime === "10:00")).toBe(true);
  });

  it("returns an empty array for no history", () => {
    expect(deriveGhostSlots([])).toHaveLength(0);
  });
});

describe("projectSlotOntoWeek", () => {
  it("projects a slot onto the correct day of the target week", () => {
    const slot: TimeSlot = { dayOfWeek: 3, startTime: "10:00", endTime: "10:45" };
    const weekOf = new Date("2026-02-10T00:00:00"); // a Tuesday
    const projected = projectSlotOntoWeek(slot, weekOf);
    expect(projected.getDay()).toBe(3);
    expect(projected.getHours()).toBe(10);
    expect(projected.getMinutes()).toBe(0);
  });
});
