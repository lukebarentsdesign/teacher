"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";
import { getCurrentContract } from "@/lib/contracts";

const acceptSchema = z.object({
  typedName: z.string().trim().min(1, "Type your full name"),
  agree: z.string().optional(),
});

function getClientIp(headerList: Headers): string | null {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return headerList.get("x-real-ip");
}

export async function acceptContractAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await getMicrositeSession();
  if (!session) redirect("/parent/login");
  if (session.type !== "guardian") return "Only the account holder (guardian) can accept the contract.";

  const parsed = acceptSchema.safeParse({
    typedName: formData.get("typedName"),
    agree: formData.get("agree") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }
  if (parsed.data.agree !== "on") {
    return "You must confirm you've read and agree to the terms.";
  }

  const payer = await prisma.payer.findUniqueOrThrow({ where: { id: session.payerId } });
  const contract = await getCurrentContract(payer.teacherId);
  if (!contract) return "Your teacher hasn't set up a contract yet.";

  const headerList = await headers();
  const ipAddress = getClientIp(headerList);

  await prisma.contractAcceptance.upsert({
    where: { payerId_contractVersion: { payerId: payer.id, contractVersion: contract.version } },
    update: {
      typedName: parsed.data.typedName,
      contractSnapshot: contract.content,
      acceptedAt: new Date(),
      ipAddress,
    },
    create: {
      payerId: payer.id,
      contractId: contract.id,
      contractVersion: contract.version,
      contractSnapshot: contract.content,
      typedName: parsed.data.typedName,
      ipAddress,
    },
  });

  redirect("/parent/contract");
}
