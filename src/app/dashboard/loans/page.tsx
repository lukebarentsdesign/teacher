import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { CheckoutForm } from "./checkout-form";
import { ReturnLoanButton } from "./return-loan-button";

export default async function LoansPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const items = await prisma.loanableItem.findMany({
    where: { teacherId },
    orderBy: { name: "asc" },
  });

  const activeLoans = await prisma.loan.findMany({
    where: { returnedDate: null, item: { teacherId } },
    include: { item: true, student: true },
    orderBy: { dueBackDate: "asc" },
  });

  const outItemIds = new Set(activeLoans.map((loan) => loan.itemId));
  const availableItems = items.filter((item) => !outItemIds.has(item.id));

  const students = await prisma.student.findMany({ where: { teacherId }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Equipment &amp; loans</h1>
        <Link
          href="/dashboard/loans/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add equipment
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Active loans</h2>
        {activeLoans.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No equipment currently out on loan.</p>
        ) : (
          <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Due back</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">{loan.item.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{loan.student.name}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {loan.dueBackDate.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ReturnLoanButton loanId={loan.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <CheckoutForm availableItems={availableItems} students={students} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Equipment</h2>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">No equipment yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">{item.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{item.type}</td>
                    <td className="px-4 py-3 text-neutral-500">{item.condition ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {outItemIds.has(item.id) ? "On loan" : "Available"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/loans/${item.id}/edit`}
                        className="text-xs text-neutral-500 underline hover:text-neutral-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
