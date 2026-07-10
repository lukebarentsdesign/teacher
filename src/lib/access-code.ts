import { prisma } from "@/lib/db";

/**
 * Generates a unique 6-digit microsite access code, retrying on collision. Guardian
 * (Payer.accessCode) and student (Student.studentAccessCode) codes share one flat namespace —
 * the login screen accepts either kind without knowing in advance which one it is — so a new
 * code must be checked against both tables, not just the one it'll be assigned to.
 */
export async function generateUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const [existingPayer, existingStudent] = await Promise.all([
      prisma.payer.findUnique({ where: { accessCode: code } }),
      prisma.student.findUnique({ where: { studentAccessCode: code } }),
    ]);
    if (!existingPayer && !existingStudent) return code;
  }
  throw new Error("Could not generate a unique access code after 10 attempts");
}
