import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";
import { PeriodForm } from "./period-form";
import { DeletePeriodButton } from "./delete-period-button";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function TermCalendarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "TERM_CALENDARS");

  const calendar = await prisma.termCalendar.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      terms: { orderBy: { startDate: "asc" } },
      holidays: { orderBy: { startDate: "asc" } },
      locations: true,
    },
  });
  if (!calendar) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/term-calendars" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to term calendars
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{calendar.name}</h1>
        {calendar.locations.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            Used by: {calendar.locations.map((l) => l.name).join(", ")}
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Terms</h2>
        {calendar.terms.length === 0 ? (
          <p className="text-sm text-neutral-500">No terms yet.</p>
        ) : (
          <ul className="space-y-2">
            {calendar.terms.map((term) => (
              <li key={term.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                <span className="text-neutral-800">
                  <span className="font-medium">{term.name}</span> · {fmt(term.startDate)} – {fmt(term.endDate)}
                </span>
                <DeletePeriodButton periodId={term.id} calendarId={calendar.id} kind="term" />
              </li>
            ))}
          </ul>
        )}
        {moduleEnabled ? (
          <PeriodForm calendarId={calendar.id} kind="term" />
        ) : (
          <p className="text-sm text-neutral-500">
            The Term calendars module isn&apos;t enabled on this account, so new terms can&apos;t
            be added — get in touch if you&apos;d like it switched on.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Holidays &amp; half-terms</h2>
        <p className="mb-3 text-xs text-neutral-500">Excluded from candidate lesson dates by the bulk generator.</p>
        {calendar.holidays.length === 0 ? (
          <p className="text-sm text-neutral-500">No holidays yet.</p>
        ) : (
          <ul className="space-y-2">
            {calendar.holidays.map((holiday) => (
              <li key={holiday.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                <span className="text-neutral-800">
                  <span className="font-medium">{holiday.name}</span> · {fmt(holiday.startDate)} – {fmt(holiday.endDate)}
                </span>
                <DeletePeriodButton periodId={holiday.id} calendarId={calendar.id} kind="holiday" />
              </li>
            ))}
          </ul>
        )}
        {moduleEnabled ? (
          <PeriodForm calendarId={calendar.id} kind="holiday" />
        ) : (
          <p className="text-sm text-neutral-500">
            The Term calendars module isn&apos;t enabled on this account, so new holidays
            can&apos;t be added — get in touch if you&apos;d like it switched on.
          </p>
        )}
      </section>
    </div>
  );
}
