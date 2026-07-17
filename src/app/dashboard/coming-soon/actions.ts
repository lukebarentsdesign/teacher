"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function submitFeatureFeedbackAction(
  featureKey: string,
  rating: string,
  comment: string
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  if (!["ESSENTIAL", "USEFUL", "NOT_IMPORTANT"].includes(rating)) {
    return "Invalid rating";
  }

  await prisma.comingSoonFeedback.upsert({
    where: {
      teacherId_featureKey: {
        teacherId: session.user.id,
        featureKey,
      },
    },
    update: {
      rating,
      comment: comment || null,
    },
    create: {
      teacherId: session.user.id,
      featureKey,
      rating,
      comment: comment || null,
    },
  });

  revalidatePath("/dashboard/coming-soon");
}
