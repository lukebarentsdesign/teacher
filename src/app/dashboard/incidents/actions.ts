"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const incidentSchema = z.object({
  studentId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  description: z.string().trim().min(1, "Description is required"),
  actionTaken: z.string().trim().optional(),
  reportedToWhom: z.string().trim().optional(),
});

export async function createIncidentLogAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  // DELIBERATELY UNGATED: safety/safeguarding records are never locked behind a paywall,
  // regardless of module entitlement. Do not add a hasModule() check here.

  const studentIdRaw = (formData.get("studentId") as string) || undefined;

  const parsed = incidentSchema.safeParse({
    studentId: studentIdRaw,
    date: formData.get("date"),
    description: formData.get("description"),
    actionTaken: formData.get("actionTaken") || undefined,
    reportedToWhom: formData.get("reportedToWhom") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  if (parsed.data.studentId) {
    const student = await prisma.student.findFirst({ where: { id: parsed.data.studentId, teacherId: session.user.id } });
    if (!student) return "Student not found";
  }

  await prisma.incidentLog.create({
    data: {
      teacherId: session.user.id,
      studentId: parsed.data.studentId || null,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      actionTaken: parsed.data.actionTaken || null,
      reportedToWhom: parsed.data.reportedToWhom || null,
    },
  });

  revalidatePath("/dashboard/incidents");
  if (parsed.data.studentId) revalidatePath(`/dashboard/students/${parsed.data.studentId}`);
}

export async function deleteIncidentLogAction(incidentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.incidentLog.deleteMany({ where: { id: incidentId, teacherId: session.user.id } });
  revalidatePath("/dashboard/incidents");
}
