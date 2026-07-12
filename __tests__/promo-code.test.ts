import { isPromoCodeValid, computeDiscountAmount, type PromoCodeLike } from "@/lib/promo-code";

const base: PromoCodeLike = {
  discountType: "PERCENT",
  value: 20,
  validFrom: null,
  validTo: null,
  usageLimit: null,
  timesUsed: 0,
};

describe("isPromoCodeValid", () => {
  test("valid with no constraints set", () => {
    expect(isPromoCodeValid(base, new Date(2026, 0, 1))).toEqual({ valid: true });
  });

  test("invalid before validFrom", () => {
    const promo = { ...base, validFrom: new Date(2026, 5, 1) };
    expect(isPromoCodeValid(promo, new Date(2026, 0, 1)).valid).toBe(false);
  });

  test("invalid after validTo", () => {
    const promo = { ...base, validTo: new Date(2026, 0, 1) };
    expect(isPromoCodeValid(promo, new Date(2026, 5, 1)).valid).toBe(false);
  });

  test("invalid once usage limit reached", () => {
    const promo = { ...base, usageLimit: 3, timesUsed: 3 };
    expect(isPromoCodeValid(promo, new Date(2026, 0, 1)).valid).toBe(false);
  });

  test("still valid one under the usage limit", () => {
    const promo = { ...base, usageLimit: 3, timesUsed: 2 };
    expect(isPromoCodeValid(promo, new Date(2026, 0, 1)).valid).toBe(true);
  });
});

describe("computeDiscountAmount", () => {
  test("PERCENT computes a fraction of the base amount", () => {
    expect(computeDiscountAmount({ discountType: "PERCENT", value: 20 }, 100)).toBe(20);
  });

  test("FIXED returns the flat value when under the base amount", () => {
    expect(computeDiscountAmount({ discountType: "FIXED", value: 15 }, 100)).toBe(15);
  });

  test("FIXED is capped at the base amount, never exceeding the bill", () => {
    expect(computeDiscountAmount({ discountType: "FIXED", value: 150 }, 100)).toBe(100);
  });
});
