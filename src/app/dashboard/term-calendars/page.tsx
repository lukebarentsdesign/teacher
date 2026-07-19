import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewCalendarForm } from "./new-calendar-form";
import { hasModule } from "@/lib/modules";

export default async function TermCalendarsPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "TERM_CALENDARS");

  const calendars = await prisma.termCalendar.findMany({
    where: { teacherId: session!.user.id },
    include: { _count: { select: { terms: true, holidays: true, locations: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Term calendars</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Reusable term-dates templates (UK term dates vary by local authority, so these are entered
          by hand, not pulled from a feed). Assign one to a teaching location, then the bulk
          timetable generator schedules within its terms and skips its holidays.
        </p>
      </div>

      {calendars.length === 0 ? (
        <p className="text-sm text-neutral-500">No term calendars yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {calendars.map((cal) => (
            <li key={cal.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/dashboard/term-calendars/${cal.id}`} className="font-medium text-neutral-900 hover:underline">
                {cal.name}
              </Link>
              <span className="text-xs text-neutral-400">
                {cal._count.terms} term{cal._count.terms === 1 ? "" : "s"} · {cal._count.holidays} holiday
                {cal._count.holidays === 1 ? "" : "s"} · {cal._count.locations} location
                {cal._count.locations === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {moduleEnabled ? (
        <NewCalendarForm />
      ) : (
        <p className="text-sm text-neutral-500">
          The Term calendars module isn&apos;t enabled on this account, so new calendars can&apos;t
          be created — get in touch if you&apos;d like it switched on.
        </p>
      )}
    </div>
  );
}
