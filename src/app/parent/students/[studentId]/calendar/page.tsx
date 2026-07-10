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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Calendar</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <StudentCalendar events={events} />
      </div>
    </div>
  );
}
