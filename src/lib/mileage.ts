const HIGH_RATE = 0.45; // pence-equivalent as £/mile, first tier
const LOW_RATE = 0.25;
const HIGH_RATE_THRESHOLD_MILES = 10_000;

export type MileageAllowance = { totalMiles: number; totalAllowance: number };

/**
 * HMRC's mileage allowance is tiered cumulatively across a single tax year: the first 10,000
 * miles at 45p, everything after at 25p — not per-trip. `tripMiles` must already be in
 * chronological order within the tax year for the cumulative threshold to land correctly.
 */
export function calculateMileageAllowance(tripMiles: number[]): MileageAllowance {
  let totalMiles = 0;
  let totalAllowance = 0;

  for (const miles of tripMiles) {
    const milesBefore = totalMiles;
    const milesAfter = totalMiles + miles;

    const milesAtHighRate = Math.max(0, Math.min(milesAfter, HIGH_RATE_THRESHOLD_MILES) - milesBefore);
    const milesAtLowRate = miles - milesAtHighRate;

    totalAllowance += milesAtHighRate * HIGH_RATE + milesAtLowRate * LOW_RATE;
    totalMiles = milesAfter;
  }

  return { totalMiles, totalAllowance };
}

/** UK tax year runs 6 April to 5 April — e.g. taxYear 2026 covers 2026-04-06 to 2027-04-05. */
export function taxYearRange(taxYear: number): { start: Date; end: Date } {
  const start = new Date(taxYear, 3, 6, 0, 0, 0, 0);
  const end = new Date(taxYear + 1, 3, 5, 23, 59, 59, 999);
  return { start, end };
}

/** Which UK tax year a given date falls in (returns the tax year's starting calendar year). */
export function taxYearForDate(date: Date): number {
  const aprilSixThisYear = new Date(date.getFullYear(), 3, 6);
  return date >= aprilSixThisYear ? date.getFullYear() : date.getFullYear() - 1;
}
