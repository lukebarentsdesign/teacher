"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

async function assertOwnTemplate(templateId: string, teacherId: string) {
  return prisma.curriculumTemplate.findFirst({ where: { id: templateId, teacherId } });
}

const createTemplateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  subject: z.string().trim().optional(),
  description: z.string().trim().optional(),
  lessonTypeId: z.string().optional(),
});

export async function createCurriculumTemplateAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "CURRICULUM"))) {
    return "The Curriculum & content module isn't enabled on this account";
  }

  const parsed = createTemplateSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject") || undefined,
    description: formData.get("description") || undefined,
    lessonTypeId: formData.get("lessonTypeId") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  if (parsed.data.lessonTypeId) {
    const lessonType = await prisma.lessonType.findFirst({
      where: { id: parsed.data.lessonTypeId, teacherId: session.user.id },
    });
    if (!lessonType) return "Lesson type not found";
  }

  const template = await prisma.curriculumTemplate.create({
    data: {
      teacherId: session.user.id,
      title: parsed.data.title,
      subject: parsed.data.subject || null,
      description: parsed.data.description || null,
      lessonTypeId: parsed.data.lessonTypeId || null,
    },
  });

  revalidatePath("/dashboard/curriculum-templates");
  redirect(`/dashboard/curriculum-templates/${template.id}`);
}

export async function deleteCurriculumTemplateAction(templateId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnTemplate(templateId, session.user.id))) return;

  await prisma.curriculumTemplate.delete({ where: { id: templateId } });
  revalidatePath("/dashboard/curriculum-templates");
}

export async function togglePublishTemplateAction(templateId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const template = await assertOwnTemplate(templateId, session.user.id);
  if (!template) return;

  await prisma.curriculumTemplate.update({
    where: { id: templateId },
    data: { isPublished: !template.isPublished },
  });
  revalidatePath(`/dashboard/curriculum-templates/${templateId}`);
}

const sectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  estimatedLessons: z.coerce.number().int().positive().optional(),
});

export async function addTemplateSectionAction(
  templateId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "CURRICULUM"))) {
    return "The Curriculum & content module isn't enabled on this account";
  }
  if (!(await assertOwnTemplate(templateId, session.user.id))) return "Template not found";

  const parsed = sectionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    estimatedLessons: formData.get("estimatedLessons") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const count = await prisma.curriculumSection.count({ where: { templateId } });

  await prisma.curriculumSection.create({
    data: {
      templateId,
      order: count,
      title: parsed.data.title,
      description: parsed.data.description || null,
      estimatedLessons: parsed.data.estimatedLessons ?? null,
    },
  });

  revalidatePath(`/dashboard/curriculum-templates/${templateId}`);
}

export async function deleteTemplateSectionAction(sectionId: string, templateId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnTemplate(templateId, session.user.id))) return;

  await prisma.curriculumSection.deleteMany({ where: { id: sectionId, templateId } });
  revalidatePath(`/dashboard/curriculum-templates/${templateId}`);
}
