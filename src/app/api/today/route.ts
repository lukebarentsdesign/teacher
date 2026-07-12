import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

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
};

export type TodayResponse = { lessons: TodayLesson[]; generatedAt: string };

/**
 * View-only "My Day" data for offline caching — deliberately excludes anything ledger/billing
 * related. Window is today through tomorrow (a rolling look-ahead, not just midnight-to-midnight
 * today) so a teacher checking the evening before still sees tomorrow's first lesson.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const teacherId = session.user.id;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2); // through end of tomorrow

  const lessons = await prisma.lesson.findMany({
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
  });

  const payload: TodayResponse = {
    generatedAt: new Date().toISOString(),
    lessons: lessons.map((lesson) => ({
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
    })),
  };

  return NextResponse.json(payload);
}
