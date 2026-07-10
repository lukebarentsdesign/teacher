"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const noteSchema = z.object({
  lessonId: z.string().min(1),
  content: z.string().trim().min(1, "Note can't be empty"),
});

export async function saveLessonNoteAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = noteSchema.safeParse({
    lessonId: formData.get("lessonId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: parsed.data.lessonId, teacherId: session.user.id },
  });
  if (!lesson) return "Lesson not found";

  await prisma.lessonNote.upsert({
    where: { lessonId: parsed.data.lessonId },
    update: { content: parsed.data.content },
    create: { lessonId: parsed.data.lessonId, content: parsed.data.content },
  });

  revalidatePath(`/dashboard/lessons/${parsed.data.lessonId}`);
  revalidatePath("/dashboard/lessons");
}
