"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const lessonTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  defaultDurationMinutes: z.coerce.number().int().positive("Duration must be greater than 0"),
  defaultFee: z.coerce.number().positive("Fee must be greater than 0"),
  locationIds: z.array(z.string()).optional(),
});

export async function createLessonTypeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = lessonTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    defaultDurationMinutes: formData.get("defaultDurationMinutes"),
    defaultFee: formData.get("defaultFee"),
    locationIds: formData.getAll("locationIds"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.lessonType.findFirst({
    where: { teacherId: session.user.id, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) return `"${parsed.data.name}" already exists.`;

  const ownLocations = parsed.data.locationIds?.length
    ? await prisma.teachingLocation.findMany({
        where: { id: { in: parsed.data.locationIds }, teacherLinks: { some: { teacherId: session.user.id } } },
        select: { id: true },
      })
    : [];

  await prisma.lessonType.create({
    data: {
      teacherId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      defaultDurationMinutes: parsed.data.defaultDurationMinutes,
      defaultFee: parsed.data.defaultFee,
      locations: { connect: ownLocations.map((l) => ({ id: l.id })) },
    },
  });

  revalidatePath("/dashboard/lesson-types");
}

export async function toggleLessonTypeActiveAction(lessonTypeId: string, active: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const lessonType = await prisma.lessonType.findFirst({
    where: { id: lessonTypeId, teacherId: session.user.id },
  });
  if (!lessonType) return;

  await prisma.lessonType.update({ where: { id: lessonTypeId }, data: { active } });
  revalidatePath("/dashboard/lesson-types");
}

const locationPricingSchema = z.object({
  lessonTypeId: z.string().min(1),
  locationId: z.string().min(1),
  fee: z.coerce.number().positive("Fee must be greater than 0"),
});

/** Sets (or overwrites) this LessonType's fee at one specific location — e.g. the same "Flute —
 * Beginner" costs £30 at a music college and £20 taught from home. The teacher sets this directly,
 * already factoring in their own venue cost; nothing derives it automatically from
 * VenueFeeArrangement. */
export async function setLessonTypeLocationPricingAction(
  lessonTypeId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const lessonType = await prisma.lessonType.findFirst({
    where: { id: lessonTypeId, teacherId: session.user.id },
    include: { locations: true },
  });
  if (!lessonType) return "Lesson type not found";

  const locationId = formData.get("locationId") as string;
  if (!lessonType.locations.some((l) => l.id === locationId)) {
    // Also allow when the LessonType is offered everywhere (empty locations set).
    if (lessonType.locations.length > 0) return "Not offered at that location.";
  }

  const parsed = locationPricingSchema.safeParse({
    lessonTypeId,
    locationId,
    fee: formData.get("fee"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.lessonTypeLocationPricing.upsert({
    where: { lessonTypeId_locationId: { lessonTypeId, locationId: parsed.data.locationId } },
    update: { fee: parsed.data.fee },
    create: parsed.data,
  });

  revalidatePath(`/dashboard/lesson-types/${lessonTypeId}`);
}

export async function removeLessonTypeLocationPricingAction(pricingId: string, lessonTypeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const pricing = await prisma.lessonTypeLocationPricing.findFirst({
    where: { id: pricingId, lessonType: { teacherId: session.user.id } },
  });
  if (!pricing) return;

  await prisma.lessonTypeLocationPricing.delete({ where: { id: pricingId } });
  revalidatePath(`/dashboard/lesson-types/${lessonTypeId}`);
}

export async function updateLessonTypeAction(
  lessonTypeId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const lessonType = await prisma.lessonType.findFirst({
    where: { id: lessonTypeId, teacherId: session.user.id },
  });
  if (!lessonType) return "Lesson type not found";

  const parsed = lessonTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    defaultDurationMinutes: formData.get("defaultDurationMinutes"),
    defaultFee: formData.get("defaultFee"),
    locationIds: formData.getAll("locationIds"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const ownLocations = parsed.data.locationIds?.length
    ? await prisma.teachingLocation.findMany({
        where: { id: { in: parsed.data.locationIds }, teacherLinks: { some: { teacherId: session.user.id } } },
        select: { id: true },
      })
    : [];

  await prisma.lessonType.update({
    where: { id: lessonTypeId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      defaultDurationMinutes: parsed.data.defaultDurationMinutes,
      defaultFee: parsed.data.defaultFee,
      locations: { set: ownLocations.map((l) => ({ id: l.id })) },
    },
  });

  revalidatePath(`/dashboard/lesson-types/${lessonTypeId}`);
  revalidatePath("/dashboard/lesson-types");
}
