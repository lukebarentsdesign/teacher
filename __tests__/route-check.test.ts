import { checkDayFeasibility, type DayStop } from "@/lib/route-check";

const travelTimes: Record<string, number> = {
  "loc-a|loc-b": 30,
};
const lookup = (from: string, to: string) => travelTimes[`${from}|${to}`] ?? null;

describe("checkDayFeasibility", () => {
  test("flags a gap shorter than the known travel time", () => {
    const stops: DayStop[] = [
      { id: "s1", locationId: "loc-a", locationName: "A", scheduledAt: new Date(2026, 0, 10, 9, 0), durationMins: 30 },
      { id: "s2", locationId: "loc-b", locationName: "B", scheduledAt: new Date(2026, 0, 10, 9, 45), durationMins: 30 },
    ];
    const issues = checkDayFeasibility(stops, lookup);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ fromStopId: "s1", toStopId: "s2", requiredMinutes: 30 });
    expect(issues[0].gapMinutes).toBe(15);
  });

  test("no issue when the gap is sufficient", () => {
    const stops: DayStop[] = [
      { id: "s1", locationId: "loc-a", locationName: "A", scheduledAt: new Date(2026, 0, 10, 9, 0), durationMins: 30 },
      { id: "s2", locationId: "loc-b", locationName: "B", scheduledAt: new Date(2026, 0, 10, 10, 0), durationMins: 30 },
    ];
    expect(checkDayFeasibility(stops, lookup)).toHaveLength(0);
  });

  test("skips consecutive stops at the same location", () => {
    const stops: DayStop[] = [
      { id: "s1", locationId: "loc-a", locationName: "A", scheduledAt: new Date(2026, 0, 10, 9, 0), durationMins: 30 },
      { id: "s2", locationId: "loc-a", locationName: "A", scheduledAt: new Date(2026, 0, 10, 9, 30), durationMins: 30 },
    ];
    expect(checkDayFeasibility(stops, lookup)).toHaveLength(0);
  });

  test("skips a pair with no known travel time rather than guessing", () => {
    const stops: DayStop[] = [
      { id: "s1", locationId: "loc-a", locationName: "A", scheduledAt: new Date(2026, 0, 10, 9, 0), durationMins: 30 },
      { id: "s2", locationId: "loc-c", locationName: "C", scheduledAt: new Date(2026, 0, 10, 9, 31), durationMins: 30 },
    ];
    expect(checkDayFeasibility(stops, lookup)).toHaveLength(0);
  });

  test("sorts stops chronologically before checking, regardless of input order", () => {
    const stops: DayStop[] = [
      { id: "s2", locationId: "loc-b", locationName: "B", scheduledAt: new Date(2026, 0, 10, 9, 45), durationMins: 30 },
      { id: "s1", locationId: "loc-a", locationName: "A", scheduledAt: new Date(2026, 0, 10, 9, 0), durationMins: 30 },
    ];
    const issues = checkDayFeasibility(stops, lookup);
    expect(issues).toHaveLength(1);
    expect(issues[0].fromStopId).toBe("s1");
  });
});
