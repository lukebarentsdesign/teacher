import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewCourseForm } from "./new-course-form";

export default async function CoursesPage() {
  const session = await auth();

  const courses = await prisma.course.findMany({
    where: { teacherId: session!.user.id },
    include: { _count: { select: { items: true, purchases: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Courses</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sellable video/audio/document content, distinct from the free curriculum library.
          Purchases are recorded manually (like add-ons) — collecting payment is a real-world
          action you take yourself, not automated.
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-neutral-500">No courses yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <Link href={`/dashboard/courses/${c.id}`} className="font-medium text-neutral-900 hover:underline">
                  {c.title}
                </Link>
                <p className="text-xs text-neutral-500">
                  {c.price ? `£${c.price.toString()}` : "Free"}
                  {!c.isPublished ? " · Draft" : ""} · {c._count.items} item{c._count.items === 1 ? "" : "s"} ·{" "}
                  {c._count.purchases} purchase{c._count.purchases === 1 ? "" : "s"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewCourseForm />
    </div>
  );
}
