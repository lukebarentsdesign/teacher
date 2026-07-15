import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

function hasCurrentDelegates(client: PrismaClient | undefined) {
  if (!client) return false;
  const candidate = client as PrismaClient & {
    locationTypeOption?: unknown;
    invoicingTargetOption?: unknown;
  };
  return Boolean(candidate.locationTypeOption && candidate.invoicingTargetOption);
}

export const prisma = hasCurrentDelegates(globalForPrisma.prisma)
  ? globalForPrisma.prisma!
  : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
