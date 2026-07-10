import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";

export type StudentViewContext = {
  studentId: string;
  viewerType: "guardian" | "student";
  /** Guardian visibility is always full; a student viewer depends on Student.shareBalanceWithStudent. */
  canSeeLedger: boolean;
};

/**
 * The one access-control choke point for every /parent/students/[studentId]/* page. Returns null
 * if the current microsite session isn't allowed to view this student at all — callers should
 * redirect/404 in that case, never render partial data.
 */
export async function getAuthorizedStudentView(studentId: string): Promise<StudentViewContext | null> {
  const session = await getMicrositeSession();
  if (!session) return null;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  if (session.type === "student") {
    if (session.studentId !== studentId) return null;
    return { studentId, viewerType: "student", canSeeLedger: student.shareBalanceWithStudent };
  }

  const link = await prisma.studentPayerLink.findFirst({
    where: { studentId, payerId: session.payerId },
  });
  if (!link) return null;

  return { studentId, viewerType: "guardian", canSeeLedger: true };
}
