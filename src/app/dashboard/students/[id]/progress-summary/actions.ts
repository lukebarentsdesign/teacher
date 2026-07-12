"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmailAsTeacher } from "@/lib/gmail";

/** Best-effort — sends the same summary text to every guardian on file with an email. */
export async function sendProgressSummaryAction(studentId: string, summaryText: string): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    include: { payerLinks: { include: { payer: true } } },
  });
  if (!student) return "Student not found";

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!teacher.gmailConnected) return "Connect Gmail under Billing settings first";

  const emails = student.payerLinks.map((l) => l.payer.email).filter((e): e is string => !!e);
  if (emails.length === 0) return "No guardian email on file";

  let sent = 0;
  for (const email of emails) {
    try {
      await sendEmailAsTeacher(session.user.id, email, `${student.name}'s progress summary`, summaryText);
      sent++;
    } catch {
      // Best-effort — keep sending to the rest.
    }
  }

  if (sent === 0) return "Couldn't send — check your Gmail connection";
}
