import { isWithinTaxSeasonWindow } from "@/lib/nav";

describe("isWithinTaxSeasonWindow", () => {
  test("true in March", () => {
    expect(isWithinTaxSeasonWindow(new Date(2026, 2, 15))).toBe(true);
  });

  test("true in April", () => {
    expect(isWithinTaxSeasonWindow(new Date(2026, 3, 1))).toBe(true);
  });

  test("false in February", () => {
    expect(isWithinTaxSeasonWindow(new Date(2026, 1, 28))).toBe(false);
  });

  test("false in May", () => {
    expect(isWithinTaxSeasonWindow(new Date(2026, 4, 1))).toBe(false);
  });
});
