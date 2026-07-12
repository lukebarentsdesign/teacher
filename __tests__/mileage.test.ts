import { calculateMileageAllowance, taxYearRange, taxYearForDate } from "@/lib/mileage";

describe("calculateMileageAllowance", () => {
  test("all trips under 10,000 miles use the high rate", () => {
    const result = calculateMileageAllowance([100, 200, 300]);
    expect(result.totalMiles).toBe(600);
    expect(result.totalAllowance).toBeCloseTo(600 * 0.45, 5);
  });

  test("a single trip crossing the 10,000-mile threshold splits rates within that trip", () => {
    const result = calculateMileageAllowance([9900, 200]);
    // 100 miles finish the high-rate tier, remaining 100 miles of that trip at low rate
    const expected = 9900 * 0.45 + 100 * 0.45 + 100 * 0.25;
    expect(result.totalAllowance).toBeCloseTo(expected, 5);
  });

  test("trips entirely after the threshold use the low rate", () => {
    const result = calculateMileageAllowance([10000, 500]);
    expect(result.totalAllowance).toBeCloseTo(10000 * 0.45 + 500 * 0.25, 5);
  });

  test("empty list is zero", () => {
    expect(calculateMileageAllowance([])).toEqual({ totalMiles: 0, totalAllowance: 0 });
  });
});

describe("taxYearRange", () => {
  test("2026 tax year runs 6 April 2026 to 5 April 2027", () => {
    const { start, end } = taxYearRange(2026);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3); // April
    expect(start.getDate()).toBe(6);
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(5);
  });
});

describe("taxYearForDate", () => {
  test("a date before 6 April belongs to the previous tax year", () => {
    expect(taxYearForDate(new Date(2026, 2, 1))).toBe(2025);
  });

  test("a date on or after 6 April belongs to that calendar year's tax year", () => {
    expect(taxYearForDate(new Date(2026, 3, 6))).toBe(2026);
    expect(taxYearForDate(new Date(2026, 11, 25))).toBe(2026);
  });
});
