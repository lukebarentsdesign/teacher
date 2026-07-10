"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { previewFixedTimetable, previewFluidTimetable, createLessonsFromSchedule } from "@/lib/timetable";
import { availabilityArraySchema } from "@/lib/schedule-json";

const confirmSchema = z.object({
  studentId: z.string().min(1),
  teacherId: z.string().min(1),
  schoolId: z.string().min(1),
  linkId: z.string().min(1),
  slots: z.string().min(1),
});

export async function confirmTimetableAction(formData: FormData): Promise<void> {
  const parsed = confirmSchema.parse({
    studentId: formData.get("studentId"),
    teacherId: formData.get("teacherId"),
    schoolId: formData.get("schoolId"),
    linkId: formData.get("linkId"),
    slots: formData.get("slots"),
  });

  const link = await prisma.teacherSchoolLink.findUniqueOrThrow({
    where: { id: parsed.linkId },
    include: { school: true },
  });

  if (!link.school.termStart || !link.school.termEnd) {
    throw new Error("School has no term dates set");
  }

  const chosenSlots = availabilityArraySchema.parse(JSON.parse(parsed.slots));

  const result =
    link.schedulingMode === "FIXED"
      ? await previewFixedTimetable(parsed.teacherId, link.school.termStart, link.school.termEnd, chosenSlots[0])
      : await previewFluidTimetable(parsed.teacherId, link.school.termStart, link.school.termEnd, chosenSlots);

  await createLessonsFromSchedule({
    studentId: parsed.studentId,
    teacherId: parsed.teacherId,
    schoolId: parsed.schoolId,
    lessons: result.clean,
  });

  redirect(`/dashboard/students/${parsed.studentId}`);
}
