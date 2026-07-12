import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { LocationPricing } from "./location-pricing";

export default async function LessonTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const lessonType = await prisma.lessonType.findFirst({
    where: { id, teacherId: session!.user.id },
    include: { locations: true },
  });
  if (!lessonType) notFound();

  const students = await prisma.student.findMany({
    where: { requestedLessonTypeId: lessonType.id },
    include: { location: true },
    orderBy: { name: "asc" },
  });

  const [pricing, links] = await Promise.all([
    prisma.lessonTypeLocationPricing.findMany({
      where: { lessonTypeId: lessonType.id },
      include: { location: true },
      orderBy: { location: { name: "asc" } },
    }),
    prisma.teacherLocationLink.findMany({
      where: { teacherId: session!.user.id },
      include: { location: true },
    }),
  ]);
  // Candidates to price against: the LessonType's own scoped locations if it has any, otherwise
  // every location the teacher is linked to (since it's offered everywhere).
  const allTeacherLocations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );
  const candidateLocations =
    lessonType.locations.length > 0
      ? lessonType.locations.map((l) => ({ id: l.id, name: l.name }))
      : allTeacherLocations;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/lesson-types" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to lesson types
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{lessonType.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lessonType.defaultDurationMinutes} min · £{lessonType.defaultFee.toString()} ·{" "}
          {lessonType.active ? "Active" : "Inactive"}
        </p>
        {lessonType.description && (
          <p className="mt-2 text-sm text-neutral-600">{lessonType.description}</p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Offered at</h2>
        {lessonType.locations.length === 0 ? (
          <p className="text-sm text-neutral-500">Everywhere — not scoped to specific locations.</p>
        ) : (
          <ul className="space-y-2">
            {lessonType.locations.map((location) => (
              <li key={location.id} className="rounded-xl bg-white p-4 shadow-sm">
                <Link
                  href={`/dashboard/teaching-locations/${location.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  {location.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Pricing by location</h2>
        <LocationPricing
          lessonTypeId={lessonType.id}
          defaultFee={lessonType.defaultFee.toString()}
          candidateLocations={candidateLocations}
          pricing={pricing.map((p) => ({
            id: p.id,
            locationId: p.locationId,
            locationName: p.location.name,
            fee: p.fee.toString(),
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Students who requested this</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Only tracks self-serve onboarding submissions — a directly-added student isn&apos;t tied
          to one lesson type long-term.
        </p>
        {students.length === 0 ? (
          <p className="text-sm text-neutral-500">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((student) => (
              <li key={student.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <Link
                  href={`/dashboard/students/${student.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  {student.name}
                </Link>
                <span className="text-xs text-neutral-400">
                  {student.status} · {student.location?.name ?? "Home"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
