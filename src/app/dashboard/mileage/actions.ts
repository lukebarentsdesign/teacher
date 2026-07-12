"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const mileageSchema = z.object({
  date: z.string().min(1, "Date is required"),
  miles: z.coerce.number().positive("Miles must be more than 0"),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  purpose: z.string().trim().optional(),
});

export async function createMileageLogAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = mileageSchema.safeParse({
    date: formData.get("date"),
    miles: formData.get("miles"),
    fromLocationId: formData.get("fromLocationId") || undefined,
    toLocationId: formData.get("toLocationId") || undefined,
    purpose: formData.get("purpose") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.mileageLog.create({
    data: {
      teacherId: session.user.id,
      date: new Date(parsed.data.date),
      miles: parsed.data.miles,
      fromLocationId: parsed.data.fromLocationId || null,
      toLocationId: parsed.data.toLocationId || null,
      purpose: parsed.data.purpose || null,
    },
  });

  revalidatePath("/dashboard/mileage");
}

export async function deleteMileageLogAction(mileageLogId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.mileageLog.deleteMany({ where: { id: mileageLogId, teacherId: session.user.id } });
  revalidatePath("/dashboard/mileage");
}
