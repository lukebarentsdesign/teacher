import { isOverdue, type CheckInLike } from "@/lib/lone-worker";

const base: CheckInLike = {
  checkedOutAt: null,
  expectedEndAt: new Date(2026, 0, 10, 16, 0),
  graceMinutes: 15,
  alertSentAt: null,
};

describe("isOverdue", () => {
  test("not overdue before the expected end time", () => {
    expect(isOverdue(base, new Date(2026, 0, 10, 15, 30))).toBe(false);
  });

  test("not overdue within the grace period", () => {
    expect(isOverdue(base, new Date(2026, 0, 10, 16, 10))).toBe(false);
  });

  test("overdue once past expectedEndAt + grace", () => {
    expect(isOverdue(base, new Date(2026, 0, 10, 16, 16))).toBe(true);
  });

  test("never overdue once checked out", () => {
    const checkedOut = { ...base, checkedOutAt: new Date(2026, 0, 10, 15, 50) };
    expect(isOverdue(checkedOut, new Date(2026, 0, 10, 17, 0))).toBe(false);
  });

  test("never overdue once an alert was already sent", () => {
    const alerted = { ...base, alertSentAt: new Date(2026, 0, 10, 16, 20) };
    expect(isOverdue(alerted, new Date(2026, 0, 10, 17, 0))).toBe(false);
  });
});
