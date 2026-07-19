"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { previewFixedTimetable, previewFluidTimetable, createLessonsFromSchedule } from "@/lib/timetable";
import { availabilityArraySchema } from "@/lib/schedule-json";
import { hasAcceptedCurrentContract } from "@/lib/contracts";
import { hasModule } from "@/lib/modules";

const confirmSchema = z.object({
  studentId: z.string().min(1),
  locationId: z.string().min(1),
  linkId: z.string().min(1),
  slots: z.string().min(1),
  roomId: z.string().optional(),
});

export async function confirmTimetableAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const teacherId = session.user.id;
  if (!(await hasModule(teacherId, "SCHEDULING"))) {
    throw new Error("The Scheduling & timetable module isn't enabled on this account");
  }

  const parsed = confirmSchema.parse({
    studentId: formData.get("studentId"),
    locationId: formData.get("locationId"),
    linkId: formData.get("linkId"),
    slots: formData.get("slots"),
    roomId: formData.get("roomId") || undefined,
  });

  const [student, link] = await Promise.all([
    prisma.student.findFirst({ where: { id: parsed.studentId, teacherId } }),
    prisma.teacherLocationLink.findFirst({
      where: { id: parsed.linkId, teacherId },
      include: { location: true },
    }),
  ]);

  if (!student || !link) throw new Error("Student or location engagement not found");
  if (!link.location.termStart || !link.location.termEnd) {
    throw new Error("Location has no term dates set");
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
      ? await previewFixedTimetable(
          teacherId,
          link.location.termStart,
          link.location.termEnd,
          chosenSlots[0],
          parsed.roomId
        )
      : await previewFluidTimetable(
          teacherId,
          link.location.termStart,
          link.location.termEnd,
          chosenSlots,
          parsed.roomId
        );

  await createLessonsFromSchedule({
    studentId: parsed.studentId,
    teacherId,
    locationId: parsed.locationId,
    roomId: parsed.roomId,
    lessons: result.clean,
  });

  redirect(`/dashboard/students/${parsed.studentId}`);
}
