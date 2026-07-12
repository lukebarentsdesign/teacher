import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewSubjectForm } from "./new-subject-form";
import { DeleteSubjectButton } from "./delete-subject-button";

export default async function SubjectsPage() {
  const session = await auth();
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Subjects</h1>
        <p className="mt-1 text-sm text-neutral-500">
          What you teach — flute, sax, piano, yoga, gymnastics, whatever fits. Tag each student
          with the subjects they&apos;re taught on their student page, then group or filter
          students by subject on the Students list.
        </p>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-neutral-500">No subjects yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {subjects.map((subject) => (
            <li key={subject.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-900">{subject.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">
                  {subject._count.students} student{subject._count.students === 1 ? "" : "s"}
                </span>
                <DeleteSubjectButton subjectId={subject.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewSubjectForm />
    </div>
  );
}
