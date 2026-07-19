"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { loanableItemSchema, checkOutLoanSchema } from "@/lib/validations";
import { hasModule } from "@/lib/modules";

export async function createLoanableItemAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "GROUP_TEACHING"))) {
    return "The Group teaching module isn't enabled on this account";
  }

  const parsed = loanableItemSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    condition: formData.get("condition") || undefined,
    value: formData.get("value") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.loanableItem.create({
    data: { ...parsed.data, teacherId: session.user.id },
  });

  revalidatePath("/dashboard/loans");
  redirect("/dashboard/loans");
}

export async function updateLoanableItemAction(
  itemId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const item = await prisma.loanableItem.findFirst({ where: { id: itemId, teacherId: session.user.id } });
  if (!item) return "Item not found";

  const parsed = loanableItemSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    condition: formData.get("condition") || undefined,
    value: formData.get("value") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.loanableItem.update({ where: { id: itemId }, data: parsed.data });

  revalidatePath("/dashboard/loans");
  redirect("/dashboard/loans");
}

export async function checkOutLoanAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = checkOutLoanSchema.safeParse({
    itemId: formData.get("itemId"),
    studentId: formData.get("studentId"),
    dueBackDate: formData.get("dueBackDate"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const [item, student] = await Promise.all([
    prisma.loanableItem.findFirst({ where: { id: parsed.data.itemId, teacherId: session.user.id } }),
    prisma.student.findFirst({ where: { id: parsed.data.studentId, teacherId: session.user.id } }),
  ]);
  if (!item || !student) return "Item or student not found";

  const alreadyOut = await prisma.loan.findFirst({
    where: { itemId: parsed.data.itemId, returnedDate: null },
  });
  if (alreadyOut) return "This item is already out on loan.";

  await prisma.loan.create({
    data: {
      itemId: parsed.data.itemId,
      studentId: parsed.data.studentId,
      dueBackDate: new Date(parsed.data.dueBackDate),
    },
  });

  revalidatePath("/dashboard/loans");
}

export async function returnLoanAction(loanId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const loan = await prisma.loan.findFirst({
    where: { id: loanId, item: { teacherId: session.user.id } },
  });
  if (!loan) return;

  await prisma.loan.update({ where: { id: loanId }, data: { returnedDate: new Date() } });

  revalidatePath("/dashboard/loans");
}
