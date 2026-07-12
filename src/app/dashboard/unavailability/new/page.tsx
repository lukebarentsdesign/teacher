import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewUnavailabilityForm } from "./new-unavailability-form";

export default async function NewUnavailabilityPage() {
  const session = await auth();

  const links = await prisma.teacherLocationLink.findMany({
    where: { teacherId: session!.user.id },
    include: { location: true },
  });
  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Declare unavailability</h1>
      <p className="mb-6 text-sm text-neutral-500">
        You&apos;ll see exactly which lessons this affects before anything is cancelled.
      </p>
      <NewUnavailabilityForm locations={locations} />
    </div>
  );
}
