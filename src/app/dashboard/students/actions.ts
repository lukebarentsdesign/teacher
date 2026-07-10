"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { studentSchema } from "@/lib/validations";

export async function createStudentAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    dob: formData.get("dob") || undefined,
    discipline: formData.get("discipline"),
    source: formData.get("source"),
    schoolId: formData.get("schoolId") || undefined,
    igCardId: formData.get("igCardId") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { dob, ...rest } = parsed.data;

  await prisma.student.create({
    data: {
      ...rest,
      teacherId: session.user.id,
      dob: dob ? new Date(dob) : undefined,
    },
  });

  revalidatePath("/dashboard/students");
  redirect("/dashboard/students");
}
