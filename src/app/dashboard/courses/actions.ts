"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

async function assertOwnCourse(courseId: string, teacherId: string) {
  return prisma.course.findFirst({ where: { id: courseId, teacherId } });
}

const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  price: z.coerce.number().positive().optional(),
});

export async function createCourseAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "CURRICULUM"))) {
    return "The Curriculum & content module isn't enabled on this account";
  }

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const course = await prisma.course.create({
    data: {
      teacherId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      price: parsed.data.price ?? null,
    },
  });

  revalidatePath("/dashboard/courses");
  redirect(`/dashboard/courses/${course.id}`);
}

export async function deleteCourseAction(courseId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnCourse(courseId, session.user.id))) return;

  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/dashboard/courses");
}

export async function togglePublishCourseAction(courseId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const course = await assertOwnCourse(courseId, session.user.id);
  if (!course) return;

  await prisma.course.update({ where: { id: courseId }, data: { isPublished: !course.isPublished } });
  revalidatePath(`/dashboard/courses/${courseId}`);
}

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  mediaType: z.enum(["VIDEO", "AUDIO", "DOCUMENT"]),
  mediaUrl: z.string().trim().url("Enter a valid URL"),
  lessonTypeId: z.string().optional(),
});

export async function addCourseItemAction(
  courseId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "CURRICULUM"))) {
    return "The Curriculum & content module isn't enabled on this account";
  }
  if (!(await assertOwnCourse(courseId, session.user.id))) return "Course not found";

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    mediaType: formData.get("mediaType"),
    mediaUrl: formData.get("mediaUrl"),
    lessonTypeId: formData.get("lessonTypeId") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  if (parsed.data.lessonTypeId) {
    const lessonType = await prisma.lessonType.findFirst({
      where: { id: parsed.data.lessonTypeId, teacherId: session.user.id },
    });
    if (!lessonType) return "Lesson type not found";
  }

  const count = await prisma.courseItem.count({ where: { courseId } });

  await prisma.courseItem.create({
    data: {
      teacherId: session.user.id,
      courseId,
      order: count,
      title: parsed.data.title,
      description: parsed.data.description || null,
      mediaType: parsed.data.mediaType,
      mediaUrl: parsed.data.mediaUrl,
      lessonTypeId: parsed.data.lessonTypeId || null,
    },
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function deleteCourseItemAction(itemId: string, courseId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnCourse(courseId, session.user.id))) return;

  await prisma.courseItem.deleteMany({ where: { id: itemId, courseId } });
  revalidatePath(`/dashboard/courses/${courseId}`);
}

const purchaseSchema = z.object({
  payerId: z.string().min(1, "Pick a payer"),
  amountPaid: z.coerce.number().positive("Amount must be more than 0"),
});

/** Manual, out-of-band collection — same pattern as AddOnBooking, not a ledger post. */
export async function recordCoursePurchaseAction(
  courseId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await assertOwnCourse(courseId, session.user.id))) return "Course not found";

  const parsed = purchaseSchema.safeParse({
    payerId: formData.get("payerId"),
    amountPaid: formData.get("amountPaid"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const payer = await prisma.payer.findFirst({ where: { id: parsed.data.payerId, teacherId: session.user.id } });
  if (!payer) return "Payer not found";

  const existing = await prisma.coursePurchase.findUnique({
    where: { courseId_payerId: { courseId, payerId: parsed.data.payerId } },
  });
  if (existing) return "This payer already has access to this course";

  await prisma.coursePurchase.create({
    data: { courseId, payerId: parsed.data.payerId, amountPaid: parsed.data.amountPaid },
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
}
