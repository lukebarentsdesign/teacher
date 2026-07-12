"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
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

/**
 * School is shared reference data, not teacher-owned (see CLAUDE.md's "Multi-tenant" note) — so
 * edit access is gated on the teacher having a TeacherSchoolLink to this school, the same
 * ownership check the detail page's own queries use, rather than a teacherId field School doesn't
 * have.
 */
export async function updateSchoolAction(
  schoolId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const link = await prisma.teacherSchoolLink.findFirst({
    where: { schoolId, teacherId: session.user.id },
  });
  if (!link) return "You don't have access to edit this school.";

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

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      ...rest,
      termStart: termStart ? new Date(termStart) : null,
      termEnd: termEnd ? new Date(termEnd) : null,
    },
  });

  revalidatePath(`/dashboard/schools/${schoolId}`);
  revalidatePath("/dashboard/schools");
  redirect(`/dashboard/schools/${schoolId}`);
}
