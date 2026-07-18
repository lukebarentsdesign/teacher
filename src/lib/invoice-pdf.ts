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
  invoiceNumber?: string;
  businessName?: string | null;
  businessAddress?: string | null;
  paymentInstructions?: string | null;
  teacherName: string;
  teacherEmail: string;
  payerName: string;
  payerEmail: string | null;
  studentName: string;
  lineItems: InvoiceLineItem[];
  generatedAt: Date;
  periodFrom?: Date;
  periodTo?: Date;
  dueDate?: Date;
  teacherAddress?: string;
  teacherBankDetails?: string;
  teacherStripeLink?: string;
};

/**
 * Renders a professional PDF invoice from frozen snapshot details or live data.
 */
export async function renderInvoicePdf(params: InvoiceParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded(neededHeight = LINE_HEIGHT * 2) {
    if (y < MARGIN + neededHeight) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawText(text: string, x: number, useBold = false, size = FONT_SIZE) {
    page.drawText(text, { x, y, size, font: useBold ? boldFont : font, color: rgb(0.1, 0.1, 0.1) });
  }

  // Header Title
  drawText(params.invoiceNumber ? `Invoice ${params.invoiceNumber}` : "Invoice Statement", MARGIN, true, 20);
  y -= 24;
  drawText(`Issued: ${params.generatedAt.toLocaleDateString("en-GB")}`, MARGIN, false, 9);
  y -= 12;
  if (params.dueDate) {
    drawText(`Due by: ${params.dueDate.toLocaleDateString("en-GB")}`, MARGIN, true, 9);
    y -= 12;
  }
  y -= LINE_HEIGHT * 1.5;

  // Business / Sender Details
  const displaySender = params.businessName || params.teacherName;
  drawText(displaySender, MARGIN, true, 11);
  y -= LINE_HEIGHT;
  
  const displayAddress = params.businessAddress || params.teacherAddress;
  if (displayAddress) {
    const lines = displayAddress.split("\n");
    for (const line of lines) {
      drawText(line.trim(), MARGIN, false, 9);
      y -= 12;
    }
  }
  drawText(params.teacherEmail, MARGIN, false, 9);
  y -= LINE_HEIGHT * 2;

  // Recipient / Client Details
  drawText("Billed to:", MARGIN, true, 10);
  y -= LINE_HEIGHT;
  drawText(`${params.payerName} (for ${params.studentName})`, MARGIN, false, 10);
  y -= LINE_HEIGHT;
  if (params.payerEmail) {
    drawText(params.payerEmail, MARGIN, false, 9);
    y -= LINE_HEIGHT;
  }
  if (params.periodFrom && params.periodTo) {
    drawText(
      `Billing Period: ${params.periodFrom.toLocaleDateString("en-GB")} – ${params.periodTo.toLocaleDateString("en-GB")}`,
      MARGIN,
      false,
      9
    );
    y -= LINE_HEIGHT;
  }
  y -= LINE_HEIGHT * 1.5;

  // Table Columns
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
  y -= 8;

  // Line Items
  let total = 0;
  for (const item of params.lineItems) {
    newPageIfNeeded();
    total += item.amount;
    
    const dateStr = item.date instanceof Date ? item.date.toLocaleDateString("en-GB") : new Date(item.date).toLocaleDateString("en-GB");
    drawText(dateStr, colDate);
    drawText(item.description.slice(0, 45), colDesc);
    drawText(`£${item.amount.toFixed(2)}`, colAmount);
    y -= LINE_HEIGHT;
  }

  y -= 8;
  newPageIfNeeded(LINE_HEIGHT * 4);
  page.drawLine({
    start: { x: MARGIN, y: y + 12 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= LINE_HEIGHT;
  drawText("Total Due", colDesc, true, 11);
  drawText(`£${total.toFixed(2)}`, colAmount, true, 11);
  
  // Payment Instructions
  const displayInstructions = params.paymentInstructions || params.teacherBankDetails;
  if (displayInstructions) {
    y -= LINE_HEIGHT * 3;
    newPageIfNeeded(LINE_HEIGHT * 4);
    drawText("Payment Instructions:", MARGIN, true, 10);
    y -= LINE_HEIGHT;
    const instLines = displayInstructions.split("\n");
    for (const line of instLines) {
      drawText(line.trim(), MARGIN, false, 9);
      y -= 12;
    }
  }

  if (params.teacherStripeLink) {
    y -= LINE_HEIGHT * 2;
    newPageIfNeeded();
    drawText(`Pay Online (Stripe): ${params.teacherStripeLink}`, MARGIN, false, 9);
    y -= LINE_HEIGHT;
  }

  return pdfDoc.save();
}
