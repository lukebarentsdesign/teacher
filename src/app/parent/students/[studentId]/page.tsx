import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { school: true },
  });

  const [upcomingLessonCount, openAssignmentCount] = await Promise.all([
    prisma.lesson.count({
      where: { studentId, scheduledAt: { gte: new Date() }, status: "HELD" },
    }),
    prisma.assignment.count({ where: { studentId, status: "ASSIGNED" } }),
  ]);

  const links = [
    { href: "calendar", label: "Calendar", detail: `${upcomingLessonCount} upcoming lesson${upcomingLessonCount === 1 ? "" : "s"}` },
    ...(context.canSeeLedger
      ? [{ href: "ledger", label: "Ledger", detail: "Balance & payment history" }]
      : []),
    { href: "resources", label: "Resources", detail: "Shared library" },
    { href: "assignments", label: "Assignments", detail: `${openAssignmentCount} to review` },
    { href: "maintenance", label: "Maintenance", detail: "Equipment reminders" },
    { href: "notes", label: "Lesson notes", detail: "What was covered each lesson" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{student.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {student.discipline} · {student.school?.name ?? "Home student"}
        </p>
      </div>

      {!context.canSeeLedger && context.viewerType === "student" && (
        <p className="rounded-lg bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
          Your guardian hasn&apos;t shared the financial ledger with you.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={`/parent/students/${studentId}/${link.href}`}
            className="rounded-xl bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md"
          >
            <p className="font-medium text-neutral-900">{link.label}</p>
            <p className="mt-1 text-sm text-neutral-500">{link.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
