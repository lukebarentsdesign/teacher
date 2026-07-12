import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { calculateMileageAllowance, taxYearForDate } from "@/lib/mileage";
import { NewMileageForm } from "./new-mileage-form";
import { DeleteMileageButton } from "./delete-mileage-button";

export default async function MileagePage() {
  const session = await auth();

  const [logs, links] = await Promise.all([
    prisma.mileageLog.findMany({
      where: { teacherId: session!.user.id },
      include: { fromLocation: true, toLocation: true },
      orderBy: { date: "desc" },
    }),
    prisma.teacherLocationLink.findMany({ where: { teacherId: session!.user.id }, include: { location: true } }),
  ]);

  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  const currentTaxYear = taxYearForDate(new Date());
  const thisYearMiles = logs
    .filter((l) => taxYearForDate(l.date) === currentTaxYear)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((l) => Number(l.miles));
  const { totalMiles, totalAllowance } = calculateMileageAllowance(thisYearMiles);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Mileage</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Logged manually — there&apos;s no distance-calculation API wired in, so log each trip
          yourself. Rolls up into the{" "}
          <a href="/dashboard/tax-pack" className="underline hover:text-neutral-900">
            tax pack
          </a>{" "}
          against HMRC&apos;s tiered mileage rate.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">This tax year ({currentTaxYear}/{(currentTaxYear + 1) % 100})</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">{totalMiles.toFixed(1)} miles</p>
        <p className="text-sm text-neutral-500">£{totalAllowance.toFixed(2)} allowance</p>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-neutral-500">No trips logged yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-neutral-900">
                  {log.date.toLocaleDateString("en-GB")} · {log.miles.toString()} miles
                </p>
                <p className="text-xs text-neutral-500">
                  {[log.fromLocation?.name, log.toLocation?.name].filter(Boolean).join(" → ") || log.purpose || "—"}
                </p>
              </div>
              <DeleteMileageButton mileageLogId={log.id} />
            </li>
          ))}
        </ul>
      )}

      <NewMileageForm locations={locations} />
    </div>
  );
}
