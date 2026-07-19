"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { availabilityArraySchema, protectedBlocksArraySchema } from "@/lib/schedule-json";
import { roomSchema, groupClassSchema } from "@/lib/validations";
import { hasModule } from "@/lib/modules";
import { z } from "zod";

const createLinkSchema = z.object({
  locationId: z.string().min(1),
  schedulingMode: z.enum(["FIXED", "FLUID"]),
  taxHandling: z.enum(["SELF_EMPLOYED", "PAYE_VIA_SCHOOL"]),
  availability: z.string().min(1),
  protectedBlocks: z.string().optional(),
});

export async function createTeacherSchoolLinkAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = createLinkSchema.safeParse({
    locationId: formData.get("locationId"),
    schedulingMode: formData.get("schedulingMode"),
    taxHandling: formData.get("taxHandling"),
    availability: formData.get("availability"),
    protectedBlocks: formData.get("protectedBlocks") || "[]",
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  let availability, protectedBlocks;
  try {
    availability = availabilityArraySchema.parse(JSON.parse(parsed.data.availability));
    protectedBlocks = protectedBlocksArraySchema.parse(JSON.parse(parsed.data.protectedBlocks ?? "[]"));
  } catch {
    return "At least one availability row is required, and rows must have a day, start and end time.";
  }

  if (availability.length === 0) {
    return "At least one availability row is required.";
  }

  await prisma.teacherLocationLink.create({
    data: {
      teacherId: session.user.id,
      locationId: parsed.data.locationId,
      schedulingMode: parsed.data.schedulingMode,
      taxHandling: parsed.data.taxHandling,
      availability,
      protectedBlocks,
    },
  });

  revalidatePath(`/dashboard/teaching-locations/${parsed.data.locationId}`);
}

/** Room/GroupClass are scoped to a TeachingLocation the teacher has a TeacherLocationLink to —
 * TeachingLocation itself is shared reference data (per CLAUDE.md), so ownership is verified via
 * the link, not the TeachingLocation row. */
async function assertLinkedToSchool(locationId: string, teacherId: string) {
  return prisma.teacherLocationLink.findFirst({ where: { locationId, teacherId } });
}

export async function createRoomAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const locationId = formData.get("locationId") as string;
  if (!(await assertLinkedToSchool(locationId, session.user.id))) return "Teaching location not found";

  let openHours: unknown[] = [];
  try {
    openHours = JSON.parse((formData.get("openHours") as string) || "[]");
  } catch {
    return "Invalid open hours data";
  }

  const parsed = roomSchema.safeParse({
    locationId,
    label: formData.get("label"),
    hasPiano: formData.get("hasPiano") === "true",
    hasMirrors: formData.get("hasMirrors") === "true",
    floor: formData.get("floor") || undefined,
    openHours,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.room.create({
    data: {
      locationId: parsed.data.locationId,
      label: parsed.data.label,
      features: { hasPiano: !!parsed.data.hasPiano, hasMirrors: !!parsed.data.hasMirrors, floor: parsed.data.floor ?? null },
      openHours: parsed.data.openHours ?? [],
    },
  });

  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
}

export async function updateRoomAction(
  roomId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || !(await assertLinkedToSchool(room.locationId, session.user.id))) return "Room not found";

  let openHours: unknown[] = [];
  try {
    openHours = JSON.parse((formData.get("openHours") as string) || "[]");
  } catch {
    return "Invalid open hours data";
  }

  const parsed = roomSchema.safeParse({
    locationId: room.locationId,
    label: formData.get("label"),
    hasPiano: formData.get("hasPiano") === "true",
    hasMirrors: formData.get("hasMirrors") === "true",
    floor: formData.get("floor") || undefined,
    openHours,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.room.update({
    where: { id: roomId },
    data: {
      label: parsed.data.label,
      features: { hasPiano: !!parsed.data.hasPiano, hasMirrors: !!parsed.data.hasMirrors, floor: parsed.data.floor ?? null },
      openHours: parsed.data.openHours ?? [],
    },
  });

  revalidatePath(`/dashboard/teaching-locations/${room.locationId}`);
  redirect(`/dashboard/teaching-locations/${room.locationId}`);
}

export async function createGroupClassAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "GROUP_TEACHING"))) {
    return "The Group teaching module isn't enabled on this account";
  }

  const locationId = formData.get("locationId") as string;
  if (!(await assertLinkedToSchool(locationId, session.user.id))) return "Teaching location not found";

  const roomId = (formData.get("roomId") as string) || undefined;
  if (roomId) {
    const room = await prisma.room.findFirst({ where: { id: roomId, locationId } });
    if (!room) return "Room not found";
  }

  const subjectId = (formData.get("subjectId") as string) || undefined;
  if (subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, teacherId: session.user.id } });
    if (!subject) return "Subject not found";
  }

  const parsed = groupClassSchema.safeParse({
    locationId,
    name: formData.get("name"),
    discipline: formData.get("discipline"),
    roomId,
    subjectId,
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.groupClass.create({
    data: {
      teacherId: session.user.id,
      locationId: parsed.data.locationId,
      roomId: parsed.data.roomId,
      subjectId: parsed.data.subjectId,
      name: parsed.data.name,
      discipline: parsed.data.discipline,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      capacity: parsed.data.capacity ?? null,
    },
  });

  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
}

export async function updateGroupClassAction(
  groupClassId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const groupClass = await prisma.groupClass.findFirst({
    where: { id: groupClassId, teacherId: session.user.id },
  });
  if (!groupClass) return "Group class not found";

  const roomId = (formData.get("roomId") as string) || undefined;
  if (roomId) {
    const room = await prisma.room.findFirst({ where: { id: roomId, locationId: groupClass.locationId } });
    if (!room) return "Room not found";
  }

  const subjectId = (formData.get("subjectId") as string) || undefined;
  if (subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, teacherId: session.user.id } });
    if (!subject) return "Subject not found";
  }

  const parsed = groupClassSchema.safeParse({
    locationId: groupClass.locationId,
    name: formData.get("name"),
    discipline: formData.get("discipline"),
    roomId,
    subjectId,
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.groupClass.update({
    where: { id: groupClassId },
    data: {
      roomId: parsed.data.roomId ?? null,
      subjectId: parsed.data.subjectId ?? null,
      name: parsed.data.name,
      discipline: parsed.data.discipline,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      capacity: parsed.data.capacity ?? null,
    },
  });

  revalidatePath(`/dashboard/group-classes/${groupClassId}`);
  revalidatePath(`/dashboard/teaching-locations/${groupClass.locationId}`);
  redirect(`/dashboard/group-classes/${groupClassId}`);
}

const venueFeeArrangementSchema = z.object({
  locationId: z.string().min(1),
  feeType: z.enum(["FLAT_PER_SESSION", "PERCENT_OF_LESSON_FEE", "PERIOD_RENTAL"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  billingMode: z.enum(["ABSORBED_INTO_FEE", "ITEMISED_TO_PAYER"]),
  notes: z.string().optional(),
});

export async function createVenueFeeArrangementAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const locationId = formData.get("locationId") as string;
  if (!(await assertLinkedToSchool(locationId, session.user.id))) return "Teaching location not found";

  const parsed = venueFeeArrangementSchema.safeParse({
    locationId,
    feeType: formData.get("feeType"),
    amount: formData.get("amount"),
    billingMode: formData.get("billingMode"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.venueFeeArrangement.create({ data: parsed.data });

  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
}

export async function deleteVenueFeeArrangementAction(arrangementId: string, locationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertLinkedToSchool(locationId, session.user.id))) return;

  const arrangement = await prisma.venueFeeArrangement.findFirst({
    where: { id: arrangementId, locationId },
  });
  if (!arrangement) return;

  await prisma.venueFeeArrangement.delete({ where: { id: arrangementId } });
  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
}
