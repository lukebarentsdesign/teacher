import { resolveBookingStatus, pickPromotionCandidate } from "@/lib/group-booking";

describe("resolveBookingStatus", () => {
  test("unlimited capacity is always CONFIRMED", () => {
    expect(resolveBookingStatus(null, 999)).toBe("CONFIRMED");
  });

  test("CONFIRMED while under capacity", () => {
    expect(resolveBookingStatus(5, 4)).toBe("CONFIRMED");
  });

  test("WAITLISTED once at or over capacity", () => {
    expect(resolveBookingStatus(5, 5)).toBe("WAITLISTED");
    expect(resolveBookingStatus(5, 6)).toBe("WAITLISTED");
  });
});

describe("pickPromotionCandidate", () => {
  test("promotes the earliest-booked waitlisted entry when a spot frees up", () => {
    const waitlisted = [
      { id: "b2", bookedAt: new Date(2026, 0, 2) },
      { id: "b1", bookedAt: new Date(2026, 0, 1) },
    ];
    expect(pickPromotionCandidate(5, 4, waitlisted)?.id).toBe("b1");
  });

  test("returns null when still at or over capacity", () => {
    const waitlisted = [{ id: "b1", bookedAt: new Date(2026, 0, 1) }];
    expect(pickPromotionCandidate(5, 5, waitlisted)).toBeNull();
  });

  test("returns null when nobody is waitlisted", () => {
    expect(pickPromotionCandidate(5, 2, [])).toBeNull();
  });

  test("unlimited capacity still promotes if someone is waitlisted", () => {
    const waitlisted = [{ id: "b1", bookedAt: new Date(2026, 0, 1) }];
    expect(pickPromotionCandidate(null, 100, waitlisted)?.id).toBe("b1");
  });
});
