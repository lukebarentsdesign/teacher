"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function assertOwnStudent(studentId: string, teacherId: string) {
  return prisma.student.findFirst({ where: { id: studentId, teacherId } });
}

/**
 * Imports a CurriculumTemplate onto a student as an independent snapshot — copies title/subject
 * and every section's title/description/estimatedLessons at import time. Editing the master
 * template afterwards never touches this copy, same principle as ContractAcceptance.contractSnapshot.
 */
export async function importCurriculumAction(studentId: string, templateId: string): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnStudent(studentId, session.user.id))) return "Student not found";

  const template = await prisma.curriculumTemplate.findFirst({
    where: { id: templateId, teacherId: session.user.id },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!template) return "Template not found";

  await prisma.studentCurriculum.create({
    data: {
      studentId,
      templateId: template.id,
      title: template.title,
      subject: template.subject,
      sections: {
        create: template.sections.map((s) => ({
          order: s.order,
          title: s.title,
          description: s.description,
          estimatedLessons: s.estimatedLessons,
        })),
      },
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

/** Starts a blank plan built from scratch directly on this student (no template). */
export async function createBlankCurriculumAction(
  studentId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnStudent(studentId, session.user.id))) return "Student not found";

  const title = (formData.get("title") as string)?.trim();
  if (!title) return "Title is required";
  const subject = (formData.get("subject") as string)?.trim() || null;

  await prisma.studentCurriculum.create({ data: { studentId, title, subject } });
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function addStudentCurriculumSectionAction(
  studentCurriculumId: string,
  studentId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnStudent(studentId, session.user.id))) return "Student not found";

  const curriculum = await prisma.studentCurriculum.findFirst({ where: { id: studentCurriculumId, studentId } });
  if (!curriculum) return "Curriculum not found";

  const title = (formData.get("title") as string)?.trim();
  if (!title) return "Title is required";
  const description = (formData.get("description") as string)?.trim() || null;

  const count = await prisma.studentCurriculumSection.count({ where: { studentCurriculumId } });

  await prisma.studentCurriculumSection.create({
    data: { studentCurriculumId, order: count, title, description },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

const statusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);

export async function updateSectionStatusAction(
  sectionId: string,
  studentCurriculumId: string,
  studentId: string,
  status: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnStudent(studentId, session.user.id))) return;

  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) return;

  const section = await prisma.studentCurriculumSection.findFirst({
    where: { id: sectionId, studentCurriculumId, studentCurriculum: { studentId } },
  });
  if (!section) return;

  await prisma.studentCurriculumSection.update({
    where: { id: sectionId },
    data: {
      status: parsedStatus.data,
      completedDate: parsedStatus.data === "COMPLETED" ? new Date() : null,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function updateCurriculumStatusAction(
  studentCurriculumId: string,
  studentId: string,
  status: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnStudent(studentId, session.user.id))) return;

  const parsed = z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).safeParse(status);
  if (!parsed.success) return;

  const curriculum = await prisma.studentCurriculum.findFirst({ where: { id: studentCurriculumId, studentId } });
  if (!curriculum) return;

  await prisma.studentCurriculum.update({ where: { id: studentCurriculumId }, data: { status: parsed.data } });
  revalidatePath(`/dashboard/students/${studentId}`);
}

/** Saves a student's own (possibly from-scratch) curriculum plan back as a reusable template. */
export async function saveCurriculumAsTemplateAction(
  studentCurriculumId: string,
  studentId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnStudent(studentId, session.user.id))) return "Student not found";

  const title = (formData.get("title") as string)?.trim();
  if (!title) return "Title is required";

  const curriculum = await prisma.studentCurriculum.findFirst({
    where: { id: studentCurriculumId, studentId },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!curriculum) return "Curriculum not found";

  await prisma.curriculumTemplate.create({
    data: {
      teacherId: session.user.id,
      title,
      subject: curriculum.subject,
      sections: {
        create: curriculum.sections.map((s) => ({
          order: s.order,
          title: s.title,
          description: s.description,
          estimatedLessons: s.estimatedLessons,
        })),
      },
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/curriculum-templates");
}

/** Duplicates a student's curriculum plan directly onto another student — its own independent copy. */
export async function duplicateCurriculumAction(
  studentCurriculumId: string,
  sourceStudentId: string,
  targetStudentId: string
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnStudent(sourceStudentId, session.user.id))) return "Student not found";
  if (!(await assertOwnStudent(targetStudentId, session.user.id))) return "Target student not found";

  const curriculum = await prisma.studentCurriculum.findFirst({
    where: { id: studentCurriculumId, studentId: sourceStudentId },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!curriculum) return "Curriculum not found";

  await prisma.studentCurriculum.create({
    data: {
      studentId: targetStudentId,
      title: curriculum.title,
      subject: curriculum.subject,
      sections: {
        create: curriculum.sections.map((s) => ({
          order: s.order,
          title: s.title,
          description: s.description,
          estimatedLessons: s.estimatedLessons,
        })),
      },
    },
  });

  revalidatePath(`/dashboard/students/${targetStudentId}`);
}

export async function deleteStudentCurriculumAction(studentCurriculumId: string, studentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnStudent(studentId, session.user.id))) return;

  await prisma.studentCurriculum.deleteMany({ where: { id: studentCurriculumId, studentId } });
  revalidatePath(`/dashboard/students/${studentId}`);
}
