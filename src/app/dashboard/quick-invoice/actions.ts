"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { generateUniqueAccessCode } from "@/lib/access-code";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { sendEmailWithAttachmentAsTeacher } from "@/lib/gmail";


export type QuickInvoiceLessonDateInput = {
  date: string;
  attended: boolean;
};

export type CreateQuickInvoiceInput = {
  studentId: string;
  invoiceRef: string;
  billingMode: "upfront" | "arrears";
  periodStart: string;
  periodEnd: string;
  costPerLesson: number;
  billingUnit?: "lessons" | "hours";
  dueDate: string;
  notes?: string;
  lessonDates: QuickInvoiceLessonDateInput[];
};

export type InvoiceHistoryItem = {
  id: string;
  invoiceRef: string;
  billingMode: string;
  periodStart: string;
  periodEnd: string;
  lessonsCount: number;
  costPerLesson: number;
  totalAmount: number;
  dueDate: string;
  paidAt: string | null;
  paidAmount: number | null;
  status: string;
  emailedAt: string | null;
  notes: string | null;
  createdAt: string;
  accessCode: string | null;
  lessonDates: { id: string; date: string; attended: boolean }[];
};
export type QuickInvoiceSettingsInput = {
  businessName: string;
  businessAddress: string;
  paymentInstructions: string;
  invoiceStripeLink: string;
  invoiceEmailSubjectTemplate: string;
  invoiceEmailBodyTemplate: string;
};

export async function saveTeacherInvoiceSettingsAction(
  data: QuickInvoiceSettingsInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    await prisma.teacher.update({
      where: { id: session.user.id },
      data: {
        businessName: data.businessName || null,
        businessAddress: data.businessAddress || null,
        paymentInstructions: data.paymentInstructions || null,
        invoiceStripeLink: data.invoiceStripeLink || null,
        invoiceEmailSubjectTemplate: data.invoiceEmailSubjectTemplate || null,
        invoiceEmailBodyTemplate: data.invoiceEmailBodyTemplate || null,
      },
    });
    revalidatePath("/dashboard/quick-invoice");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save settings" };
  }
}

export type QuickAddStudentInput = {
  studentName: string;
  discipline: string;
  billingFrequency: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  locationChoice: string; // "home" | "online" | "new" | existing_location_id
  newLocationName?: string;
  newLocationAddress?: string;
};

