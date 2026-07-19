"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";
import { parseAvailability, parseProtectedBlocks } from "@/lib/schedule-json";
import { filterAvailableSlots } from "@/lib/scheduling";
import { planBulkTimetable, type HolidayRange } from "@/lib/bulk-timetable";

const bulkInputSchema = z.object({
  locationId: z.string().min(1),
  lessonTypeId: z.string().min(1),
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
  termStart: z.string().min(1),
  termEnd: z.string().min(1),
  targetPerStudent: z.coerce.number().int().positive("Lesson count must be at least 1"),
  durationMins: z.coerce.number().int().positive("Duration must be at least 1"),
  minGapMinutes: z.coerce.number().int().min(0),
});

export type BulkPreview = {
  error?: string;
  assignments?: { studentId: string; studentName: string; scheduledAt: string }[];
  unfilled?: { studentName: string; scheduled: number; wanted: number }[];
  totalSlots?: number;
};

/**
 * Resolves all DB inputs and runs the pure planner (src/lib/bulk-timetable.ts). Shared by preview
 * and confirm so the confirm never trusts a client-supplied plan — it recomputes from the same
 * inputs. Returns the plan plus the resolved student objects the caller needs to create lessons.
 */
type ComputeOk = {
  ok: true;
  data: z.infer<typeof bulkInputSchema>;
  plan: ReturnType<typeof planBulkTimetable>;
  students: { id: string; name: string }[];
};
type ComputeResult = { ok: false; error: string } | ComputeOk;

async function computePlan(teacherId: string, payload: unknown): Promise<ComputeResult> {
  const parsed = bulkInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const link = await prisma.teacherLocationLink.findFirst({
    where: { teacherId, locationId: data.locationId },
  });
  if (!link) return { ok: false, error: "No availability set up for that location." };

  const lessonType = await prisma.lessonType.findFirst({
    where: { id: data.lessonTypeId, teacherId },
  });
  if (!lessonType) return { ok: false, error: "Lesson type not found." };

  const students = await prisma.student.findMany({
    where: { id: { in: data.studentIds }, teacherId, status: "ACTIVE", locationId: data.locationId },
    select: { id: true, name: true },
  });
  if (students.length === 0) return { ok: false, error: "No matching active students at that location." };

  const termStart = new Date(data.termStart);
  const termEnd = new Date(data.termEnd);

  const location = await prisma.teachingLocation.findUnique({
    where: { id: data.locationId },
    include: { termCalendar: { include: { holidays: true } } },
  });
  const holidays: HolidayRange[] =
    location?.termCalendar?.holidays.map((h) => ({ startDate: h.startDate, endDate: h.endDate })) ?? [];

  // The teacher can't be two places at once — exclude slots clashing with ANY existing HELD lesson
  // of theirs in the window, not just ones at this location.
  const existingLessons = await prisma.lesson.findMany({
    where: { teacherId, status: "HELD", scheduledAt: { gte: termStart, lte: termEnd } },
    select: { scheduledAt: true, durationMins: true },
  });

  const windows = filterAvailableSlots(
    parseAvailability(link.availability),
    parseProtectedBlocks(link.protectedBlocks)
  );

  const plan = planBulkTimetable({
    termStart,
    termEnd,
    windows,
    durationMins: data.durationMins,
    minGapMinutes: data.minGapMinutes,
    holidays,
    existingLessons,
    studentIds: students.map((s) => s.id),
    targetPerStudent: data.targetPerStudent,
  });

  return { ok: true, data, plan, students };
}

export async function previewBulkTimetableAction(payload: unknown): Promise<BulkPreview> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await computePlan(session.user.id, payload);
  if (!result.ok) return { error: result.error };

  const nameById = new Map(result.students.map((s) => [s.id, s.name]));
  return {
    assignments: result.plan.assignments.map((a) => ({
      studentId: a.studentId,
      studentName: nameById.get(a.studentId) ?? "?",
      scheduledAt: a.scheduledAt.toISOString(),
    })),
    unfilled: result.plan.unfilled.map((u) => ({
      studentName: nameById.get(u.studentId) ?? "?",
      scheduled: u.scheduled,
      wanted: u.wanted,
    })),
    totalSlots: result.plan.totalSlots,
  };
}

export type BulkConfirmResult = { error?: string; created?: number };

export async function confirmBulkTimetableAction(payload: unknown): Promise<BulkConfirmResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!(await hasModule(session.user.id, "SCHEDULING"))) {
    return { error: "The Scheduling & timetable module isn't enabled on this account" };
  }

  const result = await computePlan(session.user.id, payload);
  if (!result.ok) return { error: result.error };

  if (result.plan.assignments.length === 0) return { error: "Nothing to create — no slots could be filled." };

  const created = await prisma.lesson.createMany({
    data: result.plan.assignments.map((a) => ({
      studentId: a.studentId,
      teacherId: session.user.id!,
      locationId: result.data.locationId,
      scheduledAt: a.scheduledAt,
      durationMins: a.durationMins,
    })),
  });

  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard");
  return { created: created.count };
}
