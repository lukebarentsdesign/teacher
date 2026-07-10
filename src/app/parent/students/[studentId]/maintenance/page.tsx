import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

export default async function StudentMaintenancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const activeLoans = await prisma.loan.findMany({
    where: { studentId, returnedDate: null },
    select: { itemId: true },
  });
  const onLoanItemIds = activeLoans.map((loan) => loan.itemId);

  const reminders =
    onLoanItemIds.length === 0
      ? []
      : await prisma.maintenanceReminder.findMany({
          where: { loanableItemId: { in: onLoanItemIds } },
          orderBy: { dueDate: "asc" },
          include: { loanableItem: true },
        });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Maintenance reminders</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Upkeep reminders for any equipment currently on loan to {" "}
        {context.viewerType === "student" ? "you" : "your child"}.
      </p>
      {reminders.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing due right now.</p>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-medium text-neutral-900">
                {reminder.itemDescription}
                {reminder.loanableItem && (
                  <span className="text-neutral-400"> ({reminder.loanableItem.name})</span>
                )}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Due {reminder.dueDate.toLocaleDateString("en-GB")} ·{" "}
                {reminder.completed ? "Done" : "Not done yet"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