export async function quickAddStudentAction(
  data: QuickAddStudentInput
): Promise<{ success: boolean; studentId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const teacherId = session.user.id;

  if (!data.studentName.trim()) return { success: false, error: "Student name is required" };
  if (!data.discipline.trim()) return { success: false, error: "Discipline/Instrument is required" };
  if (!data.payerName.trim()) return { success: false, error: "Parent/Payer name is required" };
  if (!data.payerEmail.trim()) return { success: false, error: "Parent/Payer email is required" };

  try {
    const studentId = await prisma.$transaction(async (tx) => {
      let finalLocationId: string | null = null;
      let studentSource: "HOME" | "SCHOOL_INQUIRY" | "COLLEGE" = "HOME";

      // Handle location choice
      if (data.locationChoice === "new" && data.newLocationName?.trim()) {
        // Create a new TeachingLocation
        const location = await tx.teachingLocation.create({
          data: {
            name: data.newLocationName.trim(),
            address: data.newLocationAddress?.trim() || null,
            locationType: "SCHOOL",
            invoicingTarget: "PARENT",
          },
        });
        
        // Link the teacher to the new location
        await tx.teacherLocationLink.create({
          data: {
            teacherId,
            locationId: location.id,
            schedulingMode: "FIXED",
            taxHandling: "SELF_EMPLOYED",
            availability: [],
            protectedBlocks: [],
          },
        });

        finalLocationId = location.id;
        studentSource = "SCHOOL_INQUIRY";
      } else if (data.locationChoice !== "home" && data.locationChoice !== "online" && data.locationChoice !== "new") {
        // Linked to existing location
        finalLocationId = data.locationChoice;
        studentSource = "SCHOOL_INQUIRY";
      }

      // Create student
      const student = await tx.student.create({
        data: {
          teacherId,
          name: data.studentName.trim(),
          discipline: data.discipline.trim(),
          source: studentSource,
          locationId: finalLocationId,
          billingFrequency: data.billingFrequency,
          status: "ACTIVE",
        },
      });

      // Create payer
      const payer = await tx.payer.create({
        data: {
          teacherId,
          name: data.payerName.trim(),
          email: data.payerEmail.trim(),
          phone: data.payerPhone?.trim() || null,
          accessCode: await generateUniqueAccessCode(),
        },
      });

      // Link student to primary payer
      await tx.studentPayerLink.create({
        data: {
          studentId: student.id,
          payerId: payer.id,
          isPrimary: true,
          splitPercent: 100,
        },
      });

      return student.id;
    });

    revalidatePath("/dashboard/quick-invoice");
    return { success: true, studentId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to add student" };
  }
}

export type SendQuickInvoiceInput = {
  studentId: string;
  lessonsCount: number;
  costPerLesson: number;
  billingUnit?: "lessons" | "hours";
  dueDate: string; // ISO date string
  emailSubject: string;
  emailBody: string;
  teacherAddress?: string;
  teacherBankDetails?: string;
  teacherStripeLink?: string;
};

export async function sendQuickInvoiceEmailAction(
  data: SendQuickInvoiceInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, teacherId: session.user.id },
      include: {
        location: true,
        payerLinks: {
          where: { isPrimary: true },
          include: { payer: true },
        },
      },
    });

    if (!student) return { success: false, error: "Student not found" };

    const primaryPayer = student.payerLinks[0]?.payer;
    if (!primaryPayer || !primaryPayer.email) {
      return { success: false, error: "Primary payer has no email address on file" };
    }

    const teacher = await prisma.teacher.findUniqueOrThrow({
      where: { id: session.user.id },
    });

    // Build line items
    const lineItems = [
      {
        date: new Date(),
        description: `${data.lessonsCount} ${data.billingUnit === "hours" ? "hours" : "lessons"} x ${String.fromCharCode(163)}${data.costPerLesson.toFixed(2)}`,
        amount: data.lessonsCount * data.costPerLesson,
      },
    ];

    // Generate PDF
    const pdfBytes = await renderInvoicePdf({
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      payerName: primaryPayer.name,
      payerEmail: primaryPayer.email,
      studentName: student.name,
      lineItems,
      generatedAt: new Date(),
      dueDate: new Date(data.dueDate),
      teacherAddress: data.teacherAddress || teacher.businessAddress || undefined,
      teacherBankDetails: data.teacherBankDetails || teacher.paymentInstructions || undefined,
      teacherStripeLink: data.teacherStripeLink || teacher.invoiceStripeLink || undefined,
    });

    // Send email with PDF attachment
    await sendEmailWithAttachmentAsTeacher(
      session.user.id,
      primaryPayer.email,
      data.emailSubject,
      data.emailBody,
      Buffer.from(pdfBytes),
      `invoice-${student.name.replace(/\s+/g, "_")}.pdf`
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to send invoice email" };
  }
}

export type BatchInvoiceItem = {
  studentId: string;
  lessonsCount: number;
  costPerLesson: number;
  billingUnit?: "lessons" | "hours";
  emailSubject: string;
  emailBody: string;
};

export type SendBatchInvoicesInput = {
  dueDate: string;
  teacherAddress?: string;
  teacherBankDetails?: string;
  teacherStripeLink?: string;
  invoices: BatchInvoiceItem[];
};

