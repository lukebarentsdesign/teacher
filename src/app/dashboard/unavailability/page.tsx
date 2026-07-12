import Link from "next/link";
import { CalendarX, Plus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function UnavailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; credited?: string; emailed?: string }>;
}) {
  const { cancelled, credited, emailed } = await searchParams;
  const session = await auth();

  const items = await prisma.unavailability.findMany({
    where: { teacherId: session!.user.id },
    include: { school: true },
    orderBy: { startDatetime: "desc" },
  });

  const fmt = (d: Date) =>
    d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Unavailability</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Declare a window you can&apos;t teach — affected lessons are cancelled, credited, and
            guardians emailed automatically.
          </p>
        </div>
        <Link
          href="/dashboard/unavailability/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          <Plus className="h-4 w-4" />
          Declare
        </Link>
      </div>

      {cancelled !== undefined && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Recorded. Cancelled {cancelled} lesson{cancelled === "1" ? "" : "s"}, issued {credited ?? 0}{" "}
          make-up credit{credited === "1" ? "" : "s"}, emailed {emailed ?? 0} guardian
          {emailed === "1" ? "" : "s"}.
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <CalendarX className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No unavailability recorded yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-800">
                  {fmt(item.startDatetime)} → {fmt(item.endDatetime)}
                </span>
                <span className="text-xs text-neutral-400">
                  {item.school ? item.school.name : "All schools & home"}
                </span>
              </div>
              {item.reason && <p className="mt-1 text-sm text-neutral-500">{item.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
