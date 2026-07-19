"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

const createSchema = z.object({
  label: z.string().trim().min(1, "Give this embed a name"),
  locationId: z.string().optional(),
  brandColor: z.string().trim().optional(),
  lessonTypeIds: z.array(z.string()).optional(),
});

export async function createEmbedConfigAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "EMBEDS"))) {
    return "The Embeds & booking widget module isn't enabled on this account";
  }

  const parsed = createSchema.safeParse({
    label: formData.get("label"),
    locationId: formData.get("locationId") || undefined,
    brandColor: formData.get("brandColor") || undefined,
    lessonTypeIds: formData.getAll("lessonTypeIds").map(String),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  if (parsed.data.locationId) {
    const link = await prisma.teacherLocationLink.findFirst({
      where: { locationId: parsed.data.locationId, teacherId: session.user.id },
    });
    if (!link) return "Teaching location not found";
  }

  await prisma.embedConfig.create({
    data: {
      teacherId: session.user.id,
      label: parsed.data.label,
      locationId: parsed.data.locationId || null,
      brandColor: parsed.data.brandColor || null,
      embedToken: crypto.randomUUID().replace(/-/g, ""),
      allowedLessonTypes:
        parsed.data.lessonTypeIds && parsed.data.lessonTypeIds.length > 0
          ? { connect: parsed.data.lessonTypeIds.map((id) => ({ id })) }
          : undefined,
    },
  });

  revalidatePath("/dashboard/embeds");
}

export async function deleteEmbedConfigAction(embedConfigId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.embedConfig.deleteMany({ where: { id: embedConfigId, teacherId: session.user.id } });
  revalidatePath("/dashboard/embeds");
}
