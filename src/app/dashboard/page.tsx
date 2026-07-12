import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { TeacherCalendar } from "./teacher-calendar";

export default async function DashboardHomePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [locationCount, studentCount, activeSubscriptionCount, lessons, groupClasses, teacher] = await Promise.all([
    prisma.teacherLocationLink.count({ where: { teacherId } }),
    prisma.student.count({ where: { teacherId } }),
    prisma.subscription.count({ where: { status: "ACTIVE", student: { teacherId } } }),
    prisma.lesson.findMany({
      where: { teacherId, status: "HELD" },
      include: { student: true, location: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.groupClass.findMany({ where: { teacherId } }),
    prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } }),
  ]);

  const DEFAULT_COLOR = "#171717";
  const lessonEvents = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.student.name,
    start: lesson.scheduledAt.toISOString(),
    end: new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000).toISOString(),
    color: lesson.location.primaryColor ?? teacher.personalBrandColor ?? DEFAULT_COLOR,
  }));

  const groupClassEvents = groupClasses.map((gc) => ({
    id: gc.id,
    title: gc.name,
    daysOfWeek: [gc.dayOfWeek],
    startTime: gc.startTime,
    endTime: gc.endTime,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Overview</h1>
      <p className="mb-6 text-sm text-neutral-500">Your week at a glance.</p>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Teaching locations" value={locationCount} />
        <SummaryCard label="Students" value={studentCount} />
        <SummaryCard label="Active subscriptions" value={activeSubscriptionCount} />
      </div>
      <TeacherCalendar lessonEvents={lessonEvents} groupClassEvents={groupClassEvents} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}
