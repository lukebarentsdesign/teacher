import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "../../[teacherId]/onboarding-form";

export const dynamic = "force-dynamic";

/**
 * Token-scoped variant of /onboard/[teacherId] — same OnboardingForm, same
 * submitSelfServeOnboardingAction, just pre-scoped (location + lesson-type allowlist) and
 * re-branded per an EmbedConfig instead of a raw teacherId + optional ?location= query param.
 * Meant to be loaded in an <iframe> on the teacher's own site or linked directly (e.g. a
 * Facebook bio link) — see the copy-paste snippet on /dashboard/embeds.
 */
export default async function EmbedOnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const config = await prisma.embedConfig.findUnique({
    where: { embedToken: token },
    include: { teacher: true, allowedLessonTypes: true },
  });
  if (!config) notFound();

  const [allLessonTypes, links] = await Promise.all([
    prisma.lessonType.findMany({
      where: { teacherId: config.teacherId, active: true },
      include: { locations: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacherLocationLink.findMany({ where: { teacherId: config.teacherId }, include: { location: true } }),
  ]);

  const allowedIds = config.allowedLessonTypes.length > 0 ? new Set(config.allowedLessonTypes.map((lt) => lt.id)) : null;

  const lessonTypes = allLessonTypes.filter((lt) => {
    const locationOk = !config.locationId || lt.locations.length === 0 || lt.locations.some((l) => l.id === config.locationId);
    const allowlistOk = !allowedIds || allowedIds.has(lt.id);
    return locationOk && allowlistOk;
  });

  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  const brandColor = config.brandColor ?? undefined;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1
            className="text-xl font-semibold text-neutral-900"
            style={brandColor ? { color: brandColor } : undefined}
          >
            Lessons with {config.teacher.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tell us a bit about the student — {config.teacher.name} will review and confirm before
            anything is booked.
          </p>
        </div>

        {lessonTypes.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-neutral-500 shadow-sm">
            Nothing is currently open for enrolment here — please check back later.
          </div>
        ) : (
          <OnboardingForm
            teacherId={config.teacherId}
            teacherName={config.teacher.name}
            lessonTypes={lessonTypes.map((lt) => ({
              id: lt.id,
              name: lt.name,
              description: lt.description,
              defaultDurationMinutes: lt.defaultDurationMinutes,
            }))}
            locations={locations}
            presetLocationId={config.locationId ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
