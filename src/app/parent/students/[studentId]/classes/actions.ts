"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";
import { resolveBookingStatus, pickPromotionCandidate } from "@/lib/group-booking";

async function assertGuardianAccess(studentId: string) {
  const session = await getMicrositeSession();
  if (!session || session.type !== "guardian") return null;
  const link = await prisma.studentPayerLink.findFirst({ where: { studentId, payerId: session.payerId } });
  return link ? session : null;
}

const bookSchema = z.object({
  groupClassId: z.string().min(1),
  sessionDate: z.string().min(1),
});

/**
 * Self-service booking, scoped to classes the student is already a standing member of
 * (GroupClassMember) — deliberately not a browse-and-join-any-class catalog, which would be a
 * bigger feature (discovery, capacity shown pre-membership, etc.) than this pass covers.
 */
export async function bookGroupSessionAsGuardianAction(
  studentId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await assertGuardianAccess(studentId);
  if (!session) return "Not authorized";

  const parsed = bookSchema.safeParse({
    groupClassId: formData.get("groupClassId"),
    sessionDate: formData.get("sessionDate"),
  });
  if (!parsed.success) return "Invalid input";

  const membership = await prisma.groupClassMember.findFirst({
    where: { groupClassId: parsed.data.groupClassId, studentId, leftAt: null },
  });
  if (!membership) return "Not a member of that class";

  const groupClass = await prisma.groupClass.findUniqueOrThrow({ where: { id: parsed.data.groupClassId } });
  const sessionDate = new Date(parsed.data.sessionDate);

  const existing = await prisma.groupSessionBooking.findUnique({
    where: { groupClassId_studentId_sessionDate: { groupClassId: parsed.data.groupClassId, studentId, sessionDate } },
  });
  if (existing && existing.status !== "CANCELLED") return "Already booked for that date";

  const confirmedCount = await prisma.groupSessionBooking.count({
    where: { groupClassId: parsed.data.groupClassId, sessionDate, status: "CONFIRMED" },
  });
  const status = resolveBookingStatus(groupClass.capacity, confirmedCount);

  if (existing) {
    await prisma.groupSessionBooking.update({ where: { id: existing.id }, data: { status, bookedAt: new Date() } });
  } else {
    await prisma.groupSessionBooking.create({
      data: { groupClassId: parsed.data.groupClassId, studentId, sessionDate, status },
    });
  }

  revalidatePath(`/parent/students/${studentId}/classes`);
}

export async function cancelGroupSessionAsGuardianAction(studentId: string, bookingId: string): Promise<void> {
  const session = await assertGuardianAccess(studentId);
  if (!session) return;

  const booking = await prisma.groupSessionBooking.findFirst({ where: { id: bookingId, studentId } });
  if (!booking) return;

  await prisma.groupSessionBooking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  if (booking.status === "CONFIRMED") {
    const groupClass = await prisma.groupClass.findUniqueOrThrow({ where: { id: booking.groupClassId } });
    const confirmedCount = await prisma.groupSessionBooking.count({
      where: { groupClassId: booking.groupClassId, sessionDate: booking.sessionDate, status: "CONFIRMED" },
    });
    const waitlisted = await prisma.groupSessionBooking.findMany({
      where: { groupClassId: booking.groupClassId, sessionDate: booking.sessionDate, status: "WAITLISTED" },
      select: { id: true, bookedAt: true },
    });
    const promote = pickPromotionCandidate(groupClass.capacity, confirmedCount, waitlisted);
    if (promote) {
      await prisma.groupSessionBooking.update({ where: { id: promote.id }, data: { status: "CONFIRMED" } });
    }
  }

  revalidatePath(`/parent/students/${studentId}/classes`);
}
