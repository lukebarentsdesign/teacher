import { deriveArchetype, shouldShowCard } from "@/lib/onboarding";

describe("deriveArchetype", () => {
  test("1:1 always folds to SOLO regardless of who controls the schedule", () => {
    expect(deriveArchetype(false, true)).toBe("SOLO");
    expect(deriveArchetype(false, false)).toBe("SOLO");
  });

  test("groups + self-controlled schedule is GROUP_INDEPENDENT", () => {
    expect(deriveArchetype(true, true)).toBe("GROUP_INDEPENDENT");
  });

  test("groups + venue-controlled schedule is out of scope (null)", () => {
    expect(deriveArchetype(true, false)).toBeNull();
  });
});

describe("shouldShowCard", () => {
  const now = new Date(2026, 5, 15);

  test("never-dismissed card is always shown", () => {
    expect(shouldShowCard("stripe", {}, now, 7)).toBe(true);
  });

  test("dismissed card within the cooldown window is hidden", () => {
    const dismissed = { stripe: new Date(2026, 5, 12).toISOString() };
    expect(shouldShowCard("stripe", dismissed, now, 7)).toBe(false);
  });

  test("dismissed card past the cooldown window reappears", () => {
    const dismissed = { stripe: new Date(2026, 5, 1).toISOString() };
    expect(shouldShowCard("stripe", dismissed, now, 7)).toBe(true);
  });

  test("a different card's dismissal doesn't affect this one", () => {
    const dismissed = { "another-card": now.toISOString() };
    expect(shouldShowCard("stripe", dismissed, now, 7)).toBe(true);
  });
});
