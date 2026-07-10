import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewReminderForm } from "./new-reminder-form";

export default async function NewMaintenanceReminderPage() {
  const session = await auth();
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
