import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { renderInvoicePdf, type InvoiceLineItem } from "@/lib/invoice-pdf";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const lessonsCount = Number(searchParams.get("lessonsCount") || "0");
  const costPerLesson = Number(searchParams.get("costPerLesson") || "0");
  const billingUnit = searchParams.get("billingUnit") === "hours" ? "hours" : "lessons";
  const dueDateStr = searchParams.get("dueDate");
  
  // Custom teacher details overrides (persisted or entered on fly)
  const teacherAddress = searchParams.get("teacherAddress") || undefined;
  const teacherBankDetails = searchParams.get("teacherBankDetails") || undefined;
  const teacherStripeLink = searchParams.get("teacherStripeLink") || undefined;

  if (!studentId || lessonsCount <= 0 || costPerLesson <= 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Fetch student, primary payer, location, and teacher
  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    include: {
      location: true,
      payerLinks: {
        where: { isPrimary: true },
        include: { payer: true },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const primaryPayer = student.payerLinks[0]?.payer;
  if (!primaryPayer) {
    return NextResponse.json({ error: "No primary payer associated with student" }, { status: 400 });
  }

  // Build line item for upcoming lessons
  const lineItems: InvoiceLineItem[] = [
    {
      date: new Date(),
      description: `${lessonsCount} ${billingUnit} x ${String.fromCharCode(163)}${costPerLesson.toFixed(2)}`,
      amount: lessonsCount * costPerLesson,
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
    dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
    teacherAddress: teacherAddress || teacher.businessAddress || undefined,
    teacherBankDetails: teacherBankDetails || teacher.paymentInstructions || undefined,
    teacherStripeLink: teacherStripeLink || teacher.invoiceStripeLink || undefined,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${student.name.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
