import { resolveCancellationOutcome, type CancellationPolicyLike } from "@/lib/cancellation-policy";

const policy: CancellationPolicyLike = {
  noticeHoursRequired: 24,
  lateCancelAction: "PARTIAL_CHARGE",
  noShowAction: "FULL_CHARGE",
  partialChargePercent: 50,
};

describe("resolveCancellationOutcome", () => {
  test("no policy configured is always free (CREDIT)", () => {
    const scheduledAt = new Date(2026, 0, 10, 16, 0);
    const informedAt = new Date(2026, 0, 10, 16, 0); // even a same-time no-show
    expect(resolveCancellationOutcome(null, scheduledAt, informedAt)).toEqual({ action: "CREDIT", chargeFraction: 0 });
  });

  test("sufficient notice is always free regardless of configured actions", () => {
    const scheduledAt = new Date(2026, 0, 10, 16, 0);
    const informedAt = new Date(2026, 0, 8, 16, 0); // 48h notice
    expect(resolveCancellationOutcome(policy, scheduledAt, informedAt)).toEqual({ action: "CREDIT", chargeFraction: 0 });
  });

  test("late cancellation (informed ahead of time but under the notice window) applies lateCancelAction", () => {
    const scheduledAt = new Date(2026, 0, 10, 16, 0);
    const informedAt = new Date(2026, 0, 10, 6, 0); // 10h notice, under 24h required
    expect(resolveCancellationOutcome(policy, scheduledAt, informedAt)).toEqual({
      action: "PARTIAL_CHARGE",
      chargeFraction: 0.5,
    });
  });

  test("a genuine no-show (informed at or after the scheduled time) applies noShowAction", () => {
    const scheduledAt = new Date(2026, 0, 10, 16, 0);
    const informedAt = new Date(2026, 0, 10, 16, 30); // discovered after the fact
    expect(resolveCancellationOutcome(policy, scheduledAt, informedAt)).toEqual({
      action: "FULL_CHARGE",
      chargeFraction: 1,
    });
  });

  test("FORFEIT charges nothing", () => {
    const forfeitPolicy: CancellationPolicyLike = { ...policy, noShowAction: "FORFEIT" };
    const scheduledAt = new Date(2026, 0, 10, 16, 0);
    const informedAt = new Date(2026, 0, 10, 16, 0);
    expect(resolveCancellationOutcome(forfeitPolicy, scheduledAt, informedAt)).toEqual({
      action: "FORFEIT",
      chargeFraction: 0,
    });
  });
});
