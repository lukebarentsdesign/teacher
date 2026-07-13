import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isWithinTaxSeasonWindow } from "@/lib/nav";
import { DashboardChrome } from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  const teacher = teacherId ? await prisma.teacher.findUnique({ where: { id: teacherId } }) : null;

  const earnedPhase3Keys: string[] = [];

  if (teacherId) {
    // Curriculum templates: a teacher has logged 3+ lessons with the same student.
    const lessonGroups = await prisma.lesson.groupBy({
      by: ["studentId"],
      where: { teacherId, status: "HELD" },
      _count: { _all: true },
    });
    if (lessonGroups.some((g) => g._count._all >= 3)) earnedPhase3Keys.push("curriculum");

    // Term calendar: teacher has a linked TeachingLocation with locationType SCHOOL.
    const schoolLink = await prisma.teacherLocationLink.findFirst({
      where: { teacherId, location: { locationType: "SCHOOL" } },
    });
    if (schoolLink) earnedPhase3Keys.push("termCalendar");

    // Group waitlist: a GroupClass has actually produced a waitlisted booking (i.e. reached capacity).
    const waitlisted = await prisma.groupSessionBooking.findFirst({
      where: { status: "WAITLISTED", groupClass: { teacherId } },
    });
    if (waitlisted) earnedPhase3Keys.push("waitlist");

    // Certifications: only relevant once multi-instructor is actually in play.
    if (teacher?.organisationId) earnedPhase3Keys.push("certifications");

    // Mileage/tax pack: the month before the UK tax year end, not an always-visible nag.
    if (isWithinTaxSeasonWindow(new Date())) {
      earnedPhase3Keys.push("taxSeasonMileage", "taxSeasonPack");
    }
  }

  return (
    <DashboardChrome
      userName={session?.user?.name ?? "Account"}
      archetype={teacher?.archetype ?? null}
      earnedPhase3Keys={earnedPhase3Keys}
    >
      {children}
    </DashboardChrome>
  );
}
