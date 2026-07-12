import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ location?: string }>;
}) {
  const { teacherId } = await params;
  const { location: presetLocationId } = await searchParams;

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) notFound();

  const [allLessonTypes, links] = await Promise.all([
    prisma.lessonType.findMany({
      where: { teacherId, active: true },
      include: { locations: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacherLocationLink.findMany({ where: { teacherId }, include: { location: true } }),
  ]);

  // A LessonType with no locations attached is offered everywhere; one with locations is scoped
  // to just those. When the link is location-specific, filter to types that either apply
  // everywhere or explicitly include this location.
  const lessonTypes = presetLocationId
    ? allLessonTypes.filter(
        (lt) => lt.locations.length === 0 || lt.locations.some((l) => l.id === presetLocationId)
      )
    : allLessonTypes;

  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Lessons with {teacher.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tell us a bit about the student — {teacher.name} will review and confirm before
            anything is booked.
          </p>
        </div>

        {lessonTypes.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-neutral-500 shadow-sm">
            Nothing is currently open for enrolment here — please check back later.
          </div>
        ) : (
          <OnboardingForm
            teacherId={teacherId}
            teacherName={teacher.name}
            lessonTypes={lessonTypes.map((lt) => ({
              id: lt.id,
              name: lt.name,
              description: lt.description,
              defaultDurationMinutes: lt.defaultDurationMinutes,
            }))}
            locations={locations}
            presetLocationId={presetLocationId}
          />
        )}
      </div>
    </div>
  );
}
