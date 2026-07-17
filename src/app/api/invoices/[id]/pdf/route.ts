import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getMicrositeSession } from "@/lib/microsite-session";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teacherSession = await auth();
  const isOwningTeacher = teacherSession?.user?.id === invoice.teacherId;

  let hasMicrositeAccess = false;
  if (!isOwningTeacher) {
    const micrositeSession = await getMicrositeSession();
    hasMicrositeAccess = micrositeSession?.type === "guardian" && micrositeSession.payerId === invoice.payerId;
  }

  if (!isOwningTeacher && !hasMicrositeAccess) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

interface InvoiceSnapshot {
  invoiceNumber?: string;
  businessName?: string | null;
  businessAddress?: string | null;
  paymentInstructions?: string | null;
  teacherName: string;
  teacherEmail: string;
  payerName: string;
  payerEmail: string | null;
  studentName: string;
  lineItems: Array<{ date: string; description: string; amount: number }>;
  generatedAt: string;
}

  const snapshot = invoice.snapshot as unknown as InvoiceSnapshot;

  const pdfBytes = await renderInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    businessName: snapshot.businessName,
    businessAddress: snapshot.businessAddress,
    paymentInstructions: snapshot.paymentInstructions,
    teacherName: snapshot.teacherName,
    teacherEmail: snapshot.teacherEmail,
    payerName: snapshot.payerName,
    payerEmail: snapshot.payerEmail,
    studentName: snapshot.studentName,
    lineItems: snapshot.lineItems.map((item) => ({
      date: new Date(item.date),
      description: item.description,
      amount: item.amount,
    })),
    generatedAt: new Date(snapshot.generatedAt),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
