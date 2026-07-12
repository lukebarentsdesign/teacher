import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveNowNext, type DisplayLesson, type DisplayGroupClass } from "@/lib/session-plan-display";

export const dynamic = "force-dynamic";

function OccurrenceCard({
  label,
  occurrence,
}: {
  label: string;
  occurrence: { title: string; start: Date; end: Date; plan: { title: string; content: string } | null } | null;
}) {
  const fmt = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-2xl bg-white/5 p-8">
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      {occurrence ? (
        <>
          <p className="text-3xl font-semibold text-white">{occurrence.title}</p>
          <p className="mt-1 text-lg text-neutral-400">
            {fmt(occurrence.start)}–{fmt(occurrence.end)}
          </p>
          {occurrence.plan ? (
            <div className="mt-6">
              <p className="text-xl font-medium text-white">{occurrence.plan.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-lg text-neutral-300">{occurrence.plan.content}</p>
            </div>
          ) : (
            <p className="mt-6 text-lg text-neutral-500">No session plan published yet.</p>
          )}
        </>
      ) : (
        <p className="text-2xl text-neutral-500">—</p>
      )}
    </div>
  );
}

export default async function DisplayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const location = await prisma.teachingLocation.findUnique({ where: { displayToken: token } });
  if (!location) notFound();

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const [lessons, groupClasses] = await Promise.all([
    prisma.lesson.findMany({
      where: { locationId: location.id, status: "HELD", scheduledAt: { gte: dayStart, lte: dayEnd } },
      include: { student: true, sessionPlan: true },
    }),
    prisma.groupClass.findMany({
      where: { locationId: location.id },
      include: { sessionPlans: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const displayLessons: DisplayLesson[] = lessons.map((l) => ({
    kind: "lesson",
    id: l.id,
    title: l.student.name,
    scheduledAt: l.scheduledAt,
    durationMins: l.durationMins,
    plan:
      l.sessionPlan && l.sessionPlan.publishedAt
        ? { title: l.sessionPlan.title, content: l.sessionPlan.content }
        : null,
  }));

  const displayGroupClasses: DisplayGroupClass[] = groupClasses.map((gc) => {
    const current = gc.sessionPlans[0];
    return {
      kind: "groupClass",
      id: gc.id,
      title: gc.name,
      dayOfWeek: gc.dayOfWeek,
      startTime: gc.startTime,
      endTime: gc.endTime,
      plan: current && current.publishedAt ? { title: current.title, content: current.content } : null,
    };
  });

  const { now: nowOccurrence, next: nextOccurrence } = resolveNowNext(displayLessons, displayGroupClasses, now);

  return (
    <div className="min-h-screen bg-neutral-950 px-10 py-12">
      <meta httpEquiv="refresh" content="60" />
      <p className="mb-8 text-2xl font-semibold text-white">{location.name}</p>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <OccurrenceCard label="Now" occurrence={nowOccurrence} />
        <OccurrenceCard label="Next" occurrence={nextOccurrence} />
      </div>
    </div>
  );
}
