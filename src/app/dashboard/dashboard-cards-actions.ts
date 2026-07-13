"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type { DismissedCards } from "@/lib/onboarding";

export async function dismissCardAction(cardId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  const dismissed = (teacher.dismissedCards as DismissedCards) ?? {};
  dismissed[cardId] = new Date().toISOString();

  await prisma.teacher.update({
    where: { id: session.user.id },
    data: { dismissedCards: dismissed },
  });

  revalidatePath("/dashboard");
}
