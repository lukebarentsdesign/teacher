"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createParentSession } from "@/lib/parent-session";

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

  const payer = await prisma.payer.findUnique({ where: { accessCode: parsed.data.code } });
  if (!payer) return "That code wasn't recognised — check with your teacher.";

  await createParentSession(payer.id);
  redirect("/parent/contract");
}
