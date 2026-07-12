/** Null capacity = unlimited, always CONFIRMED. Otherwise CONFIRMED while under capacity, else WAITLISTED. */
export function resolveBookingStatus(capacity: number | null, confirmedCount: number): "CONFIRMED" | "WAITLISTED" {
  if (capacity == null) return "CONFIRMED";
  return confirmedCount < capacity ? "CONFIRMED" : "WAITLISTED";
}

export type WaitlistCandidate = { id: string; bookedAt: Date };

/** Picks the earliest-booked WAITLISTED booking to promote, if capacity now allows one more CONFIRMED. */
export function pickPromotionCandidate(
  capacity: number | null,
  confirmedCount: number,
  waitlisted: WaitlistCandidate[]
): WaitlistCandidate | null {
  if (capacity != null && confirmedCount >= capacity) return null;
  if (waitlisted.length === 0) return null;
  return [...waitlisted].sort((a, b) => a.bookedAt.getTime() - b.bookedAt.getTime())[0];
}
