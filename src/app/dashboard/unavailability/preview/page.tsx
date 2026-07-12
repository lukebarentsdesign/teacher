import Link from "next/link";
import { auth } from "@/auth";
import { findAffectedBookings } from "@/lib/unavailability";
import { confirmUnavailabilityAction } from "./actions";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function PreviewUnavailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; reason?: string; locationId?: string }>;
}) {
  const { start, end, reason, locationId } = await searchParams;
  const session = await auth();

  if (!start || !end) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-600">Missing date range.</p>
        <Link href="/dashboard/unavailability/new" className="text-sm text-brand-700 underline">
          Start again
        </Link>
      </div>
    );
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const affected = await findAffectedBookings(session!.user.id, startDate, endDate, locationId);

  const totalGuardianEmails = affected.lessons.reduce((n, l) => n + l.guardianEmails.length, 0);
  const nothingAffected = affected.lessons.length === 0 && affected.groupClasses.length === 0;

  const fmt = (d: Date) =>
    d.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Review affected lessons</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Unavailable from <span className="font-medium text-neutral-700">{fmt(startDate)}</span> until{" "}
        <span className="font-medium text-neutral-700">{fmt(endDate)}</span>
        {reason ? ` — ${reason}` : ""}. Nothing is cancelled until you confirm below.
      </p>

      {nothingAffected ? (
        <div className="rounded-xl bg-white p-6 text-sm text-neutral-600 shadow-sm">
          No lessons or classes fall inside this window. You can still record the unavailability.
        </div>
      ) : (
        <div className="space-y-6">
          {affected.lessons.length > 0 && (
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                {affected.lessons.length} lesson{affected.lessons.length === 1 ? "" : "s"} — will be
                cancelled &amp; a make-up credit issued
              </h2>
              <ul className="divide-y divide-neutral-100">
                {affected.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-neutral-800">{lesson.studentName}</span>
                    <span className="text-neutral-500">{fmt(lesson.scheduledAt)}</span>
                    <span className="text-xs text-neutral-400">
                      {lesson.guardianEmails.length > 0
                        ? `${lesson.guardianEmails.length} guardian email${
                            lesson.guardianEmails.length === 1 ? "" : "s"
                          }`
                        : "no email on file"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {affected.groupClasses.length > 0 && (
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-neutral-900">
                {affected.groupClasses.length} group class
                {affected.groupClasses.length === 1 ? "" : "es"} may be affected
              </h2>
              <p className="mb-3 text-xs text-neutral-500">
                Group classes recur weekly with no dated instance, so these are a heads-up only — they
                are not auto-cancelled or credited. Follow up with attendees directly.
              </p>
              <ul className="divide-y divide-neutral-100">
                {affected.groupClasses.map((gc) => (
                  <li key={gc.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-neutral-800">{gc.name}</span>
                    <span className="text-neutral-500">
                      {WEEKDAYS[gc.dayOfWeek]} {gc.startTime}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <form action={confirmUnavailabilityAction} className="mt-6 flex items-center gap-3">
        <input type="hidden" name="start" value={start} />
        <input type="hidden" name="end" value={end} />
        {reason && <input type="hidden" name="reason" value={reason} />}
        {locationId && <input type="hidden" name="locationId" value={locationId} />}
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          {affected.lessons.length > 0
            ? `Cancel ${affected.lessons.length} lesson${
                affected.lessons.length === 1 ? "" : "s"
              } & email ${totalGuardianEmails} guardian${totalGuardianEmails === 1 ? "" : "s"}`
            : "Record unavailability"}
        </button>
        <Link
          href="/dashboard/unavailability/new"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          Back
        </Link>
      </form>
    </div>
  );
}
