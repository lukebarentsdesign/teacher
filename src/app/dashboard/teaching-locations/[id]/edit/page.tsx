import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getActiveInvoicingTargetOptions, getActiveLocationTypeOptions } from "@/lib/menu-choice-options";
import { EditLocationForm } from "./edit-location-form";

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const teacherId = session!.user.id;

  const link = await prisma.teacherLocationLink.findFirst({
    where: { locationId: id, teacherId },
  });
  if (!link) notFound();

  const location = await prisma.teachingLocation.findUnique({ where: { id } });
  if (!location) notFound();

  const [termCalendars, locationTypeOptions, invoicingTargetOptions] = await Promise.all([
    prisma.termCalendar.findMany({
      where: { teacherId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getActiveLocationTypeOptions(teacherId),
    getActiveInvoicingTargetOptions(teacherId),
  ]);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/teaching-locations/${location.id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          Back to {location.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit teaching location</h1>
      </div>
      <EditLocationForm
        location={{
          id: location.id,
          name: location.name,
          address: location.address,
          invoicingTarget: location.invoicingTarget,
          customInvoicingTarget: "customInvoicingTarget" in location ? location.customInvoicingTarget : null,
          termStart: location.termStart ? location.termStart.toISOString().slice(0, 10) : null,
          termEnd: location.termEnd ? location.termEnd.toISOString().slice(0, 10) : null,
          logoUrl: location.logoUrl,
          primaryColor: location.primaryColor,
          secondaryColor: location.secondaryColor,
          locationType: location.locationType,
          customLocationType: "customLocationType" in location ? location.customLocationType : null,
          accessNotes: location.accessNotes,
          termCalendarId: location.termCalendarId,
        }}
        termCalendars={termCalendars}
        locationTypeOptions={locationTypeOptions}
        invoicingTargetOptions={invoicingTargetOptions}
      />
    </div>
  );
}