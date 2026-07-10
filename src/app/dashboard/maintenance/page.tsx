import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ToggleCompletedButton } from "./toggle-completed-button";

export default async function MaintenancePage() {
  const session = await auth();
  const reminders = await prisma.maintenanceReminder.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { dueDate: "asc" },
    include: { loanableItem: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Maintenance reminders</h1>
        <Link
          href="/dashboard/maintenance/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add reminder
        </Link>
      </div>

      {reminders.length === 0 ? (
        <p className="text-sm text-neutral-500">No reminders yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr key={reminder.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">
                    {reminder.itemDescription}
                    {reminder.loanableItem && (
                      <span className="text-neutral-400"> ({reminder.loanableItem.name})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {reminder.dueDate.toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleCompletedButton
                      reminderId={reminder.id}
                      completed={reminder.completed}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
