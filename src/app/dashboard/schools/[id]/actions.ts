"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { availabilityArraySchema, protectedBlocksArraySchema } from "@/lib/schedule-json";
import { roomSchema, groupClassSchema } from "@/lib/validations";
import { z } from "zod";

const createLinkSchema = z.object({
  schoolId: z.string().min(1),
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
    schoolId: formData.get("schoolId"),
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

  await prisma.teacherSchoolLink.create({
    data: {
      teacherId: session.user.id,
      schoolId: parsed.data.schoolId,
      schedulingMode: parsed.data.schedulingMode,
      taxHandling: parsed.data.taxHandling,
      availability,
      protectedBlocks,
    },
  });

  revalidatePath(`/dashboard/schools/${parsed.data.schoolId}`);
}

/** Room/GroupClass are scoped to a School the teacher has a TeacherSchoolLink to — School itself
 * is shared reference data (per CLAUDE.md), so ownership is verified via the link, not the School row. */
async function assertLinkedToSchool(schoolId: string, teacherId: string) {
  return prisma.teacherSchoolLink.findFirst({ where: { schoolId, teacherId } });
}

export async function createRoomAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const schoolId = formData.get("schoolId") as string;
  if (!(await assertLinkedToSchool(schoolId, session.user.id))) return "School not found";

  let openHours: unknown[] = [];
  try {
    openHours = JSON.parse((formData.get("openHours") as string) || "[]");
  } catch {
    return "Invalid open hours data";
  }

  const parsed = roomSchema.safeParse({
    schoolId,
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
      schoolId: parsed.data.schoolId,
      label: parsed.data.label,
      features: { hasPiano: !!parsed.data.hasPiano, hasMirrors: !!parsed.data.hasMirrors, floor: parsed.data.floor ?? null },
      openHours: parsed.data.openHours ?? [],
    },
  });

  revalidatePath(`/dashboard/schools/${schoolId}`);
}

export async function createGroupClassAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const schoolId = formData.get("schoolId") as string;
  if (!(await assertLinkedToSchool(schoolId, session.user.id))) return "School not found";

  const roomId = (formData.get("roomId") as string) || undefined;
  if (roomId) {
    const room = await prisma.room.findFirst({ where: { id: roomId, schoolId } });
    if (!room) return "Room not found";
  }

  const parsed = groupClassSchema.safeParse({
    schoolId,
    name: formData.get("name"),
    discipline: formData.get("discipline"),
    roomId,
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  await prisma.groupClass.create({
    data: {
      teacherId: session.user.id,
      schoolId: parsed.data.schoolId,
      roomId: parsed.data.roomId,
      name: parsed.data.name,
      discipline: parsed.data.discipline,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  });

  revalidatePath(`/dashboard/schools/${schoolId}`);
}
