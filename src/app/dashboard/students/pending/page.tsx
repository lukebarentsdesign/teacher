import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ReviewButtons } from "./review-buttons";
import { ShareOnboardingLink } from "./share-onboarding-link";

export default async function PendingStudentsPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [pending, lessonTypes, links] = await Promise.all([
    prisma.student.findMany({
      where: { teacherId, status: "PENDING_REVIEW" },
      include: {
        location: true,
        requestedLessonType: true,
        payerLinks: { include: { payer: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lessonType.findMany({ where: { teacherId, active: true }, orderBy: { name: "asc" } }),
    prisma.teacherLocationLink.findMany({ where: { teacherId }, include: { location: true } }),
  ]);

  const locations = Array.from(
    new Map(links.map((l) => [l.location.id, { id: l.location.id, name: l.location.name }])).values()
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/students" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to students
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Pending review</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Self-serve submissions — approve to make them a live enrolment, or decline. Nothing here
          is visible to anyone else until you decide.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Share your onboarding link</h2>
        <ShareOnboardingLink
          teacherId={teacherId}
          locations={locations}
          hasLessonTypes={lessonTypes.length > 0}
        />
      </section>

      <section>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing waiting for review.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((student) => (
              <li key={student.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{student.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {student.requestedLessonType?.name ?? "No lesson type"} ·{" "}
                      {student.location?.name ?? "Home"}
                    </p>
                    {student.payerLinks.length > 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Contact: {student.payerLinks.map((l) => l.payer.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <ReviewButtons studentId={student.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
