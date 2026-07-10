"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { previewFixedTimetable, previewFluidTimetable, createLessonsFromSchedule } from "@/lib/timetable";
import { availabilityArraySchema } from "@/lib/schedule-json";
import { hasAcceptedCurrentContract } from "@/lib/contracts";

const confirmSchema = z.object({
  studentId: z.string().min(1),
  schoolId: z.string().min(1),
  linkId: z.string().min(1),
  slots: z.string().min(1),
});

export async function confirmTimetableAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const teacherId = session.user.id;

  const parsed = confirmSchema.parse({
    studentId: formData.get("studentId"),
    schoolId: formData.get("schoolId"),
    linkId: formData.get("linkId"),
    slots: formData.get("slots"),
  });

  const [student, link] = await Promise.all([
    prisma.student.findFirst({ where: { id: parsed.studentId, teacherId } }),
    prisma.teacherSchoolLink.findFirst({
      where: { id: parsed.linkId, teacherId },
      include: { school: true },
    }),
  ]);

  if (!student || !link) throw new Error("Student or school engagement not found");
  if (!link.school.termStart || !link.school.termEnd) {
    throw new Error("School has no term dates set");
  }

  // Defense in depth — the preview page already disables the submit button for this case.
  const activeSubscription = await prisma.subscription.findFirst({
    where: { studentId: parsed.studentId, status: "ACTIVE" },
  });
  if (activeSubscription && !(await hasAcceptedCurrentContract(activeSubscription.payerId, teacherId))) {
    throw new Error("This payer hasn't accepted the current contract yet");
  }

  const chosenSlots = availabilityArraySchema.parse(JSON.parse(parsed.slots));

  const result =
    link.schedulingMode === "FIXED"
      ? await previewFixedTimetable(teacherId, link.school.termStart, link.school.termEnd, chosenSlots[0])
      : await previewFluidTimetable(teacherId, link.school.termStart, link.school.termEnd, chosenSlots);

  await createLessonsFromSchedule({
    studentId: parsed.studentId,
    teacherId,
    schoolId: parsed.schoolId,
    lessons: result.clean,
  });

  redirect(`/dashboard/students/${parsed.studentId}`);
}
