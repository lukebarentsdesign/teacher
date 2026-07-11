import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ApplyAsCreditButton } from "./apply-as-credit-button";
import { ScheduleMakeUpForm } from "./schedule-make-up-form";

export default async function AbsencesPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const openMakeUps = await prisma.makeUpLesson.findMany({
    where: { completedAt: null, originalLesson: { teacherId } },
    include: { originalLesson: true, student: true, makeUpLesson: true },
    orderBy: { requestedAt: "asc" },
  });

  const linkedLessonIds = new Set(
    (await prisma.makeUpLesson.findMany({ where: { makeUpLessonId: { not: null } }, select: { makeUpLessonId: true } })).map(
      (m) => m.makeUpLessonId
    )
  );

  const candidateLessonsByStudent = new Map<
    string,
    { id: string; scheduledAt: Date }[]
  >();
  for (const row of openMakeUps) {
    if (row.makeUpLessonId || candidateLessonsByStudent.has(row.studentId)) continue;
    const upcoming = await prisma.lesson.findMany({
      where: {
        studentId: row.studentId,
        teacherId,
        status: "HELD",
        scheduledAt: { gte: new Date() },
        id: { notIn: [...linkedLessonIds].filter((id): id is string => !!id) },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    });
    candidateLessonsByStudent.set(row.studentId, upcoming);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Review term absences</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Confirmed no-shows waiting to be resolved — either schedule a make-up lesson, or apply the
          value as a credit against the student&apos;s next payment.
        </p>
      </div>

      {openMakeUps.length === 0 ? (
        <p className="text-sm text-neutral-500">No open absences right now.</p>
      ) : (
        <div className="space-y-4">
          {openMakeUps.map((row) => (
            <div key={row.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-medium text-neutral-900">{row.student.name}</p>
              <p className="mt-1 text-sm text-neutral-500">
                Missed {row.originalLesson.scheduledAt.toLocaleDateString("en-GB")}
                {row.originalLesson.noShowReason ? ` — ${row.originalLesson.noShowReason}` : ""}
                {row.makeUpLessonId && row.makeUpLesson
                  ? ` · make-up scheduled for ${row.makeUpLesson.scheduledAt.toLocaleDateString("en-GB")}`
                  : ""}
              </p>

              {!row.makeUpLessonId && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <ScheduleMakeUpForm
                    makeUpLessonRowId={row.id}
                    candidateLessons={candidateLessonsByStudent.get(row.studentId) ?? []}
                  />
                  <ApplyAsCreditButton makeUpLessonRowId={row.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
