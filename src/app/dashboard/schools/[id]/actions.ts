"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { availabilityArraySchema, protectedBlocksArraySchema } from "@/lib/schedule-json";
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
