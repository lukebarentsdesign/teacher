import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewReminderForm } from "./new-reminder-form";
import { hasModule } from "@/lib/modules";

export default async function NewMaintenanceReminderPage() {
  const session = await auth();

  if (!(await hasModule(session!.user.id, "GROUP_TEACHING"))) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Add maintenance reminder</h1>
        <p className="text-sm text-neutral-500">
          The Group teaching module isn&apos;t enabled on this account — get in touch if
          you&apos;d like it switched on.
        </p>
      </div>
    );
  }

  const loanableItems = await prisma.loanableItem.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add maintenance reminder</h1>
      <NewReminderForm loanableItems={loanableItems} />
    </div>
  );
}
