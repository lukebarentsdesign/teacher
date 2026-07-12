import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewWaitlistForm } from "./new-waitlist-form";
import { WaitlistRowActions } from "./waitlist-row-actions";

const STATUS_STYLES: Record<string, string> = {
  WAITING: "bg-amber-50 text-amber-700",
  CONTACTED: "bg-blue-50 text-blue-700",
  CONVERTED: "bg-green-50 text-green-700",
  CANCELLED: "bg-neutral-100 text-neutral-500",
};

export default async function WaitlistPage() {
  const session = await auth();

  const [entries, lessonTypes, links] = await Promise.all([
    prisma.timetableWaitlist.findMany({
      where: { teacherId: session!.user.id },
      include: { lessonType: true, location: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lessonType.findMany({
      where: { teacherId: session!.user.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.teacherLocationLink.findMany({ where: { teacherId: session!.user.id }, include: { location: true } }),
  ]);

  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Waitlist</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Interested but no space right now — captured against a lesson type/location so the
          enquiry isn&apos;t lost. No automatic matching, this is a pipeline you work manually.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">Nobody on the waitlist.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-neutral-900">
                  {e.contactName}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                    {e.status}
                  </span>
                </p>
                <p className="text-xs text-neutral-500">
                  {[e.lessonType?.name, e.location?.name, e.contactEmail, e.contactPhone, e.notes]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <WaitlistRowActions entryId={e.id} status={e.status} />
            </li>
          ))}
        </ul>
      )}

      <NewWaitlistForm lessonTypes={lessonTypes} locations={locations} />
    </div>
  );
}
