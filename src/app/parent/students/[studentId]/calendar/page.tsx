import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { StudentCalendar } from "./student-calendar";

export default async function StudentCalendarPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const lessons = await prisma.lesson.findMany({
    where: { studentId },
    orderBy: { scheduledAt: "asc" },
  });

  const events = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.status === "HELD" ? "Lesson" : lesson.status.replace(/_/g, " "),
    start: lesson.scheduledAt.toISOString(),
    end: new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000).toISOString(),
    color: lesson.status === "HELD" ? "#171717" : "#a3a3a3",
  }));

  const upcomingOnline = lessons.filter(
    (l) => l.meetingUrl && l.status === "HELD" && l.scheduledAt.getTime() >= Date.now()
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Calendar</h1>

      {upcomingOnline.length > 0 && (
        <div className="mb-4 space-y-2">
          {upcomingOnline.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-neutral-900">Online lesson</p>
                <p className="text-xs text-neutral-500">
                  {lesson.scheduledAt.toLocaleDateString("en-GB")}{" "}
                  {lesson.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={lesson.meetingUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
                >
                  Join
                </a>
                <a
                  href={`/api/lessons/${lesson.id}/ics`}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
                >
                  Add to calendar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <StudentCalendar events={events} />
      </div>
    </div>
  );
}
