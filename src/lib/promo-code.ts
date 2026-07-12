export type PromoCodeLike = {
  discountType: "PERCENT" | "FIXED";
  value: number;
  validFrom: Date | null;
  validTo: Date | null;
  usageLimit: number | null;
  timesUsed: number;
};

export function isPromoCodeValid(promo: PromoCodeLike, now: Date): { valid: boolean; reason?: string } {
  if (promo.validFrom && now < promo.validFrom) return { valid: false, reason: "Not yet active" };
  if (promo.validTo && now > promo.validTo) return { valid: false, reason: "Expired" };
  if (promo.usageLimit != null && promo.timesUsed >= promo.usageLimit) {
    return { valid: false, reason: "Usage limit reached" };
  }
  return { valid: true };
}

/** FIXED is capped at baseAmount — a discount can never turn into a credit larger than the bill. */
export function computeDiscountAmount(promo: Pick<PromoCodeLike, "discountType" | "value">, baseAmount: number): number {
  if (promo.discountType === "PERCENT") return baseAmount * (promo.value / 100);
  return Math.min(promo.value, baseAmount);
}
