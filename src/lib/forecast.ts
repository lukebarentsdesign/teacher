import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type DatedAmount = { amount: Prisma.Decimal | number | string; date: Date };

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Buckets dated amounts (e.g. successful Payments) into YYYY-MM totals. */
export function calculateIncomeByMonth(payments: DatedAmount[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const payment of payments) {
    const key = monthKey(payment.date);
    totals.set(key, (totals.get(key) ?? 0) + Number(payment.amount));
  }
  return totals;
}

/** Buckets dated amounts (Expenses) into YYYY-MM totals. */
export function calculateExpensesByMonth(expenses: DatedAmount[]): Map<string, number> {
  return calculateIncomeByMonth(expenses);
}

export type ActiveSubscriptionLike = { annualFee: Prisma.Decimal | number | string };

/**
 * Simple forward income projection from active subscriptions' billing cadence. v1 simplification:
 * every active subscription contributes annualFee/12 per projected month regardless of
 * billingModel, since PER_LESSON/HOURLY/TERMLY subscriptions don't have a knowable future lesson
 * count without a generated timetable for that future period — same spirit as the FLUID-mode
 * round-robin being a defensible interpretation, not the only one, documented in CLAUDE.md.
 */
export function projectForwardIncome(
  activeSubscriptions: ActiveSubscriptionLike[],
  monthsAhead: number,
  from: Date = new Date()
): Map<string, number> {
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => sum + Number(sub.annualFee) / 12, 0);
  const projection = new Map<string, number>();
  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(from.getFullYear(), from.getMonth() + i, 1);
    projection.set(monthKey(date), monthlyTotal);
  }
  return projection;
}

export type MonthlyForecastRow = {
  month: string;
  income: number;
  expenses: number;
  projectedIncome: number | null;
};

export async function getMonthlyForecast(teacherId: string, monthsAhead = 3): Promise<MonthlyForecastRow[]> {
  const [payments, expenses, activeSubscriptions] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "SUCCEEDED", subscription: { student: { teacherId } } },
      select: { amount: true, date: true },
    }),
    prisma.expense.findMany({ where: { teacherId }, select: { amount: true, date: true } }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", student: { teacherId } },
      select: { annualFee: true },
    }),
  ]);

  const income = calculateIncomeByMonth(payments);
  const expenseTotals = calculateExpensesByMonth(expenses);
  const projection = projectForwardIncome(activeSubscriptions, monthsAhead);

  const allMonths = new Set([...income.keys(), ...expenseTotals.keys(), ...projection.keys()]);
  const sortedMonths = [...allMonths].sort();

  return sortedMonths.map((month) => ({
    month,
    income: income.get(month) ?? 0,
    expenses: expenseTotals.get(month) ?? 0,
    projectedIncome: projection.get(month) ?? null,
  }));
}
