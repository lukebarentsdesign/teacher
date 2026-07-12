import { notFound } from "next/navigation";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { prisma } from "@/lib/db";
import { micrositeSignOutAction } from "@/app/parent/actions";
import { MicrositeTabs } from "./microsite-tabs";

const TAB_LABELS: { segment: string; label: string }[] = [
  { segment: "", label: "Overview" },
  { segment: "calendar", label: "Calendar" },
  { segment: "ledger", label: "Ledger" },
  { segment: "resources", label: "Resources" },
  { segment: "extras", label: "Extras" },
  { segment: "courses", label: "Courses" },
  { segment: "assignments", label: "Assignments" },
  { segment: "maintenance", label: "Maintenance" },
  { segment: "notes", label: "Lesson notes" },
];

export default async function StudentMicrositeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div>
            <p className="font-semibold text-neutral-900">{student.name}</p>
            <p className="text-xs text-neutral-500">
              Viewing as {context.viewerType === "guardian" ? "guardian" : "student"}
            </p>
          </div>
          <form action={micrositeSignOutAction}>
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900">
              Sign out
            </button>
          </form>
        </div>
        <MicrositeTabs studentId={studentId} tabs={TAB_LABELS} />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
