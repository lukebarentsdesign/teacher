import { calculateIncomeByMonth, calculateExpensesByMonth, projectForwardIncome } from "@/lib/forecast";

describe("calculateIncomeByMonth", () => {
  it("buckets amounts by calendar month", () => {
    const payments = [
      { amount: 100, date: new Date("2026-01-05") },
      { amount: 50, date: new Date("2026-01-20") },
      { amount: 75, date: new Date("2026-02-01") },
    ];
    const totals = calculateIncomeByMonth(payments);
    expect(totals.get("2026-01")).toBe(150);
    expect(totals.get("2026-02")).toBe(75);
  });

  it("handles Decimal-like string amounts", () => {
    const payments = [{ amount: "42.50", date: new Date("2026-03-01") }];
    expect(calculateIncomeByMonth(payments).get("2026-03")).toBe(42.5);
  });

  it("returns an empty map for no rows", () => {
    expect(calculateIncomeByMonth([]).size).toBe(0);
  });
});

describe("calculateExpensesByMonth", () => {
  it("buckets the same way as income", () => {
    const expenses = [{ amount: 20, date: new Date("2026-01-15") }];
    expect(calculateExpensesByMonth(expenses).get("2026-01")).toBe(20);
  });
});

describe("projectForwardIncome", () => {
  it("projects annualFee/12 per active subscription per month", () => {
    const subs = [{ annualFee: 1200 }, { annualFee: 600 }];
    const from = new Date("2026-01-01");
    const projection = projectForwardIncome(subs, 3, from);
    expect(projection.size).toBe(3);
    for (const value of projection.values()) {
      expect(value).toBe(100 + 50); // 1200/12 + 600/12
    }
  });

  it("returns an empty map when monthsAhead is 0", () => {
    expect(projectForwardIncome([{ annualFee: 1200 }], 0).size).toBe(0);
  });

  it("returns zero-valued months when there are no active subscriptions", () => {
    const projection = projectForwardIncome([], 2, new Date("2026-01-01"));
    expect([...projection.values()]).toEqual([0, 0]);
  });
});
