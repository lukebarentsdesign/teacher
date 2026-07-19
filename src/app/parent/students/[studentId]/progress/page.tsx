import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  IN_PROGRESS: "bg-brand-50 text-brand-700 border-brand-100",
  NOT_STARTED: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Done",
  IN_PROGRESS: "In progress",
  NOT_STARTED: "Not started",
};

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  // Reads are never gated by module entitlement — a curriculum that already exists stays
  // visible to the family regardless of whether the teacher's Curriculum module is currently on.
  const curricula = await prisma.studentCurriculum.findMany({
    where: { studentId },
    include: { sections: { orderBy: { order: "asc" } } },
    orderBy: [{ status: "asc" }, { startedDate: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Progress</h1>
      <p className="mb-6 text-sm text-neutral-500">
        What&apos;s been covered so far, and what&apos;s coming up next.
      </p>

      {curricula.length === 0 ? (
        <p className="text-sm text-neutral-500">No curriculum plan has been set up yet.</p>
      ) : (
        <div className="space-y-6">
          {curricula.map((curriculum) => {
            const total = curriculum.sections.length;
            const completed = curriculum.sections.filter((s) => s.status === "COMPLETED").length;
            const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

            return (
              <div key={curriculum.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">{curriculum.title}</h2>
                    {curriculum.subject && (
                      <p className="text-xs text-neutral-500">{curriculum.subject}</p>
                    )}
                  </div>
                  {curriculum.status === "PAUSED" && (
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Paused
                    </span>
                  )}
                </div>

                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        {completed} of {total} section{total === 1 ? "" : "s"} complete
                      </span>
                      <span className="font-medium text-neutral-700">{percent}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-brand-500 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {total === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">No sections added yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-neutral-100">
                    {curriculum.sections.map((section) => (
                      <li key={section.id} className="flex items-start justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm text-neutral-800">{section.title}</p>
                          {section.description && (
                            <p className="mt-0.5 text-xs text-neutral-500">{section.description}</p>
                          )}
                          {section.status === "COMPLETED" && section.completedDate && (
                            <p className="mt-0.5 text-xs text-neutral-400">
                              Completed {section.completedDate.toLocaleDateString("en-GB")}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[section.status]}`}
                        >
                          {STATUS_LABEL[section.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
