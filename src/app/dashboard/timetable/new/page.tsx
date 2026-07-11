import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { parseAvailability, parseProtectedBlocks } from "@/lib/schedule-json";
import { filterAvailableSlots } from "@/lib/scheduling";
import { NewTimetableForm } from "./new-timetable-form";

export default async function NewTimetablePage() {
  const session = await auth();

  const [students, links] = await Promise.all([
    prisma.student.findMany({ where: { teacherId: session?.user?.id }, orderBy: { name: "asc" } }),
    prisma.teacherSchoolLink.findMany({
      where: { teacherId: session?.user?.id },
      include: { school: true },
    }),
  ]);

  const schoolIds = [...new Set(links.map((link) => link.schoolId))];
  const rooms = await prisma.room.findMany({ where: { schoolId: { in: schoolIds } } });
  const roomsBySchool = new Map(schoolIds.map((id) => [id, rooms.filter((r) => r.schoolId === id)]));

  const linksWithSlots = links.map((link) => ({
    id: link.id,
    schoolId: link.schoolId,
    schoolName: link.school.name,
    schedulingMode: link.schedulingMode,
    termStart: link.school.termStart?.toISOString() ?? null,
    termEnd: link.school.termEnd?.toISOString() ?? null,
    availableSlots: filterAvailableSlots(
      parseAvailability(link.availability),
      parseProtectedBlocks(link.protectedBlocks)
    ),
    rooms: (roomsBySchool.get(link.schoolId) ?? []).map((r) => ({ id: r.id, label: r.label })),
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Generate timetable</h1>
      {linksWithSlots.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Add availability for a school first (Schools → open a school → set up your engagement).
        </p>
      ) : (
        <NewTimetableForm students={students} links={linksWithSlots} />
      )}
    </div>
  );
}
