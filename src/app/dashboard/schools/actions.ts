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
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { termStart, termEnd, ...rest } = parsed.data;

  const school = await prisma.school.create({
    data: {
      ...rest,
      termStart: termStart ? new Date(termStart) : undefined,
      termEnd: termEnd ? new Date(termEnd) : undefined,
    },
  });

  revalidatePath("/dashboard/schools");
  // Straight to the detail page — a school with no TeacherSchoolLink yet is invisible to the
  // teacher-scoped schools list, so they need to set up their engagement here right away.
  redirect(`/dashboard/schools/${school.id}`);
}
