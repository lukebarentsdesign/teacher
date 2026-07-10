import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

function wrapLine(text: string, maxWidth: number, font: import("pdf-lib").PDFFont, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders a plain-text contract snapshot to a simple paginated PDF — this is an unsigned,
 * optional downloadable copy for the parent's own records, not the mechanism of agreement
 * (that's the ContractAcceptance row). Keep it simple; no need for a templating engine here.
 */
export async function renderContractSnapshotPdf(params: {
  content: string;
  version: number;
  typedName: string;
  acceptedAt: Date;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded() {
    if (y < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawLine(text: string, useBold = false) {
    newPageIfNeeded();
    page.drawText(text, {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font: useBold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= LINE_HEIGHT;
  }

  drawLine(`Contract — version ${params.version}`, true);
  drawLine(`Accepted by ${params.typedName} on ${params.acceptedAt.toLocaleDateString("en-GB")}`, true);
  y -= LINE_HEIGHT;

  for (const paragraph of params.content.split("\n")) {
    if (paragraph.trim() === "") {
      y -= LINE_HEIGHT;
      continue;
    }
    for (const line of wrapLine(paragraph, maxWidth, font, FONT_SIZE)) {
      drawLine(line);
    }
  }

  return pdfDoc.save();
}
