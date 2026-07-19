"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateUniqueAccessCode } from "@/lib/access-code";

export async function quickCreateStudentAction(data: {
  studentName: string;
  discipline: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  locationId?: string;
  billingFrequency?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const teacherId = session.user.id;

  if (!data.studentName.trim()) return { success: false, error: "Student name is required" };
  if (!data.discipline.trim()) return { success: false, error: "Subject/instrument is required" };
  if (!data.payerName.trim()) return { success: false, error: "Payer name is required" };

  try {
    const locationId = data.locationId || null;
    if (locationId) {
      const link = await prisma.teacherLocationLink.findFirst({ where: { teacherId, locationId } });
      if (!link) return { success: false, error: "Venue not found" };
    }

    await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          teacherId,
          name: data.studentName.trim(),
          discipline: data.discipline.trim(),
          source: locationId ? "SCHOOL_INQUIRY" : "HOME",
          locationId,
          billingFrequency: data.billingFrequency || "monthly",
          status: "ACTIVE",
        },
      });

      const payer = await tx.payer.create({
        data: {
          teacherId,
          name: data.payerName.trim(),
          email: data.payerEmail.trim() || null,
          phone: data.payerPhone?.trim() || null,
          accessCode: await generateUniqueAccessCode(),
        },
      });

      await tx.studentPayerLink.create({
        data: { studentId: student.id, payerId: payer.id, isPrimary: true, splitPercent: 100 },
      });
    });

    revalidatePath("/dashboard/quick-tools");
    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not create student" };
  }
}

export async function quickCreateLessonAction(data: {
  studentId: string;
  locationId: string;
  scheduledAt: string;
  durationMins: number;
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const teacherId = session.user.id;

  try {
    const student = await prisma.student.findFirst({ where: { id: data.studentId, teacherId } });
    if (!student) return { success: false, error: "Student not found" };

    const link = await prisma.teacherLocationLink.findFirst({ where: { teacherId, locationId: data.locationId } });
    if (!link) return { success: false, error: "Venue not found" };

    const lesson = await prisma.lesson.create({
      data: {
        teacherId,
        studentId: data.studentId,
        locationId: data.locationId,
        scheduledAt: new Date(data.scheduledAt),
        durationMins: Math.max(15, data.durationMins),
        note: data.note?.trim() ? { create: { content: data.note.trim() } } : undefined,
      },
    });

    revalidatePath("/dashboard/quick-tools");
    revalidatePath("/dashboard/today");
    revalidatePath("/dashboard/lessons");
    return { success: true, lessonId: lesson.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not create lesson" };
  }
}

export async function quickUpdateLessonAction(data: {
  lessonId: string;
  status: "HELD" | "CANCELLED_BY_STUDENT" | "CANCELLED_BY_TEACHER" | "RESCHEDULED";
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: data.lessonId, teacherId: session.user.id } });
    if (!lesson) return { success: false, error: "Lesson not found" };

    await prisma.lesson.update({
      where: { id: data.lessonId },
      data: {
        status: data.status,
        note: data.note?.trim()
          ? { upsert: { create: { content: data.note.trim() }, update: { content: data.note.trim() } } }
          : undefined,
      },
    });

    revalidatePath("/dashboard/quick-tools");
    revalidatePath("/dashboard/today");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not update lesson" };
  }
}

export async function quickMarkInvoicePaidAction(invoiceId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const invoice = await prisma.quickInvoice.findUnique({
      where: { id: invoiceId },
      select: { teacherId: true, totalAmount: true },
    });
    if (!invoice || invoice.teacherId !== session.user.id) return { success: false, error: "Invoice not found" };

    await prisma.quickInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAt: new Date(),
        paidAmount: amount,
        status: amount >= invoice.totalAmount ? "paid" : "partial",
      },
    });

    revalidatePath("/dashboard/quick-tools");
    revalidatePath("/dashboard/quick-invoice");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not mark invoice paid" };
  }
}
