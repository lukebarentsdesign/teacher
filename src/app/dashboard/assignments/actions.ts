"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const assignmentSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().trim().min(1, "Instructions are required"),
  target: z.string().trim().min(1, "Target is required"),
  assignedDate: z.string().min(1, "Assigned date is required"),
  reviewDate: z.string().min(1, "Review date is required"),
  resourceId: z.string().optional(),
});

export async function createAssignmentAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = assignmentSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    target: formData.get("target"),
    assignedDate: formData.get("assignedDate"),
    reviewDate: formData.get("reviewDate"),
    resourceId: formData.get("resourceId") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const student = await prisma.student.findFirst({
    where: { id: parsed.data.studentId, teacherId: session.user.id },
  });
  if (!student) return "Student not found";

  const { assignedDate, reviewDate, ...rest } = parsed.data;

  await prisma.assignment.create({
    data: {
      ...rest,
      teacherId: session.user.id,
      assignedDate: new Date(assignedDate),
      reviewDate: new Date(reviewDate),
    },
  });

  revalidatePath("/dashboard/assignments");
  redirect("/dashboard/assignments");
}

export async function setAssignmentStatusAction(
  assignmentId: string,
  status: "REVIEWED_DONE" | "REVIEWED_NOT_DONE"
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.assignment.updateMany({
    where: { id: assignmentId, teacherId: session.user.id },
    data: { status },
  });

  revalidatePath("/dashboard/assignments");
}
