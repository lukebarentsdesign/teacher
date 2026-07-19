import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderInvoicePdf, type InvoiceLineItem } from "@/lib/invoice-pdf";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const invoice = await prisma.quickInvoice.findUnique({
    where: { id },
    include: {
      teacher: true,
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
  });

  const payer = invoice?.student.payerLinks[0]?.payer;
  if (!invoice || !payer || payer.accessCode !== code) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lineItems: InvoiceLineItem[] = [
    {
      date: invoice.periodStart,
      description: `${invoice.lessonsCount} lesson${invoice.lessonsCount !== 1 ? "s" : ""} x ${String.fromCharCode(163)}${invoice.costPerLesson.toFixed(2)}`,
      amount: invoice.totalAmount,
    },
  ];

  const pdfBytes = await renderInvoicePdf({
    invoiceNumber: invoice.invoiceRef,
    businessName: invoice.teacher.businessName,
    businessAddress: invoice.teacher.businessAddress,
    paymentInstructions: invoice.teacher.paymentInstructions,
    teacherName: invoice.teacher.name,
    teacherEmail: invoice.teacher.email,
    payerName: payer.name,
    payerEmail: payer.email,
    studentName: invoice.student.name,
    lineItems,
    generatedAt: invoice.createdAt,
    dueDate: invoice.dueDate,
    teacherAddress: invoice.teacher.businessAddress || undefined,
    teacherBankDetails: invoice.teacher.paymentInstructions || undefined,
    teacherStripeLink: invoice.teacher.invoiceStripeLink || undefined,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceRef}.pdf"`,
    },
  });
}
