"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function assertOwnStudent(studentId: string, teacherId: string) {
  return prisma.student.findFirst({ where: { id: studentId, teacherId } });
}

const noteSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export async function addMedicalNoteAction(
  studentId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnStudent(studentId, session.user.id))) return "Student not found";

  const parsed = noteSchema.safeParse({ note: formData.get("note"), severity: formData.get("severity") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.studentMedicalNote.create({ data: { studentId, ...parsed.data } });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function deleteMedicalNoteAction(noteId: string, studentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnStudent(studentId, session.user.id))) return;

  await prisma.studentMedicalNote.deleteMany({ where: { id: noteId, studentId } });
  revalidatePath(`/dashboard/students/${studentId}`);
}
