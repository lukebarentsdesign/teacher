import { prisma } from "@/lib/db";

export default async function DashboardHomePage() {
  const [schoolCount, studentCount, activeSubscriptionCount] = await Promise.all([
    prisma.school.count(),
    prisma.student.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Overview</h1>
      <p className="mb-8 text-sm text-neutral-500">
        The unified fixed/fluid calendar view lands in the timetable-generator build step. For now,
        here&apos;s a quick summary.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Schools / venues" value={schoolCount} />
        <SummaryCard label="Students" value={studentCount} />
        <SummaryCard label="Active subscriptions" value={activeSubscriptionCount} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
