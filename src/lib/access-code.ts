import { prisma } from "@/lib/db";

/** Generates a unique 6-digit microsite access code, retrying on collision. */
export async function generateUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await prisma.payer.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique access code after 10 attempts");
}
