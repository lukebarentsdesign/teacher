import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ReviewButtons } from "./review-buttons";

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  REVIEWED_DONE: "Reviewed — done",
  REVIEWED_NOT_DONE: "Reviewed — not done",
};

export default async function AssignmentsPage() {
  const session = await auth();
  const assignments = await prisma.assignment.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { reviewDate: "desc" },
    include: { student: true, resource: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Assignments</h1>
        <Link
          href="/dashboard/assignments/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-neutral-500">No assignments yet.</p>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">
                    {assignment.title} — {assignment.student.name}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">{assignment.instructions}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Target: {assignment.target} · Review by{" "}
                    {assignment.reviewDate.toLocaleDateString("en-GB")}
                    {assignment.resource && (
                      <>
                        {" "}
                        ·{" "}
                        <a href={assignment.resource.url} target="_blank" rel="noopener noreferrer" className="underline">
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
              {assignment.status === "ASSIGNED" && <ReviewButtons assignmentId={assignment.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
