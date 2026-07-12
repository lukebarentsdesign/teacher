import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { SendSummaryButton } from "./send-summary-button";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function ProgressSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const session = await auth();

  const student = await prisma.student.findFirst({ where: { id, teacherId: session!.user.id } });
  if (!student) notFound();

  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getFullYear(), end.getMonth() - 3, end.getDate());

  const [lessons, assessments, sections] = await Promise.all([
    prisma.lesson.findMany({
      where: { studentId: id, note: { isNot: null }, scheduledAt: { gte: start, lte: end } },
      include: { note: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.assessment.findMany({
      where: { studentId: id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.studentCurriculumSection.findMany({
      where: {
        studentCurriculum: { studentId: id },
        status: "COMPLETED",
        completedDate: { gte: start, lte: end },
      },
      orderBy: { completedDate: "asc" },
    }),
  ]);

  const lines: string[] = [];
  lines.push(`${student.name}'s progress summary`);
  lines.push(`${fmt(start)} – ${fmt(end)}`);
  lines.push("");
  if (sections.length > 0) {
    lines.push("Curriculum sections completed:");
    for (const s of sections) lines.push(`- ${s.title} (${fmt(s.completedDate!)})`);
    lines.push("");
  }
  if (assessments.length > 0) {
    lines.push("Assessments:");
    for (const a of assessments) lines.push(`- ${a.level} on ${fmt(a.date)}${a.examBoard ? ` (${a.examBoard})` : ""}`);
    lines.push("");
  }
  if (lessons.length > 0) {
    lines.push("Lesson notes:");
    for (const l of lessons) lines.push(`- ${fmt(l.scheduledAt)}: ${l.note!.content}`);
  }
  const summaryText = lines.join("\n");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/dashboard/students/${student.id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to {student.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Progress summary</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Auto-generated from curriculum progress, assessments, and lesson notes — the single
          best retention tool for a private teacher, built entirely from data already captured.
        </p>
      </div>

      <form className="flex items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="from" className="block text-xs font-medium text-neutral-700">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={start.toISOString().slice(0, 10)}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs font-medium text-neutral-700">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={end.toISOString().slice(0, 10)}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Update range
        </button>
      </form>

      <div className="whitespace-pre-wrap rounded-xl bg-white p-6 text-sm text-neutral-800 shadow-sm">
        {summaryText}
      </div>

      <SendSummaryButton studentId={student.id} summaryText={summaryText} />
    </div>
  );
}
