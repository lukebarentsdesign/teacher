import { calculateSubscriptionSchedule } from "@/lib/billing-calculations";

describe("calculateSubscriptionSchedule", () => {
  test("calculates even division correctly (30 lessons @ 32 = 960 / 12 = 80/month)", () => {
    const result = calculateSubscriptionSchedule(30, 32, 12, new Date(2026, 0, 15));
    
    expect(result.annualTotal).toBe(960);
    expect(result.monthlyAmount).toBe(80);
    expect(result.months).toBe(12);
    expect(result.schedule.length).toBe(12);
    
    // Every month should be exactly 80.00
    result.schedule.forEach((item) => {
      expect(item.amount).toBe(80);
    });
  });

  test("handles penny rounding on the final month (e.g. 33 lessons @ 32.50 = 1072.50 / 12 = 89.375)", () => {
    // 33 * 32.50 = 1072.50
    // 1072.50 / 12 = 89.375 -> rounded down to 89.37 per month
    // 89.37 * 11 months = 983.07
    // Final month should be 1072.50 - 983.07 = 89.43
    const result = calculateSubscriptionSchedule(33, 32.50, 12, new Date(2026, 0, 1));
    
    expect(result.annualTotal).toBe(1072.50);
    expect(result.monthlyAmount).toBe(89.37);
    expect(result.schedule.length).toBe(12);
    
    // First 11 months should be 89.37
    for (let i = 0; i < 11; i++) {
      expect(result.schedule[i].amount).toBe(89.37);
      expect(result.schedule[i].isLast).toBe(false);
    }
    
    // Last month should be 89.43
    const lastItem = result.schedule[11];
    expect(lastItem.amount).toBe(89.43);
    expect(lastItem.isLast).toBe(true);
    
    // Sum of all items must equal annualTotal exactly
    const sum = result.schedule.reduce((acc, item) => acc + item.amount, 0);
    expect(Number(sum.toFixed(2))).toBe(1072.50);
  });

  test("prevents setting months <= 0", () => {
    expect(() => {
      calculateSubscriptionSchedule(30, 32, 0, new Date());
    }).toThrow("Months must be greater than 0");
  });

  test("properly handles JavaScript Date overflow in monthly increments", () => {
    // Start date: January 31, 2026
    // Feb: last day of Feb (28)
    // Mar: last day of Mar (31)
    const result = calculateSubscriptionSchedule(12, 10, 12, new Date(2026, 0, 31));
    
    expect(result.schedule[0].date.getMonth()).toBe(0); // Jan
    expect(result.schedule[0].date.getDate()).toBe(31);
    
    expect(result.schedule[1].date.getMonth()).toBe(1); // Feb
    expect(result.schedule[1].date.getDate()).toBe(28); // 2026 is not a leap year
    
    expect(result.schedule[2].date.getMonth()).toBe(2); // Mar
    expect(result.schedule[2].date.getDate()).toBe(31);
  });
});
