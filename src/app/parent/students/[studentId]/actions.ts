"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";

export async function requestPrivateTuitionAction(studentId: string): Promise<void> {
  const session = await getMicrositeSession();
  if (!session || session.type !== "guardian") return;

  const link = await prisma.studentPayerLink.findFirst({ where: { studentId, payerId: session.payerId } });
  if (!link) return;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || !student.schoolId) return;

  const existingPending = await prisma.privateTuitionRequest.findFirst({
    where: { studentId, status: "PENDING" },
  });
  if (existingPending) return;

  await prisma.privateTuitionRequest.create({
    data: {
      studentId,
      teacherId: student.teacherId,
      sourceSchoolId: student.schoolId,
    },
  });

  revalidatePath(`/parent/students/${studentId}`);
}
