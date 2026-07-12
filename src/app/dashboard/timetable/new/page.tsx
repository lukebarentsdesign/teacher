import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { parseAvailability, parseProtectedBlocks } from "@/lib/schedule-json";
import { filterAvailableSlots } from "@/lib/scheduling";
import { NewTimetableForm } from "./new-timetable-form";

export default async function NewTimetablePage() {
  const session = await auth();

  const [students, links] = await Promise.all([
    prisma.student.findMany({ where: { teacherId: session?.user?.id }, orderBy: { name: "asc" } }),
    prisma.teacherLocationLink.findMany({
      where: { teacherId: session?.user?.id },
      include: { location: true },
    }),
  ]);

  const locationIds = [...new Set(links.map((link) => link.locationId))];
  const rooms = await prisma.room.findMany({ where: { locationId: { in: locationIds } } });
  const roomsByLocation = new Map(locationIds.map((id) => [id, rooms.filter((r) => r.locationId === id)]));

  const linksWithSlots = links.map((link) => ({
    id: link.id,
    locationId: link.locationId,
    locationName: link.location.name,
    schedulingMode: link.schedulingMode,
    termStart: link.location.termStart?.toISOString() ?? null,
    termEnd: link.location.termEnd?.toISOString() ?? null,
    availableSlots: filterAvailableSlots(
      parseAvailability(link.availability),
      parseProtectedBlocks(link.protectedBlocks)
    ),
    rooms: (roomsByLocation.get(link.locationId) ?? []).map((r) => ({ id: r.id, label: r.label })),
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Generate timetable</h1>
      {linksWithSlots.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Add availability for a location first (Locations → open a location → set up your engagement).
        </p>
      ) : (
        <NewTimetableForm students={students} links={linksWithSlots} />
      )}
    </div>
  );
}
