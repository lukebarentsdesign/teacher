export type DayStop = {
  id: string;
  locationId: string;
  locationName: string;
  scheduledAt: Date;
  durationMins: number;
};

export type RouteIssue = {
  fromStopId: string;
  toStopId: string;
  gapMinutes: number;
  requiredMinutes: number;
};

/**
 * Flags a scheduled gap between two consecutive same-day stops that's shorter than the known
 * travel time between their locations — distinct from the existing scheduling-conflict detection
 * (splitConflicts in timetable.ts), which checks for double-booking overlaps, not travel
 * feasibility between two non-overlapping bookings. `travelMinutes` looks up a directional
 * (fromLocationId, toLocationId) → minutes estimate; a missing entry means that pair simply isn't
 * checked (not flagged as fine, not flagged as a problem — there's nothing to judge it against).
 */
export function checkDayFeasibility(
  stops: DayStop[],
  travelMinutes: (fromLocationId: string, toLocationId: string) => number | null
): RouteIssue[] {
  const sorted = [...stops].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const issues: RouteIssue[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.locationId === next.locationId) continue;

    const required = travelMinutes(current.locationId, next.locationId);
    if (required == null) continue;

    const currentEnd = new Date(current.scheduledAt.getTime() + current.durationMins * 60_000);
    const gapMinutes = (next.scheduledAt.getTime() - currentEnd.getTime()) / 60_000;

    if (gapMinutes < required) {
      issues.push({ fromStopId: current.id, toStopId: next.id, gapMinutes, requiredMinutes: required });
    }
  }

  return issues;
}
