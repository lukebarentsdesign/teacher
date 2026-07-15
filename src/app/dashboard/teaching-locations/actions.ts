"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  BUILT_IN_INVOICING_TARGET_OPTIONS,
  INVOICING_TARGET_VALUES,
  LOCATION_TYPE_VALUES,
  type InvoicingTargetValue,
  type LocationTypeValue,
} from "@/lib/location-types";
import {
  findActiveInvoicingTargetOption,
  findActiveLocationTypeOption,
  supportsMenuChoiceDelegates,
} from "@/lib/menu-choice-options";
import { teachingLocationSchema } from "@/lib/validations";

async function resolveLocationTypeSelection(teacherId: string, selection: FormDataEntryValue | null) {
  const value = typeof selection === "string" && selection ? selection : "SCHOOL";

  if ((LOCATION_TYPE_VALUES as readonly string[]).includes(value)) {
    return { locationType: value as LocationTypeValue, customLocationType: null };
  }

  if (value.startsWith("custom:")) {
    const optionId = value.slice("custom:".length);
    const option = await findActiveLocationTypeOption(teacherId, optionId);
    if (!option) return null;
    return { locationType: option.locationType, customLocationType: option.label };
  }

  if (value.startsWith("current:")) {
    const [, rawType, rawLabel] = value.split(":");
    if (!(LOCATION_TYPE_VALUES as readonly string[]).includes(rawType) || !rawLabel) return null;
    return {
      locationType: rawType as LocationTypeValue,
      customLocationType: decodeURIComponent(rawLabel).trim() || null,
    };
  }

  return null;
}

async function resolveInvoicingTargetSelection(teacherId: string, selection: FormDataEntryValue | null) {
  const value = typeof selection === "string" && selection ? selection : "PARENT";

  if ((INVOICING_TARGET_VALUES as readonly string[]).includes(value)) {
    return { invoicingTarget: value as InvoicingTargetValue, customInvoicingTarget: null };
  }

  const builtIn = BUILT_IN_INVOICING_TARGET_OPTIONS.find((option) => option.value === value);
  if (builtIn) {
    return { invoicingTarget: builtIn.invoicingTarget, customInvoicingTarget: builtIn.label };
  }

  if (value.startsWith("custom:")) {
    const optionId = value.slice("custom:".length);
    const option = await findActiveInvoicingTargetOption(teacherId, optionId);
    if (!option) return null;
    return { invoicingTarget: option.invoicingTarget, customInvoicingTarget: option.label };
  }

  if (value.startsWith("current:")) {
    const [, rawTarget, rawLabel] = value.split(":");
    if (!(INVOICING_TARGET_VALUES as readonly string[]).includes(rawTarget) || !rawLabel) return null;
    return {
      invoicingTarget: rawTarget as InvoicingTargetValue,
      customInvoicingTarget: decodeURIComponent(rawLabel).trim() || null,
    };
  }

  return null;
}

function customChoiceData(
  resolvedLocationType: { customLocationType: string | null },
  resolvedInvoicingTarget: { customInvoicingTarget: string | null }
) {
  if (!supportsMenuChoiceDelegates()) return {};
  return {
    customLocationType: resolvedLocationType.customLocationType,
    customInvoicingTarget: resolvedInvoicingTarget.customInvoicingTarget,
  };
}

export async function createSchoolAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const resolvedLocationType = await resolveLocationTypeSelection(session.user.id, formData.get("locationType"));
  if (!resolvedLocationType) return "Choose a valid location type";

  const resolvedInvoicingTarget = await resolveInvoicingTargetSelection(session.user.id, formData.get("invoicingTarget"));
  if (!resolvedInvoicingTarget) return "Choose a valid billing option";

  const parsed = teachingLocationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    invoicingTarget: resolvedInvoicingTarget.invoicingTarget,
    termStart: formData.get("termStart") || undefined,
    termEnd: formData.get("termEnd") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
    locationType: resolvedLocationType.locationType,
    accessNotes: formData.get("accessNotes") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { termStart, termEnd, ...rest } = parsed.data;

  const location = await prisma.teachingLocation.create({
    data: {
      ...rest,
      ...customChoiceData(resolvedLocationType, resolvedInvoicingTarget),
      termStart: termStart ? new Date(termStart) : undefined,
      termEnd: termEnd ? new Date(termEnd) : undefined,
    },
  });

  revalidatePath("/dashboard/teaching-locations");
  redirect(`/dashboard/teaching-locations/${location.id}`);
}

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

  const resolvedLocationType = await resolveLocationTypeSelection(session.user.id, formData.get("locationType"));
  if (!resolvedLocationType) return "Choose a valid location type";

  const resolvedInvoicingTarget = await resolveInvoicingTargetSelection(session.user.id, formData.get("invoicingTarget"));
  if (!resolvedInvoicingTarget) return "Choose a valid billing option";

  const parsed = teachingLocationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    invoicingTarget: resolvedInvoicingTarget.invoicingTarget,
    termStart: formData.get("termStart") || undefined,
    termEnd: formData.get("termEnd") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
    locationType: resolvedLocationType.locationType,
    accessNotes: formData.get("accessNotes") || undefined,
    termCalendarId: formData.get("termCalendarId") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { termStart, termEnd, termCalendarId, ...rest } = parsed.data;

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
      ...customChoiceData(resolvedLocationType, resolvedInvoicingTarget),
      termStart: termStart ? new Date(termStart) : null,
      termEnd: termEnd ? new Date(termEnd) : null,
      termCalendarId: resolvedCalendarId,
    },
  });

  revalidatePath(`/dashboard/teaching-locations/${locationId}`);
  revalidatePath("/dashboard/teaching-locations");
  redirect(`/dashboard/teaching-locations/${locationId}`);
}