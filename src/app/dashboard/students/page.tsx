import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    include: { school: true },
  });

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

      {students.length === 0 ? (
        <p className="text-sm text-neutral-500">No students yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Discipline</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">School</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="text-neutral-900 hover:underline"
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{student.discipline}</td>
                  <td className="px-4 py-3 text-neutral-500">{student.source}</td>
                  <td className="px-4 py-3 text-neutral-500">{student.school?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
