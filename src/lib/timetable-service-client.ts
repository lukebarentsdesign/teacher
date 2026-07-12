import type { ScheduledLesson, TimeSlot } from "@/lib/scheduling";
import { getSundayOfWeek, slotDurationMins } from "@/lib/scheduling";

/**
 * Optional client for the OR-Tools CP-SAT microservice (timetable-service/). Returns null on any
 * failure (unset TIMETABLE_SERVICE_URL, network error, non-2xx, non-OPTIMAL/FEASIBLE status) so
 * the caller can fall back to the pure-TS round-robin in scheduling.ts — this service is an
 * optimization upgrade, never a hard dependency, since it isn't deployed anywhere yet (see its
 * README's "needs a decision before this can be tested end-to-end").
 */

type SolveOneStudentArgs = {
  teacherId: string;
  weekStarts: Date[]; // one entry per term-week, Sunday-anchored — index becomes the request's week_index
  candidateSlots: TimeSlot[];
  roomId?: string;
  timeoutMs?: number;
};

function applyTimeToDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export async function solveFluidScheduleViaService({
  teacherId,
  weekStarts,
  candidateSlots,
  roomId,
  timeoutMs = 10_000,
}: SolveOneStudentArgs): Promise<ScheduledLesson[] | null> {
  const baseUrl = process.env.TIMETABLE_SERVICE_URL;
  if (!baseUrl || candidateSlots.length === 0 || weekStarts.length === 0) return null;

  const durationMins = slotDurationMins(candidateSlots[0]);

  const body = {
    teacher_id: teacherId,
    term_weeks: weekStarts.length,
    students: [
      {
        id: "preview-student",
        name: "Preview",
        scheduling_mode: "FLUID",
        lesson_duration_mins: durationMins,
        candidate_slots: candidateSlots.map((s) => ({
          day_of_week: s.dayOfWeek,
          start_time: s.startTime,
          end_time: s.endTime,
        })),
        room_id: roomId ?? null,
      },
    ],
  };

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/generate-timetable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    return null; // network error, timeout, service down
  }

  if (!response.ok) return null;

  let result: {
    status: string;
    lessons: { student_id: string; week_index: number; day_of_week: number; start_time: string; end_time: string }[];
  };
  try {
    result = await response.json();
  } catch {
    return null;
  }

  if (result.status !== "OPTIMAL" && result.status !== "FEASIBLE") return null;

  return result.lessons.map((l): ScheduledLesson => {
    const weekStart = getSundayOfWeek(weekStarts[l.week_index]);
    const date = new Date(weekStart);
    date.setDate(date.getDate() + l.day_of_week);
    const slot: TimeSlot = { dayOfWeek: l.day_of_week, startTime: l.start_time, endTime: l.end_time };
    return {
      scheduledAt: applyTimeToDate(date, l.start_time),
      durationMins: slotDurationMins(slot),
      slot,
    };
  });
}
