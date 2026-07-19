"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

const planFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
});

async function assertOwnLesson(lessonId: string, teacherId: string) {
  return prisma.lesson.findFirst({ where: { id: lessonId, teacherId } });
}

async function assertOwnGroupClass(groupClassId: string, teacherId: string) {
  return prisma.groupClass.findFirst({ where: { id: groupClassId, teacherId } });
}

async function assertOwnSessionPlan(sessionPlanId: string, teacherId: string) {
  return prisma.sessionPlan.findFirst({
    where: {
      id: sessionPlanId,
      OR: [{ lesson: { teacherId } }, { groupClass: { teacherId } }],
    },
  });
}

/** A Lesson has at most one SessionPlan (1:1) — create it on first save, edit in place after.
 * Only the CREATE branch is module-gated; editing an already-existing plan never is. */
export async function upsertLessonSessionPlanAction(
  lessonId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnLesson(lessonId, session.user.id))) return "Lesson not found";

  const parsed = planFieldsSchema.safeParse({ title: formData.get("title"), content: formData.get("content") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.sessionPlan.findUnique({ where: { lessonId } });
  if (existing) {
    await prisma.sessionPlan.update({ where: { id: existing.id }, data: parsed.data });
  } else {
    if (!(await hasModule(session.user.id, "GROUP_TEACHING"))) {
      return "The Group teaching module isn't enabled on this account";
    }
    await prisma.sessionPlan.create({
      data: { ...parsed.data, lessonId, createdBy: session.user.id },
    });
  }

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

/**
 * GroupClass has no dated per-occurrence row, so unlike a Lesson it can accumulate several plans
 * over time (one per week's session) — each save here always creates a new row, the most recent
 * of which is shown as "current" wherever a group class's plan is displayed.
 */
export async function createGroupClassSessionPlanAction(
  groupClassId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "GROUP_TEACHING"))) {
    return "The Group teaching module isn't enabled on this account";
  }
  if (!(await assertOwnGroupClass(groupClassId, session.user.id))) return "Group class not found";

  const parsed = planFieldsSchema.safeParse({ title: formData.get("title"), content: formData.get("content") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.sessionPlan.create({
    data: { ...parsed.data, groupClassId, createdBy: session.user.id },
  });

  revalidatePath(`/dashboard/group-classes/${groupClassId}`);
}

export async function updateSessionPlanAction(
  sessionPlanId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  const plan = await assertOwnSessionPlan(sessionPlanId, session.user.id);
  if (!plan) return "Session plan not found";

  const parsed = planFieldsSchema.safeParse({ title: formData.get("title"), content: formData.get("content") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.sessionPlan.update({ where: { id: sessionPlanId }, data: parsed.data });

  revalidatePath(plan.lessonId ? `/dashboard/lessons/${plan.lessonId}` : `/dashboard/group-classes/${plan.groupClassId}`);
}

export async function togglePublishSessionPlanAction(sessionPlanId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const plan = await assertOwnSessionPlan(sessionPlanId, session.user.id);
  if (!plan) return;

  await prisma.sessionPlan.update({
    where: { id: sessionPlanId },
    data: { publishedAt: plan.publishedAt ? null : new Date() },
  });

  revalidatePath(plan.lessonId ? `/dashboard/lessons/${plan.lessonId}` : `/dashboard/group-classes/${plan.groupClassId}`);
}

export async function deleteSessionPlanAction(sessionPlanId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const plan = await assertOwnSessionPlan(sessionPlanId, session.user.id);
  if (!plan) return;

  await prisma.sessionPlan.delete({ where: { id: sessionPlanId } });

  revalidatePath(plan.lessonId ? `/dashboard/lessons/${plan.lessonId}` : `/dashboard/group-classes/${plan.groupClassId}`);
}

export async function saveSessionPlanAsTemplateAction(
  sessionPlanId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "GROUP_TEACHING"))) {
    return "The Group teaching module isn't enabled on this account";
  }
  const plan = await assertOwnSessionPlan(sessionPlanId, session.user.id);
  if (!plan) return "Session plan not found";

  const title = (formData.get("title") as string)?.trim();
  if (!title) return "Title is required";

  await prisma.sessionPlanTemplate.create({
    data: { teacherId: session.user.id, title, content: plan.content },
  });

  revalidatePath(plan.lessonId ? `/dashboard/lessons/${plan.lessonId}` : `/dashboard/group-classes/${plan.groupClassId}`);
}

/** Generates (or returns the existing) unguessable display token for a location's public Now/Next screen. */
export async function generateDisplayTokenAction(locationId: string): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return undefined;

  const link = await prisma.teacherLocationLink.findFirst({
    where: { locationId, teacherId: session.user.id },
  });
  if (!link) return undefined;

  const location = await prisma.teachingLocation.findUnique({ where: { id: locationId } });
  if (!location) return undefined;
  if (location.displayToken) return location.displayToken;

  const token = crypto.randomUUID().replace(/-/g, "");
  await prisma.teachingLocation.update({ where: { id: locationId }, data: { displayToken: token } });

  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
  return token;
}
