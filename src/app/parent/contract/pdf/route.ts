import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";
import { renderContractSnapshotPdf } from "@/lib/contract-pdf";

export async function GET() {
  const session = await getMicrositeSession();
  if (!session || session.type !== "guardian") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const acceptance = await prisma.contractAcceptance.findFirst({
    where: { payerId: session.payerId },
    orderBy: { contractVersion: "desc" },
  });

  if (!acceptance) {
    return NextResponse.json({ error: "No accepted contract found" }, { status: 404 });
  }

  const pdfBytes = await renderContractSnapshotPdf({
    content: acceptance.contractSnapshot,
    version: acceptance.contractVersion,
    typedName: acceptance.typedName,
    acceptedAt: acceptance.acceptedAt,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contract-v${acceptance.contractVersion}.pdf"`,
    },
  });
}
