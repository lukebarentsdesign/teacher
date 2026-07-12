"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function acceptPrivateTuitionRequestAction(requestId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const request = await prisma.privateTuitionRequest.findFirst({
    where: { id: requestId, teacherId: session.user.id, status: "PENDING" },
    include: { student: true },
  });
  if (!request) throw new Error("Request not found");

  const newStudent = await prisma.student.create({
    data: {
      teacherId: session.user.id,
      name: request.student.name,
      dob: request.student.dob,
      discipline: request.student.discipline,
      source: "HOME",
      locationId: null,
    },
  });

  await prisma.privateTuitionRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED", resultingStudentId: newStudent.id },
  });

  revalidatePath(`/dashboard/students/${request.studentId}`);
  redirect(`/dashboard/students/${newStudent.id}`);
}
