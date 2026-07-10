import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

export default async function StudentLessonNotesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const lessons = await prisma.lesson.findMany({
    where: { studentId, note: { isNot: null } },
    orderBy: { scheduledAt: "desc" },
    include: { note: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Lesson notes</h1>
      {lessons.length === 0 ? (
        <p className="text-sm text-neutral-500">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">
                {lesson.scheduledAt.toLocaleDateString("en-GB")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                {lesson.note?.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
