import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewTravelTimeForm } from "./new-travel-time-form";
import { DeleteTravelTimeButton } from "./delete-travel-time-button";

export default async function TravelTimesPage() {
  const session = await auth();

  const [entries, links] = await Promise.all([
    prisma.locationTravelTime.findMany({
      where: { teacherId: session!.user.id },
      include: { fromLocation: true, toLocation: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacherLocationLink.findMany({ where: { teacherId: session!.user.id }, include: { location: true } }),
  ]);

  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Travel times</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Estimated minutes between two of your teaching locations, entered by hand — there&apos;s
          no distance-calculation API wired in. Feeds the{" "}
          <a href="/dashboard/route-check" className="underline hover:text-neutral-900">
            route check
          </a>
          , which flags a day where two bookings are scheduled tighter than this.
        </p>
      </div>

      {locations.length < 2 ? (
        <p className="text-sm text-neutral-500">Add at least two teaching locations first.</p>
      ) : (
        <>
          {entries.length === 0 ? (
            <p className="text-sm text-neutral-500">No travel times set yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-neutral-800">
                    {e.fromLocation.name} → {e.toLocation.name}
                    <span className="ml-2 text-xs text-neutral-500">{e.minutes} min</span>
                  </span>
                  <DeleteTravelTimeButton travelTimeId={e.id} />
                </li>
              ))}
            </ul>
          )}
          <NewTravelTimeForm locations={locations} />
        </>
      )}
    </div>
  );
}
