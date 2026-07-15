import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { TeacherCalendar } from "./teacher-calendar";
import { DashboardCards } from "./dashboard-cards";
import { MiniCalendar } from "@/components/ui/mini-calendar";
import { NextClassCard, type NextClassData } from "@/components/ui/next-class-card";

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const teacherId = session!.user.id;

  const params = await searchParams;
  const selectedDateStr = params?.date;
  
  // Use a fallback date and keep it consistently aligned
  let selectedDate = new Date();
  if (selectedDateStr) {
    const parsed = new Date(selectedDateStr);
    if (!isNaN(parsed.getTime())) {
      selectedDate = parsed;
    }
  }

  // Next lesson search
  const nextLessonRaw = await prisma.lesson.findFirst({
    where: {
      teacherId,
      scheduledAt: { gte: new Date() },
      status: "HELD"
    },
    include: {
      student: true,
      location: true,
      room: true,
    },
    orderBy: {
      scheduledAt: "asc"
    }
  });

  let nextLessonAssignment = null;
  if (nextLessonRaw) {
    const assignment = await prisma.assignment.findFirst({
      where: { studentId: nextLessonRaw.studentId, status: "ASSIGNED" },
      orderBy: { createdAt: "desc" }
    });
    if (assignment) {
      nextLessonAssignment = assignment.title;
    }
  }

  const nextLesson: NextClassData | null = nextLessonRaw ? {
    id: nextLessonRaw.id,
    studentName: nextLessonRaw.student.name,
    discipline: nextLessonRaw.student.discipline || "Music Lesson",
    scheduledAt: nextLessonRaw.scheduledAt,
    durationMins: nextLessonRaw.durationMins,
    locationName: nextLessonRaw.location.name,
    roomName: nextLessonRaw.room?.label ?? null,
    grade: nextLessonRaw.student.dob 
      ? `${Math.floor((new Date().getTime() - nextLessonRaw.student.dob.getTime()) / (365.25 * 24 * 3600 * 1000))}yo` 
      : "1:1",
    assignmentTitle: nextLessonAssignment,
    homeworkStatus: "Practice Lesson Note guidance"
  } : null;

  const [locationCount, studentCount, activeSubscriptionCount, lessons, , teacher] = await Promise.all([
    prisma.teacherLocationLink.count({ where: { teacherId } }),
    prisma.student.count({ where: { teacherId } }),
    prisma.subscription.count({ where: { status: "ACTIVE", student: { teacherId } } }),
    prisma.lesson.findMany({
      where: { teacherId, status: "HELD" },
      include: { student: true, location: true, room: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.groupClass.findMany({ where: { teacherId } }),
    prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } }),
  ]);

  const studentIds = Array.from(new Set(lessons.map(l => l.studentId)));
  const attendanceRaw = await prisma.lesson.groupBy({
    by: ["studentId", "status", "noShowConfirmed"],
    where: { studentId: { in: studentIds } },
    _count: { _all: true }
  });

  // Map studentId -> { present: number, absent: number }
  const attendanceMap: Record<string, { present: number; absent: number }> = {};
  studentIds.forEach(id => {
    attendanceMap[id] = { present: 0, absent: 0 };
  });

  attendanceRaw.forEach(row => {
    const sId = row.studentId;
    const count = row._count._all;
    if (row.status === "HELD") {
      if (row.noShowConfirmed) {
        attendanceMap[sId].absent += count;
      } else {
        attendanceMap[sId].present += count;
      }
    } else if (row.status.startsWith("CANCELLED")) {
      attendanceMap[sId].absent += count;
    }
  });

  const DEFAULT_COLOR = "#4f46e5";
  const lessonEvents = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.student.name,
    discipline: lesson.student.discipline,
    start: lesson.scheduledAt.toISOString(),
    end: new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000).toISOString(),
    color: lesson.location.primaryColor ?? teacher.personalBrandColor ?? DEFAULT_COLOR,
    locationName: lesson.location.name,
    roomName: lesson.room?.label ?? null,
    durationMins: lesson.durationMins,
    studentId: lesson.studentId,
    noShowConfirmed: lesson.noShowConfirmed,
    status: lesson.status,
    presentCount: attendanceMap[lesson.studentId]?.present ?? 0,
    absentCount: attendanceMap[lesson.studentId]?.absent ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column (Main Content) */}
      <div className="lg:col-span-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Overview</h1>
          <p className="text-sm text-neutral-500 mt-1">Your week at a glance.</p>
        </div>
        
        <DashboardCards teacherId={teacherId} />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="Teaching locations" value={locationCount} />
          <SummaryCard label="Students" value={studentCount} />
          <SummaryCard label="Active subscriptions" value={activeSubscriptionCount} />
        </div>
        
        <TeacherCalendar 
          selectedDateStr={selectedDate.toISOString()}
          lessonEvents={lessonEvents} 
        />
      </div>

      {/* Right Column (Widgets) */}
      <div className="lg:col-span-4 space-y-6">
        <MiniCalendar selectedDateStr={selectedDate.toISOString()} />
        <NextClassCard lesson={nextLesson} />
      </div>
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
