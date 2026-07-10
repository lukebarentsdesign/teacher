import { prisma } from "@/lib/db";

/** The latest Contract version for a teacher — "current" always means highest version number. */
export async function getCurrentContract(teacherId: string) {
  return prisma.contract.findFirst({
    where: { teacherId },
    orderBy: { version: "desc" },
  });
}

export async function getAcceptanceForContract(payerId: string, contractVersion: number) {
  return prisma.contractAcceptance.findUnique({
    where: { payerId_contractVersion: { payerId, contractVersion } },
  });
}

/**
 * Gate check for lesson booking / payment collection. If the teacher hasn't set up a contract
 * at all yet, there's nothing to gate on — return true so existing/early usage isn't blocked.
 */
export async function hasAcceptedCurrentContract(payerId: string, teacherId: string): Promise<boolean> {
  const contract = await getCurrentContract(teacherId);
  if (!contract) return true;

  const acceptance = await getAcceptanceForContract(payerId, contract.version);
  return !!acceptance;
}
