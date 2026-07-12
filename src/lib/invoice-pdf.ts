import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const FONT_SIZE = 10;
const LINE_HEIGHT = 16;

export type InvoiceLineItem = {
  date: Date;
  description: string;
  amount: number; // positive = charge, negative = credit/payment
};

export type InvoiceParams = {
  teacherName: string;
  teacherEmail: string;
  payerName: string;
  payerEmail: string | null;
  studentName: string;
  lineItems: InvoiceLineItem[];
  generatedAt: Date;
  periodFrom?: Date;
  periodTo?: Date;
};

/**
 * A document layer only — rendered directly from existing LedgerEntry data, no new billing
 * entities. Not a replacement for the Stripe receipt/payment record, just a formatted document
 * some payers want for reimbursement/reconciliation/their own tax paperwork. Same pdf-lib
 * approach as contract-pdf.ts, deliberately not sharing code since the layouts differ enough
 * (a table vs. flowing paragraphs) that a shared abstraction would be more trouble than it's worth.
 */
export async function renderInvoicePdf(params: InvoiceParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded() {
    if (y < MARGIN + LINE_HEIGHT * 3) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawText(text: string, x: number, useBold = false, size = FONT_SIZE) {
    page.drawText(text, { x, y, size, font: useBold ? boldFont : font, color: rgb(0.1, 0.1, 0.1) });
  }

  drawText("Invoice", MARGIN, true, 20);
  y -= 28;
  drawText(`Generated ${params.generatedAt.toLocaleDateString("en-GB")}`, MARGIN);
  y -= LINE_HEIGHT * 2;

  drawText(params.teacherName, MARGIN, true);
  y -= LINE_HEIGHT;
  drawText(params.teacherEmail, MARGIN);
  y -= LINE_HEIGHT * 2;

  drawText("Billed to", MARGIN, true);
  y -= LINE_HEIGHT;
  drawText(`${params.payerName} (for ${params.studentName})`, MARGIN);
  y -= LINE_HEIGHT;
  if (params.payerEmail) {
    drawText(params.payerEmail, MARGIN);
    y -= LINE_HEIGHT;
  }
  if (params.periodFrom && params.periodTo) {
    drawText(
      `Period: ${params.periodFrom.toLocaleDateString("en-GB")} – ${params.periodTo.toLocaleDateString("en-GB")}`,
      MARGIN
    );
    y -= LINE_HEIGHT;
  }
  y -= LINE_HEIGHT;

  const colDate = MARGIN;
  const colDesc = MARGIN + 80;
  const colAmount = PAGE_WIDTH - MARGIN - 70;

  drawText("Date", colDate, true);
  drawText("Description", colDesc, true);
  drawText("Amount", colAmount, true);
  y -= LINE_HEIGHT;
  page.drawLine({
    start: { x: MARGIN, y: y + 4 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 4;

  let total = 0;
  for (const item of params.lineItems) {
    newPageIfNeeded();
    total += item.amount;
    drawText(item.date.toLocaleDateString("en-GB"), colDate);
    drawText(item.description.slice(0, 40), colDesc);
    drawText(`£${item.amount.toFixed(2)}`, colAmount);
    y -= LINE_HEIGHT;
  }

  y -= LINE_HEIGHT;
  page.drawLine({
    start: { x: MARGIN, y: y + 12 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  drawText("Total", colDesc, true);
  drawText(`£${total.toFixed(2)}`, colAmount, true);

  return pdfDoc.save();
}
