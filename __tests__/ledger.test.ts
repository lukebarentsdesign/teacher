import {
  calculateCashBalance,
  calculateMakeUpCreditsOwed,
  calculateCancellationPayout,
  type LedgerEntryLike,
} from "@/lib/ledger";

function entry(overrides: Partial<LedgerEntryLike>): LedgerEntryLike {
  return {
    amount: 0,
    operation: "CREDIT",
    reason: "PAYMENT",
    ...overrides,
  };
}

describe("calculateCashBalance", () => {
  it("sums payments as credits", () => {
    const entries = [
      entry({ amount: 100, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 50, operation: "CREDIT", reason: "PAYMENT" }),
    ];
    expect(calculateCashBalance(entries)).toBe(150);
  });

  it("subtracts delivered lessons as debits", () => {
    const entries = [
      entry({ amount: 100, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
    ];
    expect(calculateCashBalance(entries)).toBe(60);
  });

  it("goes negative when more lessons are consumed than paid for", () => {
    const entries = [
      entry({ amount: 40, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
    ];
    expect(calculateCashBalance(entries)).toBe(-20);
  });

  it("handles Decimal-like string amounts", () => {
    const entries = [entry({ amount: "99.99", operation: "CREDIT", reason: "PAYMENT" })];
    expect(calculateCashBalance(entries)).toBeCloseTo(99.99);
  });

  it("excludes make-up credit entries from the cash balance entirely", () => {
    const entries = [
      entry({ amount: 100, operation: "CREDIT", reason: "PAYMENT" }),
      // Even a non-zero amount on a make-up-credit reason must not affect cash balance.
      entry({ amount: 20, operation: "CREDIT", reason: "MAKE_UP_CREDIT_ISSUED" }),
      entry({ amount: 20, operation: "DEBIT", reason: "MAKE_UP_CREDIT_REDEEMED" }),
    ];
    expect(calculateCashBalance(entries)).toBe(100);
  });

  it("includes manual corrections and cancellation adjustments", () => {
    const entries = [
      entry({ amount: 100, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 10, operation: "DEBIT", reason: "MANUAL_CORRECTION" }),
      entry({ amount: 5, operation: "CREDIT", reason: "CANCELLATION_ADJUSTMENT" }),
    ];
    expect(calculateCashBalance(entries)).toBe(95);
  });

  it("returns 0 for an empty ledger", () => {
    expect(calculateCashBalance([])).toBe(0);
  });
});

describe("calculateMakeUpCreditsOwed", () => {
  it("is 0 when none have been issued", () => {
    expect(calculateMakeUpCreditsOwed([])).toBe(0);
  });

  it("counts issued credits not yet redeemed", () => {
    const entries = [
      entry({ reason: "MAKE_UP_CREDIT_ISSUED" }),
      entry({ reason: "MAKE_UP_CREDIT_ISSUED" }),
    ];
    expect(calculateMakeUpCreditsOwed(entries)).toBe(2);
  });

  it("nets out redeemed credits against issued ones", () => {
    const entries = [
      entry({ reason: "MAKE_UP_CREDIT_ISSUED" }),
      entry({ reason: "MAKE_UP_CREDIT_ISSUED" }),
      entry({ reason: "MAKE_UP_CREDIT_REDEEMED" }),
    ];
    expect(calculateMakeUpCreditsOwed(entries)).toBe(1);
  });

  it("ignores cash-balance entries entirely", () => {
    const entries = [
      entry({ amount: 100, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
    ];
    expect(calculateMakeUpCreditsOwed(entries)).toBe(0);
  });
});

describe("calculateCancellationPayout", () => {
  it("owes a refund to the parent when balance is positive", () => {
    const entries = [
      entry({ amount: 120, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
    ];
    const payout = calculateCancellationPayout(entries);
    expect(payout).toEqual({
      cashBalance: 100,
      refundOwedToParent: 100,
      amountOwedToTeacher: 0,
    });
  });

  it("owes an amount to the teacher when balance is negative", () => {
    const entries = [
      entry({ amount: 40, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
      entry({ amount: 20, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
    ];
    const payout = calculateCancellationPayout(entries);
    expect(payout).toEqual({
      cashBalance: -20,
      refundOwedToParent: 0,
      amountOwedToTeacher: 20,
    });
  });

  it("owes nothing either way when balance is exactly zero", () => {
    const entries = [
      entry({ amount: 40, operation: "CREDIT", reason: "PAYMENT" }),
      entry({ amount: 40, operation: "DEBIT", reason: "LESSON_DELIVERED" }),
    ];
    const payout = calculateCancellationPayout(entries);
    expect(payout).toEqual({
      cashBalance: 0,
      refundOwedToParent: 0,
      amountOwedToTeacher: 0,
    });
  });
});
