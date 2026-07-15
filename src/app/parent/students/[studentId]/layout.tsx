import { notFound } from "next/navigation";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { prisma } from "@/lib/db";
import { ParentChrome } from "./parent-chrome";

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
    <ParentChrome
      studentId={studentId}
      studentName={student.name}
      viewerType={context.viewerType}
      canSeeLedger={context.canSeeLedger}
    >
      {children}
    </ParentChrome>
  );
}
