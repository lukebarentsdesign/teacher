"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const createSchema = z.object({
  contactName: z.string().trim().min(1, "Name is required"),
  contactEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().trim().optional(),
  lessonTypeId: z.string().optional(),
  locationId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createWaitlistEntryAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = createSchema.safeParse({
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail") || "",
    contactPhone: formData.get("contactPhone") || undefined,
    lessonTypeId: formData.get("lessonTypeId") || undefined,
    locationId: formData.get("locationId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.timetableWaitlist.create({
    data: {
      teacherId: session.user.id,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      lessonTypeId: parsed.data.lessonTypeId || null,
      locationId: parsed.data.locationId || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/dashboard/waitlist");
}

export async function updateWaitlistStatusAction(entryId: string, status: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const parsed = z.enum(["WAITING", "CONTACTED", "CONVERTED", "CANCELLED"]).safeParse(status);
  if (!parsed.success) return;

  await prisma.timetableWaitlist.updateMany({
    where: { id: entryId, teacherId: session.user.id },
    data: { status: parsed.data },
  });

  revalidatePath("/dashboard/waitlist");
}

export async function deleteWaitlistEntryAction(entryId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.timetableWaitlist.deleteMany({ where: { id: entryId, teacherId: session.user.id } });
  revalidatePath("/dashboard/waitlist");
}
