"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const addMemberSchema = z.object({
  groupClassId: z.string().min(1),
  studentId: z.string().min(1),
});

export async function addGroupClassMemberAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = addMemberSchema.safeParse({
    groupClassId: formData.get("groupClassId"),
    studentId: formData.get("studentId"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const [groupClass, student] = await Promise.all([
    prisma.groupClass.findFirst({ where: { id: parsed.data.groupClassId, teacherId: session.user.id } }),
    prisma.student.findFirst({ where: { id: parsed.data.studentId, teacherId: session.user.id } }),
  ]);
  if (!groupClass || !student) return "Class or student not found";

  const existing = await prisma.groupClassMember.findFirst({
    where: { groupClassId: parsed.data.groupClassId, studentId: parsed.data.studentId, leftAt: null },
  });
  if (existing) return "Student is already a member of this class";

  await prisma.groupClassMember.create({
    data: { groupClassId: parsed.data.groupClassId, studentId: parsed.data.studentId },
  });

  revalidatePath(`/dashboard/group-classes/${parsed.data.groupClassId}`);
}

export async function removeGroupClassMemberAction(memberId: string, groupClassId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const member = await prisma.groupClassMember.findFirst({
    where: { id: memberId, groupClass: { teacherId: session.user.id } },
  });
  if (!member) return;

  await prisma.groupClassMember.update({ where: { id: memberId }, data: { leftAt: new Date() } });
  revalidatePath(`/dashboard/group-classes/${groupClassId}`);
}
