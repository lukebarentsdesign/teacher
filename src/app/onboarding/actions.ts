"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { deriveArchetype } from "@/lib/onboarding";

export type ArchetypeResult = { outOfScope: true } | { outOfScope: false; archetype: "SOLO" | "GROUP_INDEPENDENT" } | { error: string };

/** Screen 2 — the two archetype questions. Writes the raw answers plus the derived archetype. */
export async function submitArchetypeAction(teachesGroups: boolean, controlsOwnSchedule: boolean): Promise<ArchetypeResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const archetype = deriveArchetype(teachesGroups, controlsOwnSchedule);

  await prisma.teacher.update({
    where: { id: session.user.id },
    data: { teachesGroups, controlsOwnSchedule, archetype: archetype ?? null },
  });

  if (!archetype) return { outOfScope: true };
  return { outOfScope: false, archetype };
}

const lessonTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  defaultDurationMinutes: z.coerce.number().int().positive(),
  defaultFee: z.coerce.number().positive(),
});

/** Screen 3 — "What do you teach?" A single lightweight LessonType, not the full catalog UI. */
export async function createFirstLessonTypeAction(payload: unknown): Promise<{ error?: string; lessonTypeId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = lessonTypeSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const lessonType = await prisma.lessonType.create({
    data: { teacherId: session.user.id, ...parsed.data },
  });

  return { lessonTypeId: lessonType.id };
}

const locationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  locationType: z.enum(["STUDENT_HOME", "TEACHER_BASE", "ONLINE", "SCHOOL", "HIRED_VENUE", "OTHER"]),
});

/** Screen 4 — "Where do you teach?" Creates one TeachingLocation per call (mixed teachers call twice). */
export async function createFirstLocationAction(payload: unknown): Promise<{ error?: string; locationId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = locationSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const location = await prisma.teachingLocation.create({
    data: { name: parsed.data.name, locationType: parsed.data.locationType, invoicingTarget: "PARENT" },
  });

  return { locationId: location.id };
}

/** Screen 6 — land on the dashboard regardless of how much of Screens 3-5 was completed. */
export async function completeOnboardingAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.teacher.update({
    where: { id: session.user.id },
    data: { onboardingCompletedAt: new Date() },
  });
}

const outOfScopeSchema = z.object({
  freeTextAnswer: z.string().trim().min(1, "Tell us a bit about what you're after"),
});

/** Section 1a — the groups + venue-controlled path this product isn't built for. */
export async function submitOutOfScopeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = outOfScopeSchema.safeParse({ freeTextAnswer: formData.get("freeTextAnswer") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });

  await prisma.outOfScopeSignup.create({
    data: { teacherId: teacher.id, email: teacher.email, freeTextAnswer: parsed.data.freeTextAnswer },
  });
}
