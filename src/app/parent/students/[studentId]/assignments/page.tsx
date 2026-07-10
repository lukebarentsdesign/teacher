import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  REVIEWED_DONE: "Reviewed — done",
  REVIEWED_NOT_DONE: "Reviewed — not done",
};

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const assignments = await prisma.assignment.findMany({
    where: { studentId },
    orderBy: { reviewDate: "desc" },
    include: { resource: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Assignments</h1>
      {assignments.length === 0 ? (
        <p className="text-sm text-neutral-500">No assignments yet.</p>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{assignment.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{assignment.instructions}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Target: {assignment.target} · Review by{" "}
                    {assignment.reviewDate.toLocaleDateString("en-GB")}
                    {assignment.resource && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={assignment.resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {assignment.resource.title}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-neutral-500">
                  {STATUS_LABELS[assignment.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
