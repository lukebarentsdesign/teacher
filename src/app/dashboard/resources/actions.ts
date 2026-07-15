"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const resourceSchema = z.object({
  type: z.enum(["DOCUMENT", "AUDIO", "VIDEO", "IMAGE"]),
  title: z.string().trim().min(1, "Title is required"),
  url: z.string().trim().url("Enter a valid URL"),
  description: z.string().trim().optional(),
  folder: z.string().trim().optional(),
  sourceLabel: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  thumbnailUrl: z.string().trim().url("Enter a valid thumbnail URL").optional().or(z.literal("")),
  pinned: z.coerce.boolean().optional(),
  studentId: z.string().optional(),
});

export async function createResourceAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = resourceSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    url: formData.get("url"),
    description: formData.get("description") || undefined,
    folder: formData.get("folder") || undefined,
    sourceLabel: formData.get("sourceLabel") || undefined,
    tags: formData.get("tags") || undefined,
    thumbnailUrl: formData.get("thumbnailUrl") || undefined,
    pinned: formData.get("pinned") === "on",
    studentId: formData.get("studentId") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  if (parsed.data.studentId) {
    const student = await prisma.student.findFirst({
      where: { id: parsed.data.studentId, teacherId: session.user.id },
    });
    if (!student) return "Student not found";
  }

  await prisma.resource.create({
    data: {
      ...parsed.data,
      thumbnailUrl: parsed.data.thumbnailUrl || undefined,
      teacherId: session.user.id,
    },
  });

  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard/today");
  redirect("/dashboard/resources");
}