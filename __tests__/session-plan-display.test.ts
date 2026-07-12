import { resolveNowNext, type DisplayLesson, type DisplayGroupClass } from "@/lib/session-plan-display";

describe("resolveNowNext", () => {
  // Wednesday 2026-07-15
  const today = new Date(2026, 6, 15, 10, 0, 0);

  test("picks the in-progress lesson as now", () => {
    const lessons: DisplayLesson[] = [
      {
        kind: "lesson",
        id: "l1",
        title: "Alice",
        scheduledAt: new Date(2026, 6, 15, 9, 30),
        durationMins: 45,
        plan: { title: "Scales", content: "Warm up with scales" },
      },
    ];
    const result = resolveNowNext(lessons, [], today);
    expect(result.now?.id).toBe("l1");
    expect(result.next).toBeNull();
  });

  test("picks the soonest upcoming occurrence as next, ignoring past ones", () => {
    const lessons: DisplayLesson[] = [
      { kind: "lesson", id: "past", title: "Bob", scheduledAt: new Date(2026, 6, 15, 8, 0), durationMins: 30, plan: null },
      { kind: "lesson", id: "soon", title: "Cara", scheduledAt: new Date(2026, 6, 15, 10, 30), durationMins: 30, plan: null },
      { kind: "lesson", id: "later", title: "Dan", scheduledAt: new Date(2026, 6, 15, 12, 0), durationMins: 30, plan: null },
    ];
    const result = resolveNowNext(lessons, [], today);
    expect(result.now).toBeNull();
    expect(result.next?.id).toBe("soon");
  });

  test("includes a recurring group class only on its matching weekday", () => {
    const groupClasses: DisplayGroupClass[] = [
      { kind: "groupClass", id: "gc-wed", title: "Wed class", dayOfWeek: 3, startTime: "10:15", endTime: "11:00", plan: null },
      { kind: "groupClass", id: "gc-thu", title: "Thu class", dayOfWeek: 4, startTime: "09:00", endTime: "10:00", plan: null },
    ];
    const result = resolveNowNext([], groupClasses, today);
    expect(result.next?.id).toBe("gc-wed");
  });
});
