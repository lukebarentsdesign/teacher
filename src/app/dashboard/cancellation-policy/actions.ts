"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const policySchema = z.object({
  noticeHoursRequired: z.coerce.number().int().min(0),
  lateCancelAction: z.enum(["FULL_CHARGE", "PARTIAL_CHARGE", "CREDIT", "FORFEIT"]),
  noShowAction: z.enum(["FULL_CHARGE", "PARTIAL_CHARGE", "CREDIT", "FORFEIT"]),
  partialChargePercent: z.coerce.number().int().min(1).max(100).optional(),
});

/** locationId null = the teacher's bare/default policy; set = a location-scoped override. */
export async function upsertCancellationPolicyAction(
  locationId: string | null,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  if (locationId) {
    const link = await prisma.teacherLocationLink.findFirst({ where: { locationId, teacherId: session.user.id } });
    if (!link) return "Teaching location not found";
  }

  const parsed = policySchema.safeParse({
    noticeHoursRequired: formData.get("noticeHoursRequired"),
    lateCancelAction: formData.get("lateCancelAction"),
    noShowAction: formData.get("noShowAction"),
    partialChargePercent: formData.get("partialChargePercent") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = locationId
    ? await prisma.cancellationPolicy.findUnique({ where: { locationId } })
    : await prisma.cancellationPolicy.findFirst({ where: { teacherId: session.user.id, locationId: null } });

  if (existing) {
    await prisma.cancellationPolicy.update({ where: { id: existing.id }, data: parsed.data });
  } else {
    await prisma.cancellationPolicy.create({
      data: { teacherId: session.user.id, locationId, ...parsed.data },
    });
  }

  revalidatePath("/dashboard/billing");
  if (locationId) revalidatePath(`/dashboard/teaching-locations/${locationId}`);
}

export async function deleteCancellationPolicyAction(policyId: string, locationId: string | null): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.cancellationPolicy.deleteMany({ where: { id: policyId, teacherId: session.user.id } });

  revalidatePath("/dashboard/billing");
  if (locationId) revalidatePath(`/dashboard/teaching-locations/${locationId}`);
}
