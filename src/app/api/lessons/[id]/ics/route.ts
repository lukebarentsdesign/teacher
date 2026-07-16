import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getMicrositeSession } from "@/lib/microsite-session";
import { generateLessonIcs } from "@/lib/ics";

/**
 * Available to either the owning teacher or a guardian/student with microsite access to the
 * lesson's student — the same lesson may be added to a calendar from either side.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { student: true, location: true },
  });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teacherSession = await auth();
  const isOwningTeacher = teacherSession?.user?.id === lesson.teacherId;

  let hasMicrositeAccess = false;
  if (!isOwningTeacher) {
    const micrositeSession = await getMicrositeSession();
    if (micrositeSession?.type === "student") {
      hasMicrositeAccess = micrositeSession.studentId === lesson.studentId;
    } else if (micrositeSession?.type === "guardian") {
      const link = await prisma.studentPayerLink.findFirst({
        where: { studentId: lesson.studentId, payerId: micrositeSession.payerId },
      });
      hasMicrositeAccess = !!link;
    }
  }

  if (!isOwningTeacher && !hasMicrositeAccess) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const end = new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000);
  const description = [
    `Lesson at ${lesson.location.name}`,
    lesson.meetingUrl ? `Join: ${lesson.meetingUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const ics = generateLessonIcs({
    uid: `lesson-${lesson.id}@learnio`,
    title: "Lesson",
    description,
    start: lesson.scheduledAt,
    end,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="lesson-${lesson.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
