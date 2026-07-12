import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewLessonTypeForm } from "./new-lesson-type-form";
import { ActiveToggle } from "./active-toggle";

export default async function LessonTypesPage() {
  const session = await auth();

  const [lessonTypes, links] = await Promise.all([
    prisma.lessonType.findMany({
      where: { teacherId: session!.user.id },
      include: { locations: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacherLocationLink.findMany({
      where: { teacherId: session!.user.id },
      include: { location: true },
    }),
  ]);
  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Lesson types</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your menu of what you teach — used by onboarding (direct and self-serve) and bulk
          timetable generation to know what a student is being scheduled for.
        </p>
      </div>

      {lessonTypes.length === 0 ? (
        <p className="text-sm text-neutral-500">No lesson types yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Offered at</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lessonTypes.map((lt) => (
                <tr key={lt.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">{lt.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{lt.defaultDurationMinutes} min</td>
                  <td className="px-4 py-3 text-neutral-500">£{lt.defaultFee.toString()}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {lt.locations.length === 0 ? "Everywhere" : lt.locations.map((l) => l.name).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{lt.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3 text-right">
                    <ActiveToggle lessonTypeId={lt.id} active={lt.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewLessonTypeForm locations={locations} />
    </div>
  );
}
