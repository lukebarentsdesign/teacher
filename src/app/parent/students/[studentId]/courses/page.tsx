import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { BuyCourseButton } from "./buy-course-button";

const MEDIA_LABEL: Record<string, string> = { VIDEO: "Video", AUDIO: "Audio", DOCUMENT: "Document" };

export default async function StudentCoursesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  // Courses are purchased per-Payer, not per-Student (a guardian may pay for several students) —
  // a 16+ student's independent login has no Payer row, so there's nothing to look up for them.
  if (!context.payerId) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Courses</h1>
        <p className="text-sm text-neutral-500">Ask your guardian to view purchased courses.</p>
      </div>
    );
  }

  const purchases = await prisma.coursePurchase.findMany({
    where: { payerId: context.payerId },
    include: { course: { include: { items: { orderBy: { order: "asc" } } } } },
    orderBy: { purchasedAt: "desc" },
  });
  const purchasedCourseIds = new Set(purchases.map((p) => p.courseId));

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const availableCourses = await prisma.course.findMany({
    where: {
      teacherId: student.teacherId,
      isPublished: true,
      price: { not: null },
      id: { notIn: [...purchasedCourseIds] },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Courses</h1>
      <p className="mb-6 text-sm text-neutral-500">Video/audio/document content you&apos;ve purchased.</p>
      {purchases.length === 0 ? (
        <p className="text-sm text-neutral-500">No courses purchased yet.</p>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">{purchase.course.title}</p>
              {purchase.course.description && (
                <p className="mt-1 text-sm text-neutral-600">{purchase.course.description}</p>
              )}
              <ul className="mt-3 space-y-1.5">
                {purchase.course.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700">{item.title}</span>
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700"
                    >
                      Open {MEDIA_LABEL[item.mediaType]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {availableCourses.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Available to buy</h2>
          <div className="space-y-3">
            {availableCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{course.title}</p>
                  {course.description && <p className="mt-1 text-sm text-neutral-600">{course.description}</p>}
                </div>
                <BuyCourseButton studentId={studentId} courseId={course.id} price={course.price!.toString()} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
