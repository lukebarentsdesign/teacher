import { prisma } from "@/lib/db";
import { sendEmailAsTeacher } from "@/lib/gmail";

export type CheckInLike = {
  checkedOutAt: Date | null;
  expectedEndAt: Date;
  graceMinutes: number;
  alertSentAt: Date | null;
};

/** Overdue = checked in but not out, past expectedEndAt + grace, and no alert sent yet. */
export function isOverdue(checkIn: CheckInLike, now: Date): boolean {
  if (checkIn.checkedOutAt) return false;
  if (checkIn.alertSentAt) return false;
  const deadline = new Date(checkIn.expectedEndAt.getTime() + checkIn.graceMinutes * 60_000);
  return now >= deadline;
}

/**
 * Lazy, request-triggered sweep — there's no cron/background-job infra in this app, so this runs
 * whenever a teacher has a page open that calls it (GET /api/today), not on a real timer. A
 * best-effort safety net, not a guaranteed real-time alert; documented as such rather than
 * pretending this is a proper scheduled job.
 */
export async function checkAndSendLoneWorkerAlerts(teacherId: string, now = new Date()): Promise<number> {
  const pending = await prisma.loneWorkerCheckIn.findMany({
    where: { checkedOutAt: null, alertSentAt: null, lesson: { teacherId } },
    include: { lesson: { include: { student: true, location: true } } },
  });

  const overdue = pending.filter((c) => isOverdue(c, now));
  if (overdue.length === 0) return 0;

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  let alertsSent = 0;

  for (const checkIn of overdue) {
    if (teacher.gmailConnected && teacher.emergencyContactEmail) {
      try {
        await sendEmailAsTeacher(
          teacherId,
          teacher.emergencyContactEmail,
          `Overdue check-out: ${teacher.name}`,
          `${teacher.name} hasn't checked out of a home visit to ${checkIn.lesson.student.name} at ${checkIn.lesson.location.name}, expected to finish by ${checkIn.expectedEndAt.toLocaleString("en-GB")}. This is an automated safety alert — please check in with them.`
        );
      } catch {
        // Best-effort — still mark alertSentAt below so we don't spam retries every page load.
      }
    }
    await prisma.loneWorkerCheckIn.update({ where: { id: checkIn.id }, data: { alertSentAt: now } });
    alertsSent++;
  }

  return alertsSent;
}
