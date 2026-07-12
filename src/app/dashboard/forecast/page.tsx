import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getMonthlyForecast } from "@/lib/forecast";
import { IncomeChart } from "./income-chart";
import { NewExpenseForm } from "./new-expense-form";

export default async function ForecastPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [rows, recentExpenses, venueFeeArrangements] = await Promise.all([
    getMonthlyForecast(teacherId),
    prisma.expense.findMany({ where: { teacherId }, orderBy: { date: "desc" }, take: 20 }),
    prisma.venueFeeArrangement.findMany({
      where: { location: { teacherLinks: { some: { teacherId } } } },
      include: { location: true },
      orderBy: { location: { name: "asc" } },
    }),
  ]);

  const FEE_TYPE_LABEL: Record<string, string> = {
    FLAT_PER_SESSION: "per session",
    PERCENT_OF_LESSON_FEE: "% of lesson fee",
    PERIOD_RENTAL: "per rental period",
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Income forecast</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Monthly income vs. expenses, with a simple forward projection from active subscriptions.
        </p>
      </div>

      <IncomeChart rows={rows} />

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Expenses</h2>
        <div className="mb-4 space-y-3">
          <NewExpenseForm />
        </div>
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-neutral-500">No expenses logged yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">
                      {expense.date.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{expense.category}</td>
                    <td className="px-4 py-3 text-neutral-500">£{expense.amount.toString()}</td>
                    <td className="px-4 py-3 text-neutral-500">{expense.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {venueFeeArrangements.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Recurring venue costs</h2>
          <p className="mb-3 text-xs text-neutral-500">
            What you pay to use each venue — a projection, not logged expense events. Manage these
            from each teaching location&apos;s detail page.
          </p>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Billing</th>
                </tr>
              </thead>
              <tbody>
                {venueFeeArrangements.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">{a.location.name}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      £{a.amount.toString()} {FEE_TYPE_LABEL[a.feeType]}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {a.billingMode === "ITEMISED_TO_PAYER" ? "Itemised to payer" : "Absorbed into pricing"}
                    </td>
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
