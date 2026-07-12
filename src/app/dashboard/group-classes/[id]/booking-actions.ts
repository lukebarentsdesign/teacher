"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { resolveBookingStatus, pickPromotionCandidate } from "@/lib/group-booking";

async function assertOwnGroupClass(groupClassId: string, teacherId: string) {
  return prisma.groupClass.findFirst({ where: { id: groupClassId, teacherId } });
}

const bookingSchema = z.object({
  studentId: z.string().min(1, "Pick a student"),
  sessionDate: z.string().min(1, "Pick a date"),
});

export async function bookGroupSessionAction(
  groupClassId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const groupClass = await assertOwnGroupClass(groupClassId, session.user.id);
  if (!groupClass) return "Group class not found";

  const parsed = bookingSchema.safeParse({
    studentId: formData.get("studentId"),
    sessionDate: formData.get("sessionDate"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const student = await prisma.student.findFirst({ where: { id: parsed.data.studentId, teacherId: session.user.id } });
  if (!student) return "Student not found";

  const sessionDate = new Date(parsed.data.sessionDate);

  const existing = await prisma.groupSessionBooking.findUnique({
    where: { groupClassId_studentId_sessionDate: { groupClassId, studentId: parsed.data.studentId, sessionDate } },
  });
  if (existing && existing.status !== "CANCELLED") return "Already booked for that date";

  const confirmedCount = await prisma.groupSessionBooking.count({
    where: { groupClassId, sessionDate, status: "CONFIRMED" },
  });
  const status = resolveBookingStatus(groupClass.capacity, confirmedCount);

  if (existing) {
    await prisma.groupSessionBooking.update({ where: { id: existing.id }, data: { status, bookedAt: new Date() } });
  } else {
    await prisma.groupSessionBooking.create({
      data: { groupClassId, studentId: parsed.data.studentId, sessionDate, status },
    });
  }

  revalidatePath(`/dashboard/group-classes/${groupClassId}`);
}

export async function cancelGroupSessionBookingAction(bookingId: string, groupClassId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const groupClass = await assertOwnGroupClass(groupClassId, session.user.id);
  if (!groupClass) return;

  const booking = await prisma.groupSessionBooking.findFirst({ where: { id: bookingId, groupClassId } });
  if (!booking) return;

  await prisma.groupSessionBooking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  if (booking.status === "CONFIRMED") {
    const confirmedCount = await prisma.groupSessionBooking.count({
      where: { groupClassId, sessionDate: booking.sessionDate, status: "CONFIRMED" },
    });
    const waitlisted = await prisma.groupSessionBooking.findMany({
      where: { groupClassId, sessionDate: booking.sessionDate, status: "WAITLISTED" },
      select: { id: true, bookedAt: true },
    });
    const promote = pickPromotionCandidate(groupClass.capacity, confirmedCount, waitlisted);
    if (promote) {
      await prisma.groupSessionBooking.update({ where: { id: promote.id }, data: { status: "CONFIRMED" } });
    }
  }

  revalidatePath(`/dashboard/group-classes/${groupClassId}`);
}