export async function sendBatchQuickInvoicesAction(
  data: SendBatchInvoicesInput
): Promise<{ success: boolean; results: { studentId: string; studentName: string; success: boolean; error?: string }[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const results: { studentId: string; studentName: string; success: boolean; error?: string }[] = [];

  for (const item of data.invoices) {
    try {
      const student = await prisma.student.findFirst({
        where: { id: item.studentId, teacherId: session.user.id },
        include: {
          location: true,
          payerLinks: {
            where: { isPrimary: true },
            include: { payer: true },
          },
        },
      });

      if (!student) {
        results.push({ studentId: item.studentId, studentName: "Unknown", success: false, error: "Student not found" });
        continue;
      }

      const primaryPayer = student.payerLinks[0]?.payer;
      if (!primaryPayer || !primaryPayer.email) {
        results.push({ studentId: item.studentId, studentName: student.name, success: false, error: "Payer email not found" });
        continue;
      }

      const lineItems = [
        {
          date: new Date(),
          description: `${item.lessonsCount} ${item.billingUnit === "hours" ? "hours" : "lessons"} x ${String.fromCharCode(163)}${item.costPerLesson.toFixed(2)}`,
          amount: item.lessonsCount * item.costPerLesson,
        },
      ];

      const pdfBytes = await renderInvoicePdf({
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        payerName: primaryPayer.name,
        payerEmail: primaryPayer.email,
        studentName: student.name,
        lineItems,
        generatedAt: new Date(),
        dueDate: new Date(data.dueDate),
        teacherAddress: data.teacherAddress || teacher.businessAddress || undefined,
        teacherBankDetails: data.teacherBankDetails || teacher.paymentInstructions || undefined,
        teacherStripeLink: data.teacherStripeLink || teacher.invoiceStripeLink || undefined,
      });

      await sendEmailWithAttachmentAsTeacher(
        session.user.id,
        primaryPayer.email,
        item.emailSubject,
        item.emailBody,
        Buffer.from(pdfBytes),
        `invoice-${student.name.replace(/\s+/g, "_")}.pdf`
      );

      results.push({ studentId: item.studentId, studentName: student.name, success: true });
    } catch (err) {
      results.push({
        studentId: item.studentId,
        studentName: "Unknown",
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { success: results.every(r => r.success), results };
}


export type RecordQuickInvoiceSentInput = {
  studentId: string;
  lessonsCount: number;
  costPerLesson: number;
  billingUnit?: "lessons" | "hours";
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  invoiceRef?: string;
  notes?: string;
  markSent?: boolean;
};

export async function recordQuickInvoiceSentAction(
  data: RecordQuickInvoiceSentInput
): Promise<{ success: boolean; invoiceId?: string; accessCode?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const teacherId = session.user.id;

  try {
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, teacherId },
      select: {
        id: true,
        name: true,
        payerLinks: {
          where: { isPrimary: true },
          select: { payer: { select: { accessCode: true } } },
          take: 1,
        },
      },
    });
    if (!student) return { success: false, error: "Student not found" };

    const lessonsCount = Math.max(1, Math.floor(data.lessonsCount));
    const safeRate = Math.max(0, data.costPerLesson);
    const startDate = new Date(`${data.periodStart}T12:00:00`);
    const endDate = new Date(`${data.periodEnd}T12:00:00`);
    const dueDate = new Date(`${data.dueDate}T12:00:00`);
    const invoiceRef = data.invoiceRef?.trim() || `INV-${student.name.replace(/\s+/g, "").toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const invoice = await prisma.quickInvoice.create({
      data: {
        teacherId,
        studentId: data.studentId,
        invoiceRef,
        billingMode: "upfront",
        periodStart: startDate,
        periodEnd: endDate,
        lessonsCount,
        costPerLesson: safeRate,
        totalAmount: lessonsCount * safeRate,
        dueDate,
        status: "unpaid",
        emailedAt: data.markSent === false ? null : new Date(),
        notes: data.notes || `${lessonsCount} ${data.billingUnit === "hours" ? "hours" : "lessons"} prepared from Quick Invoice Sheet`,
      },
    });

    revalidatePath("/dashboard/quick-invoice");
    return { success: true, invoiceId: invoice.id, accessCode: student.payerLinks[0]?.payer.accessCode };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to record sent invoice" };
  }
}

export async function markQuickInvoicesSentAction(
  invoiceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    await prisma.quickInvoice.updateMany({
      where: {
        teacherId: session.user.id,
        id: { in: invoiceIds },
        emailedAt: null,
      },
      data: { emailedAt: new Date() },
    });

    revalidatePath("/dashboard/quick-invoice");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to confirm sent invoices" };
  }
}
export async function createQuickInvoiceAction(
  data: CreateQuickInvoiceInput
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const teacherId = session.user.id;

  try {
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, teacherId },
      select: { id: true },
    });
    if (!student) return { success: false, error: "Student not found" };

    const billableDates = data.billingMode === "arrears"
      ? data.lessonDates.filter((d) => d.attended)
      : data.lessonDates;
    const lessonsCount = billableDates.length;
    const totalAmount = lessonsCount * data.costPerLesson;

    const invoice = await prisma.quickInvoice.create({
      data: {
        teacherId,
        studentId: data.studentId,
        invoiceRef: data.invoiceRef,
        billingMode: data.billingMode,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        lessonsCount,
        costPerLesson: data.costPerLesson,
        totalAmount,
        dueDate: new Date(data.dueDate),
        notes: data.notes || null,
        status: "unpaid",
        lessonDates: {
          create: data.lessonDates.map((d) => ({
            date: new Date(d.date),
            attended: data.billingMode === "upfront" ? true : d.attended,
          })),
        },
      },
    });

    revalidatePath("/dashboard/quick-invoice");
    return { success: true, invoiceId: invoice.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create invoice" };
  }
}

export async function markInvoicePaidAction(params: {
  invoiceId: string;
  paidAmount: number;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const invoice = await prisma.quickInvoice.findUniqueOrThrow({
      where: { id: params.invoiceId },
      select: { teacherId: true, totalAmount: true },
    });
    if (invoice.teacherId !== session.user.id) return { success: false, error: "Forbidden" };

    const status = params.paidAmount >= invoice.totalAmount ? "paid" : "partial";

    await prisma.quickInvoice.update({
      where: { id: params.invoiceId },
      data: {
        paidAt: new Date(),
        paidAmount: params.paidAmount,
        status,
      },
    });

    revalidatePath("/dashboard/quick-invoice");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark paid" };
  }
}

export async function updateLessonAttendanceAction(params: {
  invoiceId: string;
  lessonDateId: string;
  attended: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const invoice = await prisma.quickInvoice.findUniqueOrThrow({
      where: { id: params.invoiceId },
      select: { teacherId: true, costPerLesson: true, lessonDates: true },
    });
    if (invoice.teacherId !== session.user.id) return { success: false, error: "Forbidden" };

    await prisma.quickInvoiceLessonDate.update({
      where: { id: params.lessonDateId },
      data: { attended: params.attended },
    });

    const updatedDates = invoice.lessonDates.map((d) =>
      d.id === params.lessonDateId ? { ...d, attended: params.attended } : d
    );
    const attendedCount = updatedDates.filter((d) => d.attended).length;
    const newTotal = attendedCount * invoice.costPerLesson;

    await prisma.quickInvoice.update({
      where: { id: params.invoiceId },
      data: { lessonsCount: attendedCount, totalAmount: newTotal },
    });

    revalidatePath("/dashboard/quick-invoice");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update attendance" };
  }
}

export async function getStudentInvoicesAction(
  studentId: string
): Promise<{ success: boolean; invoices?: InvoiceHistoryItem[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const invoices = await prisma.quickInvoice.findMany({
      where: { teacherId: session.user.id, studentId },
      include: {
        lessonDates: { orderBy: { date: "asc" } },
        student: {
          include: {
            payerLinks: {
              where: { isPrimary: true },
              include: { payer: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceRef: inv.invoiceRef,
        billingMode: inv.billingMode,
        periodStart: inv.periodStart.toISOString(),
        periodEnd: inv.periodEnd.toISOString(),
        lessonsCount: inv.lessonsCount,
        costPerLesson: inv.costPerLesson,
        totalAmount: inv.totalAmount,
        dueDate: inv.dueDate.toISOString(),
        paidAt: inv.paidAt?.toISOString() || null,
        paidAmount: inv.paidAmount || null,
        status: inv.status,
        emailedAt: inv.emailedAt?.toISOString() || null,
        notes: inv.notes || null,
        createdAt: inv.createdAt.toISOString(),
        accessCode: inv.student.payerLinks[0]?.payer.accessCode || null,
        lessonDates: inv.lessonDates.map((d) => ({
          id: d.id,
          date: d.date.toISOString(),
          attended: d.attended,
        })),
      })),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to load invoices" };
  }
}
export async function getUnpaidInvoicesReminderAction(): Promise<{
  count: number;
  overdueCount: number;
  studentNames: string[];
}> {
  const session = await auth();
  if (!session?.user?.id) return { count: 0, overdueCount: 0, studentNames: [] };

  const now = new Date();
  const invoices = await prisma.quickInvoice.findMany({
    where: {
      teacherId: session.user.id,
      status: { in: ["unpaid", "partial"] },
    },
    include: { student: { select: { name: true } } },
  });

  const overdueCount = invoices.filter((i) => i.dueDate < now).length;
  const studentNames = [...new Set(invoices.map((i) => i.student.name))];

  return { count: invoices.length, overdueCount, studentNames };
}




