import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewEmbedForm } from "./new-embed-form";
import { EmbedShareCard } from "./embed-share-card";
import { hasModule } from "@/lib/modules";

export default async function EmbedsPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "EMBEDS");

  const [embeds, locations, lessonTypes] = await Promise.all([
    prisma.embedConfig.findMany({ where: { teacherId: session!.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.teacherLocationLink.findMany({
      where: { teacherId: session!.user.id },
      include: { location: true },
    }),
    prisma.lessonType.findMany({
      where: { teacherId: session!.user.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const uniqueLocations = Array.from(
    new Map(locations.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Embeddable onboarding widget</h1>
        <p className="mt-1 text-sm text-neutral-500">
          A named, shareable configuration of the self-serve onboarding questionnaire — pre-scoped
          to a location and/or lesson types, and re-branded. Submitting through it goes through the
          exact same review flow as any other self-serve submission.
        </p>
      </div>

      {embeds.length === 0 ? (
        <p className="text-sm text-neutral-500">No embeds yet.</p>
      ) : (
        <div className="space-y-3">
          {embeds.map((e) => (
            <EmbedShareCard key={e.id} embedConfigId={e.id} label={e.label} embedToken={e.embedToken} />
          ))}
        </div>
      )}

      {moduleEnabled ? (
        <NewEmbedForm locations={uniqueLocations} lessonTypes={lessonTypes} />
      ) : (
        <p className="text-sm text-neutral-500">
          The Embeds &amp; booking widget module isn&apos;t enabled on this account, so new embed
          links can&apos;t be created — get in touch if you&apos;d like it switched on. Existing
          embed links keep working for visitors either way.
        </p>
      )}
    </div>
  );
}
