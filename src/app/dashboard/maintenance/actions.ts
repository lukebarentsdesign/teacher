"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

const reminderSchema = z.object({
  itemDescription: z.string().trim().min(1, "Describe the item"),
  dueDate: z.string().min(1, "Due date is required"),
  loanableItemId: z.string().optional(),
});

export async function createMaintenanceReminderAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "GROUP_TEACHING"))) {
    return "The Group teaching module isn't enabled on this account";
  }

  const parsed = reminderSchema.safeParse({
    itemDescription: formData.get("itemDescription"),
    dueDate: formData.get("dueDate"),
    loanableItemId: formData.get("loanableItemId") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { dueDate, ...rest } = parsed.data;

  await prisma.maintenanceReminder.create({
    data: {
      ...rest,
      teacherId: session.user.id,
      dueDate: new Date(dueDate),
    },
  });

  revalidatePath("/dashboard/maintenance");
  redirect("/dashboard/maintenance");
}

export async function toggleReminderCompletedAction(
  reminderId: string,
  completed: boolean
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.maintenanceReminder.updateMany({
    where: { id: reminderId, teacherId: session.user.id },
    data: { completed },
  });

  revalidatePath("/dashboard/maintenance");
}
