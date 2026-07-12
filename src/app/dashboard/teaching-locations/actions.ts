"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { teachingLocationSchema } from "@/lib/validations";

export async function createSchoolAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = teachingLocationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    invoicingTarget: formData.get("invoicingTarget"),
    termStart: formData.get("termStart") || undefined,
    termEnd: formData.get("termEnd") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
    locationType: formData.get("locationType") || undefined,
    accessNotes: formData.get("accessNotes") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { termStart, termEnd, ...rest } = parsed.data;

  const location = await prisma.teachingLocation.create({
    data: {
      ...rest,
      termStart: termStart ? new Date(termStart) : undefined,
      termEnd: termEnd ? new Date(termEnd) : undefined,
    },
  });

  revalidatePath("/dashboard/teaching-locations");
  // Straight to the detail page — a location with no TeacherLocationLink yet is invisible to the
  // teacher-scoped locations list, so they need to set up their engagement here right away.
  redirect(`/dashboard/teaching-locations/${location.id}`);
}

/**
 * TeachingLocation is shared reference data, not teacher-owned (see CLAUDE.md's "Multi-tenant"
 * note) — so edit access is gated on the teacher having a TeacherLocationLink to this location,
 * the same ownership check the detail page's own queries use, rather than a teacherId field
 * TeachingLocation doesn't have.
 */
export async function updateSchoolAction(
  locationId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const link = await prisma.teacherLocationLink.findFirst({
    where: { locationId, teacherId: session.user.id },
  });
  if (!link) return "You don't have access to edit this teaching location.";

  const parsed = teachingLocationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    invoicingTarget: formData.get("invoicingTarget"),
    termStart: formData.get("termStart") || undefined,
    termEnd: formData.get("termEnd") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
    locationType: formData.get("locationType") || undefined,
    accessNotes: formData.get("accessNotes") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { termStart, termEnd, termCalendarId, ...rest } = parsed.data;

  // Only accept a term calendar the teacher actually owns; empty selection clears it.
  let resolvedCalendarId: string | null = null;
  if (termCalendarId) {
    const owned = await prisma.termCalendar.findFirst({
      where: { id: termCalendarId, teacherId: session.user.id },
    });
    if (!owned) return "Term calendar not found";
    resolvedCalendarId = owned.id;
  }

  await prisma.teachingLocation.update({
    where: { id: locationId },
    data: {
      ...rest,
      termStart: termStart ? new Date(termStart) : null,
      termEnd: termEnd ? new Date(termEnd) : null,
      termCalendarId: resolvedCalendarId,
    },
  });

  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
  revalidatePath("/dashboard/teaching-locations");
  redirect(`/dashboard/teaching-locations/${locationId}`);
}
