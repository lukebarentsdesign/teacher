import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { parseAvailability, parseProtectedBlocks } from "@/lib/schedule-json";
import { filterAvailableSlots } from "@/lib/scheduling";
import { BulkTimetableForm } from "./bulk-timetable-form";

export default async function BulkTimetablePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [links, lessonTypes, students] = await Promise.all([
    prisma.teacherLocationLink.findMany({
      where: { teacherId },
      include: {
        location: {
          include: { termCalendar: { include: { terms: { orderBy: { startDate: "asc" } } } } },
        },
      },
    }),
    prisma.lessonType.findMany({
      where: { teacherId, active: true },
      include: { locations: true },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { teacherId, status: "ACTIVE" },
      select: { id: true, name: true, locationId: true, requestedLessonTypeId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const locations = links.map((link) => {
    const windowCount = filterAvailableSlots(
      parseAvailability(link.availability),
      parseProtectedBlocks(link.protectedBlocks)
    ).length;
    return {
      id: link.locationId,
      name: link.location.name,
      windowCount,
      termStart: link.location.termStart?.toISOString().slice(0, 10) ?? null,
      termEnd: link.location.termEnd?.toISOString().slice(0, 10) ?? null,
      terms: (link.location.termCalendar?.terms ?? []).map((t) => ({
        name: t.name,
        startDate: t.startDate.toISOString().slice(0, 10),
        endDate: t.endDate.toISOString().slice(0, 10),
      })),
    };
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Bulk timetable</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Arrange a whole term of lessons for every student of one lesson type at one location in a
        single pass — e.g. &ldquo;this term&apos;s Flute lessons at St Mary&apos;s, 10 each&rdquo;.
        Holidays are skipped and anyone who can&apos;t be fully scheduled is flagged.
      </p>

      {locations.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Set up availability at a location first (Teaching locations → open one → your engagement).
        </p>
      ) : lessonTypes.length === 0 ? (
        <p className="text-sm text-neutral-500">Add at least one active lesson type first.</p>
      ) : (
        <BulkTimetableForm
          locations={locations}
          lessonTypes={lessonTypes.map((lt) => ({
            id: lt.id,
            name: lt.name,
            defaultDurationMinutes: lt.defaultDurationMinutes,
            locationIds: lt.locations.map((l) => l.id),
          }))}
          students={students}
        />
      )}
    </div>
  );
}
