export type BillingScheduleItem = {
  date: Date;
  amount: number;
  isLast: boolean;
};

export type BillingCalculationResult = {
  annualTotal: number;
  monthlyAmount: number;
  months: number;
  schedule: BillingScheduleItem[];
};

/**
 * Pure calculation function for monthly subscription plans:
 * count * price = annual total
 * annual total / months = monthly amount (with final month penny reconciliation)
 */
export function calculateSubscriptionSchedule(
  lessonCount: number,
  lessonPrice: number,
  months: number = 12,
  startDate: Date
): BillingCalculationResult {
  const annualTotal = Number((lessonCount * lessonPrice).toFixed(2));
  
  if (months <= 0) {
    throw new Error("Months must be greater than 0");
  }

  // Calculate monthly amount base (rounding down to two decimal places to avoid overcharging)
  const monthlyAmountBase = Math.floor((annualTotal / months) * 100) / 100;
  const totalOfMonths = Number((monthlyAmountBase * (months - 1)).toFixed(2));
  
  // Reconcile rounding error on the last month so the sum matches the annual total exactly
  const lastMonthAmount = Number((annualTotal - totalOfMonths).toFixed(2));

  const schedule: BillingScheduleItem[] = [];
  
  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    
    // JS Date edge cases (e.g. Jan 31 + 1 month -> Mar 3 instead of Feb 28)
    const expectedMonth = (startDate.getMonth() + i) % 12;
    if (date.getMonth() !== expectedMonth) {
      date.setDate(0); // Sets date to last day of the intended month
    }

    const isLast = i === months - 1;
    schedule.push({
      date,
      amount: isLast ? lastMonthAmount : monthlyAmountBase,
      isLast,
    });
  }

  return {
    annualTotal,
    monthlyAmount: monthlyAmountBase,
    months,
    schedule,
  };
}
