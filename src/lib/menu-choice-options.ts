import { prisma } from "@/lib/db";
import type { InvoicingTargetOptionChoice, LocationTypeOptionChoice } from "@/lib/location-types";

type LocationTypeOptionRow = LocationTypeOptionChoice & { sortOrder?: number; active?: boolean };
type InvoicingTargetOptionRow = InvoicingTargetOptionChoice & { sortOrder?: number; active?: boolean };

type OptionPrisma = typeof prisma & {
  locationTypeOption?: {
    findMany: (args: unknown) => Promise<LocationTypeOptionRow[]>;
    findFirst: (args: unknown) => Promise<LocationTypeOptionChoice | null>;
  };
  invoicingTargetOption?: {
    findMany: (args: unknown) => Promise<InvoicingTargetOptionRow[]>;
    findFirst: (args: unknown) => Promise<InvoicingTargetOptionChoice | null>;
  };
};

export function supportsMenuChoiceDelegates() {
  const client = prisma as OptionPrisma;
  return Boolean(client.locationTypeOption && client.invoicingTargetOption);
}

export async function getActiveLocationTypeOptions(teacherId: string) {
  const client = prisma as OptionPrisma;
  if (!client.locationTypeOption) return [];
  return client.locationTypeOption.findMany({
    where: { teacherId, active: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true, locationType: true },
  });
}

export async function getActiveInvoicingTargetOptions(teacherId: string) {
  const client = prisma as OptionPrisma;
  if (!client.invoicingTargetOption) return [];
  return client.invoicingTargetOption.findMany({
    where: { teacherId, active: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true, invoicingTarget: true },
  });
}

export async function getAllLocationTypeOptions(teacherId: string) {
  const client = prisma as OptionPrisma;
  if (!client.locationTypeOption) return [];
  return client.locationTypeOption.findMany({
    where: { teacherId },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true, locationType: true, sortOrder: true, active: true },
  });
}

export async function getAllInvoicingTargetOptions(teacherId: string) {
  const client = prisma as OptionPrisma;
  if (!client.invoicingTargetOption) return [];
  return client.invoicingTargetOption.findMany({
    where: { teacherId },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true, invoicingTarget: true, sortOrder: true, active: true },
  });
}

export async function findActiveLocationTypeOption(teacherId: string, optionId: string) {
  const client = prisma as OptionPrisma;
  if (!client.locationTypeOption) return null;
  return client.locationTypeOption.findFirst({
    where: { id: optionId, teacherId, active: true },
    select: { label: true, locationType: true },
  });
}

export async function findActiveInvoicingTargetOption(teacherId: string, optionId: string) {
  const client = prisma as OptionPrisma;
  if (!client.invoicingTargetOption) return null;
  return client.invoicingTargetOption.findFirst({
    where: { id: optionId, teacherId, active: true },
    select: { label: true, invoicingTarget: true },
  });
}