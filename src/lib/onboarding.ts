export type Archetype = "SOLO" | "GROUP_INDEPENDENT";

/**
 * Derived from the two archetype questions, never asked directly (onboarding-ux-spec Section 1).
 * 1:1 always folds to SOLO regardless of who controls the schedule (a rare 1:1-at-a-venue teacher
 * is still closer to solo than to a group instructor). Groups + venue-controlled is the one
 * combination this product doesn't fit — returns null so the caller routes to the out-of-scope
 * capture path instead of forcing a bad-fit archetype.
 */
export function deriveArchetype(teachesGroups: boolean, controlsOwnSchedule: boolean): Archetype | null {
  if (!teachesGroups) return "SOLO";
  if (controlsOwnSchedule) return "GROUP_INDEPENDENT";
  return null;
}

export type DismissedCards = Record<string, string>; // cardId -> ISO dismissal timestamp

/**
 * A dismissed card reappears once its underlying condition is still true after `cooldownDays` —
 * e.g. "connect Stripe" resurfaces weekly rather than being gone forever after one dismissal.
 * Never dismissed = always shown (subject to the caller's own condition check first).
 */
export function shouldShowCard(
  cardId: string,
  dismissedCards: DismissedCards,
  now: Date,
  cooldownDays: number
): boolean {
  const dismissedAt = dismissedCards[cardId];
  if (!dismissedAt) return true;
  const daysSince = (now.getTime() - new Date(dismissedAt).getTime()) / (24 * 60 * 60 * 1000);
  return daysSince >= cooldownDays;
}
