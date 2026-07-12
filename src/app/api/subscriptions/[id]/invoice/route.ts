import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getMicrositeSession } from "@/lib/microsite-session";
import { renderInvoicePdf, type InvoiceLineItem } from "@/lib/invoice-pdf";

const REASON_LABEL: Record<string, string> = {
  PAYMENT: "Payment received",
  LESSON_DELIVERED: "Lesson",
  CANCELLATION_ADJUSTMENT: "Cancellation adjustment",
  MANUAL_CORRECTION: "Adjustment",
  MAKE_UP_CREDIT_ISSUED: "Make-up credit issued",
  MAKE_UP_CREDIT_REDEEMED: "Make-up credit redeemed",
  VENUE_FEE_ITEMISED: "Venue fee",
  LATE_CANCELLATION_CHARGE: "Late cancellation charge",
};

/** Available to either the owning teacher or the subscription's own payer (guardian) on the microsite. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { student: true, payer: true, ledgerEntries: { orderBy: { date: "asc" } } },
  });
  if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teacherSession = await auth();
  const isOwningTeacher = teacherSession?.user?.id === subscription.student.teacherId;

  let hasMicrositeAccess = false;
  if (!isOwningTeacher) {
    const micrositeSession = await getMicrositeSession();
    hasMicrositeAccess = micrositeSession?.type === "guardian" && micrositeSession.payerId === subscription.payerId;
  }

  if (!isOwningTeacher && !hasMicrositeAccess) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const entries = subscription.ledgerEntries.filter(
    (e) => (!from || e.date >= from) && (!to || e.date <= to)
  );

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: subscription.student.teacherId } });

  const lineItems: InvoiceLineItem[] = entries.map((e) => ({
    date: e.date,
    description: REASON_LABEL[e.reason] ?? e.reason,
    amount: e.operation === "DEBIT" ? Number(e.amount) : -Number(e.amount),
  }));

  const pdfBytes = await renderInvoicePdf({
    teacherName: teacher.name,
    teacherEmail: teacher.email,
    payerName: subscription.payer.name,
    payerEmail: subscription.payer.email,
    studentName: subscription.student.name,
    lineItems,
    generatedAt: new Date(),
    periodFrom: from,
    periodTo: to,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${subscription.id}.pdf"`,
    },
  });
}
