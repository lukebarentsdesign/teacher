"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createGuardianSession, createStudentSession } from "@/lib/microsite-session";

const loginSchema = z.object({
  code: z.string().trim().length(6, "Enter the 6-digit code"),
});

export async function parentLoginAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = loginSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid code";
  }

  const code = parsed.data.code;

  const payer = await prisma.payer.findUnique({ where: { accessCode: code } });
  if (payer) {
    await createGuardianSession(payer.id);
    redirect("/parent");
  }

  // A student code only works if independent access is still switched on — a guardian can
  // revoke it without deleting the code row, so check the flag, not just code existence.
  const student = await prisma.student.findUnique({ where: { studentAccessCode: code } });
  if (student && student.hasIndependentAccess) {
    await createStudentSession(student.id);
    redirect("/parent");
  }

  return "That code wasn't recognised — check with your teacher.";
}
