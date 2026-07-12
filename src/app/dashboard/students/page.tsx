import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject: subjectFilter } = await searchParams;
  const session = await auth();

  const [students, subjects, pendingCount] = await Promise.all([
    prisma.student.findMany({
      where: {
        teacherId: session!.user.id,
        status: "ACTIVE",
        ...(subjectFilter ? { subjects: { some: { id: subjectFilter } } } : {}),
      },
      orderBy: { name: "asc" },
      include: { location: true, subjects: true },
    }),
    prisma.subject.findMany({ where: { teacherId: session!.user.id }, orderBy: { name: "asc" } }),
    prisma.student.count({ where: { teacherId: session!.user.id, status: "PENDING_REVIEW" } }),
  ]);

  // Group by subject so the teacher can see, e.g., every flute student together — a student
  // with more than one subject appears in every group it belongs to. Untagged students get their
  // own group rather than being silently dropped from the grouped view.
  const groups = new Map<string, { label: string; students: typeof students }>();
  if (!subjectFilter) {
    for (const subject of subjects) groups.set(subject.id, { label: subject.name, students: [] });
    groups.set("untagged", { label: "Untagged", students: [] });
    for (const student of students) {
      if (student.subjects.length === 0) {
        groups.get("untagged")!.students.push(student);
      } else {
        for (const subject of student.subjects) {
          groups.get(subject.id)?.students.push(student);
        }
      }
    }
  }

  function StudentTable({ rows }: { rows: typeof students }) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Discipline</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Teaching location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => (
              <tr key={student.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/students/${student.id}`} className="text-neutral-900 hover:underline">
                    {student.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-500">{student.discipline}</td>
                <td className="px-4 py-3 text-neutral-500">{student.source}</td>
                <td className="px-4 py-3 text-neutral-500">{student.location?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Students</h1>
        <Link
          href="/dashboard/students/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add student
        </Link>
      </div>

      {pendingCount > 0 && (
        <Link
          href="/dashboard/students/pending"
          className="mb-6 block rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          {pendingCount} self-serve submission{pendingCount === 1 ? "" : "s"} waiting for your review →
        </Link>
      )}

      {subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/dashboard/students"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
              !subjectFilter ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Grouped by subject
          </Link>
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/dashboard/students?subject=${subject.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                subjectFilter === subject.id
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {subject.name}
            </Link>
          ))}
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {subjectFilter ? "No students tagged with this subject." : "No students yet."}
        </p>
      ) : subjectFilter ? (
        <StudentTable rows={students} />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()]
            .filter(([, group]) => group.students.length > 0)
            .map(([key, group]) => (
              <section key={key}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {group.label} · {group.students.length}
                </h2>
                <StudentTable rows={group.students} />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
