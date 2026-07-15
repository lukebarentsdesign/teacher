"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { INVOICING_TARGET_VALUES, LOCATION_TYPE_VALUES } from "@/lib/location-types";

const locationTypeOptionSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60, "Keep labels to 60 characters or fewer"),
  locationType: z.enum(LOCATION_TYPE_VALUES),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

const invoicingTargetOptionSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60, "Keep labels to 60 characters or fewer"),
  invoicingTarget: z.enum(INVOICING_TARGET_VALUES),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createLocationTypeOptionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = locationTypeOptionSchema.safeParse({
    label: formData.get("label"),
    locationType: formData.get("locationType"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.locationTypeOption.findFirst({
    where: { teacherId: session.user.id, label: { equals: parsed.data.label, mode: "insensitive" } },
  });
  if (existing) return `"${parsed.data.label}" already exists.`;

  await prisma.locationTypeOption.create({ data: { teacherId: session.user.id, ...parsed.data } });
  revalidatePath("/dashboard/menu-choices");
  revalidatePath("/dashboard/teaching-locations/new");
}

export async function updateLocationTypeOptionAction(
  optionId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = locationTypeOptionSchema.safeParse({
    label: formData.get("label"),
    locationType: formData.get("locationType"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const option = await prisma.locationTypeOption.findFirst({ where: { id: optionId, teacherId: session.user.id } });
  if (!option) return "Choice not found";

  const duplicate = await prisma.locationTypeOption.findFirst({
    where: { teacherId: session.user.id, id: { not: optionId }, label: { equals: parsed.data.label, mode: "insensitive" } },
  });
  if (duplicate) return `"${parsed.data.label}" already exists.`;

  await prisma.locationTypeOption.update({ where: { id: optionId }, data: parsed.data });
  revalidatePath("/dashboard/menu-choices");
  revalidatePath("/dashboard/teaching-locations");
}

export async function setLocationTypeOptionActiveAction(optionId: string, active: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.locationTypeOption.updateMany({ where: { id: optionId, teacherId: session.user.id }, data: { active } });
  revalidatePath("/dashboard/menu-choices");
  revalidatePath("/dashboard/teaching-locations/new");
}

export async function createInvoicingTargetOptionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = invoicingTargetOptionSchema.safeParse({
    label: formData.get("label"),
    invoicingTarget: formData.get("invoicingTarget"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.invoicingTargetOption.findFirst({
    where: { teacherId: session.user.id, label: { equals: parsed.data.label, mode: "insensitive" } },
  });
  if (existing) return `"${parsed.data.label}" already exists.`;

  await prisma.invoicingTargetOption.create({ data: { teacherId: session.user.id, ...parsed.data } });
  revalidatePath("/dashboard/menu-choices");
  revalidatePath("/dashboard/teaching-locations/new");
}

export async function updateInvoicingTargetOptionAction(
  optionId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = invoicingTargetOptionSchema.safeParse({
    label: formData.get("label"),
    invoicingTarget: formData.get("invoicingTarget"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const option = await prisma.invoicingTargetOption.findFirst({ where: { id: optionId, teacherId: session.user.id } });
  if (!option) return "Choice not found";

  const duplicate = await prisma.invoicingTargetOption.findFirst({
    where: { teacherId: session.user.id, id: { not: optionId }, label: { equals: parsed.data.label, mode: "insensitive" } },
  });
  if (duplicate) return `"${parsed.data.label}" already exists.`;

  await prisma.invoicingTargetOption.update({ where: { id: optionId }, data: parsed.data });
  revalidatePath("/dashboard/menu-choices");
  revalidatePath("/dashboard/teaching-locations");
}

export async function setInvoicingTargetOptionActiveAction(optionId: string, active: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.invoicingTargetOption.updateMany({ where: { id: optionId, teacherId: session.user.id }, data: { active } });
  revalidatePath("/dashboard/menu-choices");
  revalidatePath("/dashboard/teaching-locations/new");
}