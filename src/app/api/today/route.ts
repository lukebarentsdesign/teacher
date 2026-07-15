import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { checkAndSendLoneWorkerAlerts } from "@/lib/lone-worker";

export type TodayLesson = {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  studentName: string;
  discipline: string;
  locationName: string;
  roomLabel: string | null;
  payers: { name: string; phone: string | null; email: string | null }[];
  lastNote: string | null;
  resources: { id: string; title: string; url: string; type: string; sourceLabel: string | null; folder: string | null; tags: string | null; thumbnailUrl: string | null }[];
};

export type TodayNotification = {
  id: string;
  type: "INVITE" | "ALERT" | "NOTICE";
  title: string;
  description: string;
  time: string;
  actionable: boolean;
};

export type TodayResponse = {
  lessons: TodayLesson[];
  generatedAt: string;
  teacher: {
    name: string;
    email: string;
    phone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactEmail: string | null;
  };
  notifications: TodayNotification[];
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const teacherId = session.user.id;

  try {
    await checkAndSendLoneWorkerAlerts(teacherId);
  } catch {
    // Non-fatal
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2); // through end of tomorrow

  const [lessons, teacher, privateRequests, waitlistedBookings, coverAssignments] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        teacherId,
        status: "HELD",
        scheduledAt: { gte: start, lt: end },
      },
      include: {
        student: {
          include: { payerLinks: { include: { payer: true } } },
        },
        location: true,
        room: true,
        note: true,
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.teacher.findUniqueOrThrow({
      where: { id: teacherId }
    }),
    prisma.privateTuitionRequest.findMany({
      where: { teacherId, status: "PENDING" },
      include: { student: true, sourceLocation: true }
    }),
    prisma.groupSessionBooking.findMany({
      where: { status: "WAITLISTED", groupClass: { teacherId } },
      include: { student: true, groupClass: true }
    }),
    prisma.coverAssignment.findMany({
      where: { coveringInstructorId: teacherId },
      include: { originalInstructor: true, lesson: { include: { student: true } } }
    })
  ]);

  // Fetch resources for all students/lessons involved in today's dataset
  const studentIds = lessons.map(l => l.studentId);
  const lessonIds = lessons.map(l => l.id);

  const allResources = await prisma.resource.findMany({
    where: {
      OR: [
        { studentId: { in: studentIds } },
        { lessonId: { in: lessonIds } },
      ]
    }
  });

  const teacherPayload = {
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    emergencyContactName: teacher.emergencyContactName,
    emergencyContactPhone: teacher.emergencyContactPhone,
    emergencyContactEmail: teacher.emergencyContactEmail,
  };

  const notifications: TodayNotification[] = [];

  // 1. Private Tuition Requests (INVITE)
  privateRequests.forEach((req) => {
    notifications.push({
      id: req.id,
      type: "INVITE",
      title: "Tuition Request",
      description: `${req.student.name} requested to start private lessons from ${req.sourceLocation.name}`,
      time: req.requestedAt.toISOString(),
      actionable: true,
    });
  });

  // 2. Waitlist Bookings (ALERT)
  waitlistedBookings.forEach((bk) => {
    notifications.push({
      id: bk.id,
      type: "ALERT",
      title: "Waitlist Alert",
      description: `${bk.student.name} is waitlisted for class ${bk.groupClass.name}`,
      time: bk.bookedAt.toISOString(),
      actionable: false,
    });
  });

  // 3. Cover Assignments (NOTICE)
  coverAssignments.forEach((cv) => {
    notifications.push({
      id: cv.id,
      type: "NOTICE",
      title: "Cover Assignment",
      description: `Assigned to cover ${cv.originalInstructor.name}'s lesson for ${cv.lesson?.student.name ?? "Class"}`,
      time: cv.createdAt.toISOString(),
      actionable: false,
    });
  });

  // Fallback mock logs if no DB alerts are present
  if (notifications.length === 0) {
    notifications.push({
      id: "mock-1",
      type: "NOTICE",
      title: "Read Receipt",
      description: "Archi Snow read your lesson posts",
      time: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      actionable: false,
    });
    notifications.push({
      id: "mock-2",
      type: "INVITE",
      title: "Class Invitation",
      description: "Archi Snow created a new lesson with you 12.07.2024",
      time: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      actionable: true,
    });
    notifications.push({
      id: "mock-3",
      type: "NOTICE",
      title: "Read Receipt",
      description: "Livia Homut read your lesson posts",
      time: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
      actionable: false,
    });
    notifications.push({
      id: "mock-4",
      type: "ALERT",
      title: "System Update",
      description: "Archi Snow added new terms of use",
      time: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      actionable: false,
    });
  }

  const payload: TodayResponse = {
    generatedAt: new Date().toISOString(),
    teacher: teacherPayload,
    notifications,
    lessons: lessons.map((lesson) => {
      const lessonResources = allResources.filter(r => r.studentId === lesson.studentId || r.lessonId === lesson.id);
      return {
        id: lesson.id,
        scheduledAt: lesson.scheduledAt.toISOString(),
        durationMins: lesson.durationMins,
        status: lesson.status,
        studentName: lesson.student.name,
        discipline: lesson.student.discipline,
        locationName: lesson.location.name,
        roomLabel: lesson.room?.label ?? null,
        payers: lesson.student.payerLinks.map((link) => ({
          name: link.payer.name,
          phone: link.payer.phone,
          email: link.payer.email,
        })),
        lastNote: lesson.note?.content ?? null,
        resources: lessonResources.map(r => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
          sourceLabel: r.sourceLabel,
          folder: r.folder,
          tags: r.tags,
          thumbnailUrl: r.thumbnailUrl
        })),
      };
    }),
  };

  return NextResponse.json(payload);
}
