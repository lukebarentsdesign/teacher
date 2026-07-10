"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getCurrentContract } from "@/lib/contracts";

const saveContractSchema = z.object({
  content: z.string().trim().min(1, "Contract text can't be empty"),
});

export async function saveContractAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = saveContractSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const current = await getCurrentContract(session.user.id);

  // No-op if the text is unchanged — don't force every payer to re-accept over a no-op save.
  if (current && current.content === parsed.data.content) {
    return;
  }

  await prisma.contract.create({
    data: {
      teacherId: session.user.id,
      version: (current?.version ?? 0) + 1,
      content: parsed.data.content,
    },
  });

  revalidatePath("/dashboard/contract");
}
