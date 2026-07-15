import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Document",
  AUDIO: "Audio",
  VIDEO: "Video",
  IMAGE: "Image",
};

export default async function StudentResourcesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const lessonIds = (
    await prisma.lesson.findMany({ where: { studentId }, select: { id: true } })
  ).map((lesson) => lesson.id);

  const assignmentResourceIds = (
    await prisma.assignment.findMany({
      where: { studentId, resourceId: { not: null } },
      select: { resourceId: true },
    })
  )
    .map((assignment) => assignment.resourceId)
    .filter((id): id is string => id !== null);

  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { studentId },
        { lessonId: { in: lessonIds } },
        { id: { in: assignmentResourceIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Resources</h1>
      {resources.length === 0 ? (
        <p className="text-sm text-neutral-500">No resources shared yet.</p>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md"
            >
              <p className="font-medium text-neutral-900">{resource.title}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {TYPE_LABELS[resource.type]}
                {resource.sourceLabel && ` - ${resource.sourceLabel}`}
                {resource.description && ` - ${resource.description}`}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
