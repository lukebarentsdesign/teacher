"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const subjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export async function createSubjectAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = subjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.subject.findFirst({
    where: { teacherId: session.user.id, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) return `"${parsed.data.name}" already exists.`;

  await prisma.subject.create({ data: { teacherId: session.user.id, name: parsed.data.name } });
  revalidatePath("/dashboard/subjects");
}

export async function deleteSubjectAction(subjectId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, teacherId: session.user.id } });
  if (!subject) return;

  await prisma.subject.delete({ where: { id: subjectId } });
  revalidatePath("/dashboard/subjects");
  revalidatePath("/dashboard/students");
}
