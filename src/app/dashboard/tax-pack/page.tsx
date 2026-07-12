import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taxYearRange, taxYearForDate, calculateMileageAllowance } from "@/lib/mileage";

export default async function TaxPackPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const session = await auth();

  const currentTaxYear = taxYearForDate(new Date());
  const selectedYear = year ? Number(year) : currentTaxYear;
  const { start, end } = taxYearRange(selectedYear);

  const [payments, expenses, mileageLogs] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: {
        reason: "PAYMENT",
        date: { gte: start, lte: end },
        subscription: { student: { teacherId: session!.user.id } },
      },
    }),
    prisma.expense.findMany({
      where: { teacherId: session!.user.id, date: { gte: start, lte: end } },
    }),
    prisma.mileageLog.findMany({
      where: { teacherId: session!.user.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const { totalMiles, totalAllowance } = calculateMileageAllowance(mileageLogs.map((m) => Number(m.miles)));
  const netProfit = totalIncome - totalExpenses - totalAllowance;

  const expensesByCategory = new Map<string, number>();
  for (const e of expenses) {
    expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + Number(e.amount));
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentTaxYear - i);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tax pack</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Built from data that already exists — payments received, expenses logged, and mileage.
            Hand this to an accountant or use it for your own self-assessment.
          </p>
        </div>
        <a
          href={`/api/tax-pack?year=${selectedYear}`}
          className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Download CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {yearOptions.map((y) => (
          <Link
            key={y}
            href={`/dashboard/tax-pack?year=${y}`}
            className={`rounded-full px-3 py-1 text-sm ${
              y === selectedYear ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {y}/{(y + 1) % 100}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Income received</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">£{totalIncome.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Expenses</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">£{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Mileage allowance</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">£{totalAllowance.toFixed(2)}</p>
          <p className="text-xs text-neutral-400">{totalMiles.toFixed(1)} miles</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Net</p>
          <p className={`mt-2 text-2xl font-semibold ${netProfit < 0 ? "text-red-600" : "text-neutral-900"}`}>
            £{netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {expensesByCategory.size > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Expenses by category</h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <tbody>
                {[...expensesByCategory.entries()].map(([category, amount]) => (
                  <tr key={category} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">{category}</td>
                    <td className="px-4 py-3 text-right text-neutral-500">£{amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
