import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ageInYears } from "@/lib/age";
import { NewLinkForm } from "./new-link-form";
import { NewRoomForm } from "./new-room-form";
import { NewGroupClassForm } from "./new-group-class-form";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const location = await prisma.teachingLocation.findUnique({ where: { id } });
  if (!location) notFound();

  const links = await prisma.teacherLocationLink.findMany({
    where: { locationId: id, teacherId: session?.user?.id },
    include: { teacher: true },
  });

  const rooms = await prisma.room.findMany({ where: { locationId: id }, orderBy: { label: "asc" } });

  const groupClasses = await prisma.groupClass.findMany({
    where: { locationId: id, teacherId: session?.user?.id },
    include: { room: true, subject: true, members: { where: { leftAt: null } } },
    orderBy: { name: "asc" },
  });

  const subjects = await prisma.subject.findMany({
    where: { teacherId: session?.user?.id },
    orderBy: { name: "asc" },
  });

  // Enrolled = Student.locationId matches, regardless of who pays (single source of truth for
  // enrollment; billing relationships live separately on StudentPayerLink).
  const enrolledStudents = await prisma.student.findMany({
    where: { locationId: id, teacherId: session?.user?.id },
    include: { payerLinks: { include: { payer: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{location.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {location.address ?? "No address on file"} · Invoicing: {location.invoicingTarget}
            {location.termStart && location.termEnd
              ? ` · Term: ${location.termStart.toLocaleDateString("en-GB")}–${location.termEnd.toLocaleDateString("en-GB")}`
              : " · No term dates set"}
          </p>
        </div>
        <Link
          href={`/dashboard/teaching-locations/${location.id}/edit`}
          className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100"
        >
          Edit
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Your engagement here</h2>
        {links.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">
            No availability set up yet — add it below so the timetable generator has slots to work with.
          </p>
        ) : (
          <div className="mb-6 space-y-3">
            {links.map((link) => (
              <div key={link.id} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-neutral-900">
                  {link.schedulingMode} scheduling · {link.taxHandling.replace("_", " ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(link.availability as { dayOfWeek: number; startTime: string; endTime: string }[]).map(
                    (slot, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                      >
                        {DAY_LABELS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <NewLinkForm locationId={location.id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Rooms</h2>
        {rooms.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No rooms yet.</p>
        ) : (
          <div className="mb-6 space-y-2">
            {rooms.map((room) => {
              const features = room.features as { hasPiano?: boolean; hasMirrors?: boolean; floor?: string | null };
              return (
                <div key={room.id} className="flex items-start justify-between rounded-xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{room.label}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {[
                        features.floor ? `Floor: ${features.floor}` : null,
                        features.hasPiano ? "Piano" : null,
                        features.hasMirrors ? "Mirrors" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No features noted"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/teaching-locations/${location.id}/rooms/${room.id}`}
                    className="shrink-0 text-xs text-neutral-500 underline hover:text-neutral-900"
                  >
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        <NewRoomForm locationId={location.id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Group classes</h2>
        {groupClasses.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No group classes yet.</p>
        ) : (
          <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Class</th>
                  <th className="px-4 py-2 font-medium">Slot</th>
                  <th className="px-4 py-2 font-medium">Room</th>
                  <th className="px-4 py-2 font-medium">Members</th>
                </tr>
              </thead>
              <tbody>
                {groupClasses.map((gc) => (
                  <tr key={gc.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/group-classes/${gc.id}`} className="text-neutral-900 hover:underline">
                        {gc.name}
                      </Link>
                      <span className="ml-2 text-xs text-neutral-500">{gc.discipline}</span>
                      {gc.subject && (
                        <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                          {gc.subject.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">
                      {DAY_LABELS[gc.dayOfWeek]} {gc.startTime}–{gc.endTime}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{gc.room?.label ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-600">{gc.members.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <NewGroupClassForm locationId={location.id} rooms={rooms} subjects={subjects} />
      </section>

      <section id="enrolled" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Enrolled students</h2>
        {enrolledStudents.length === 0 ? (
          <p className="text-sm text-neutral-500">No students enrolled at this teaching location yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Payer(s)</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((student) => (
                  <tr key={student.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">
                      <Link href={`/dashboard/students/${student.id}`} className="hover:underline">
                        {student.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {student.dob ? ageInYears(student.dob) : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {student.payerLinks.map((l) => l.payer.name).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
