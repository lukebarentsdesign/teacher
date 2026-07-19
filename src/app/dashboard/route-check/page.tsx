import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { checkDayFeasibility, type DayStop } from "@/lib/route-check";
import { hasModule } from "@/lib/modules";

export default async function RouteCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const session = await auth();

  if (!(await hasModule(session!.user.id, "SCHEDULING"))) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Route check</h1>
        <p className="text-sm text-neutral-500">
          The Scheduling &amp; timetable module isn&apos;t enabled on this account — get in touch
          if you&apos;d like it switched on.
        </p>
      </div>
    );
  }

  const day = date ? new Date(date) : new Date();
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const [lessons, travelTimes] = await Promise.all([
    prisma.lesson.findMany({
      where: { teacherId: session!.user.id, status: "HELD", scheduledAt: { gte: dayStart, lte: dayEnd } },
      include: { location: true, student: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.locationTravelTime.findMany({ where: { teacherId: session!.user.id } }),
  ]);

  const travelLookup = new Map(travelTimes.map((t) => [`${t.fromLocationId}|${t.toLocationId}`, t.minutes]));

  const stops: DayStop[] = lessons.map((l) => ({
    id: l.id,
    locationId: l.locationId,
    locationName: l.location.name,
    scheduledAt: l.scheduledAt,
    durationMins: l.durationMins,
  }));

  const issues = checkDayFeasibility(stops, (from, to) => travelLookup.get(`${from}|${to}`) ?? null);
  const issuesByFromStop = new Map(issues.map((i) => [i.fromStopId, i]));

  const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Route check</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Flags a gap between two bookings shorter than the{" "}
          <Link href="/dashboard/travel-times" className="underline hover:text-neutral-900">
            travel time
          </Link>{" "}
          you&apos;ve set between their locations — distinct from double-booking conflict checks,
          which this app already does elsewhere. A location pair with no travel time set isn&apos;t
          checked.
        </p>
      </div>

      <form className="flex items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-neutral-700">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={dayStart.toISOString().slice(0, 10)}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Check
        </button>
      </form>

      {stops.length === 0 ? (
        <p className="text-sm text-neutral-500">No lessons that day.</p>
      ) : (
        <ul className="space-y-2">
          {stops.map((stop) => {
            const issue = issuesByFromStop.get(stop.id);
            return (
              <li key={stop.id}>
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-neutral-900">{fmtTime(stop.scheduledAt)}</span>
                  <span className="text-neutral-600">{stop.locationName}</span>
                </div>
                {issue && (
                  <p className="ml-4 mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    Only {Math.round(issue.gapMinutes)} min to the next location — you said this
                    trip needs about {issue.requiredMinutes} min.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
