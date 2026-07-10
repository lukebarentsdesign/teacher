import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export default async function LessonsPage() {
  const session = await auth();
  const lessons = await prisma.lesson.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { scheduledAt: "desc" },
    include: { student: true, note: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Lessons</h1>

      {lessons.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No lessons yet — generate a timetable to create some.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-500">
                    {lesson.scheduledAt.toLocaleDateString("en-GB")}{" "}
                    {lesson.scheduledAt.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-neutral-900">{lesson.student.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{lesson.status}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/lessons/${lesson.id}`} className="text-neutral-900 underline">
                      {lesson.note ? "Edit note" : "Add note"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
