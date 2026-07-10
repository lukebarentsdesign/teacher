"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { schoolSchema } from "@/lib/validations";

export async function createSchoolAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = schoolSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    invoicingTarget: formData.get("invoicingTarget"),
    termStart: formData.get("termStart") || undefined,
    termEnd: formData.get("termEnd") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { termStart, termEnd, ...rest } = parsed.data;

  await prisma.school.create({
    data: {
      ...rest,
      termStart: termStart ? new Date(termStart) : undefined,
      termEnd: termEnd ? new Date(termEnd) : undefined,
    },
  });

  revalidatePath("/dashboard/schools");
  redirect("/dashboard/schools");
}
