import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireOrganisationMember } from "@/lib/auth-helpers";
import { formatLedgerEntriesAsCsv, type ExportableLedgerEntry } from "@/lib/accounting-export";

/**
 * On-demand export only — no scheduled/emailed version. There's no cron/email-send infra in this
 * app to build a "scheduled" export reliably (same category of decision as skipping a QR code lib
 * for the self-serve onboarding link), so this is a plain authenticated download endpoint.
 */
export async function GET(request: NextRequest) {
  let authContext;
  try {
    authContext = await requireSession(request.headers);
  } catch (error) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const organisationId = searchParams.get("organisationId") || authContext.session?.activeOrganizationId;

  if (!organisationId) {
    return NextResponse.json({ error: "Organisation ID required" }, { status: 400 });
  }

  try {
    await requireOrganisationMember(authContext, organisationId);
  } catch (error) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      subscription: { 
        is: {
          student: { 
            is: {
              teacher: {
                is: {
                  organisationId: organisationId 
                }
              }
            }
          } 
        }
      },
      ...(from || to ? { date: dateFilter } : {}),
    },
    include: { subscription: { include: { student: true, payer: true } } },
    orderBy: { date: "asc" },
  });

  const exportable: ExportableLedgerEntry[] = entries.map((e) => ({
    date: e.date,
    reason: e.reason,
    operation: e.operation,
    amount: Number(e.amount),
    note: e.note,
    studentName: e.subscription.student.name,
    payerName: e.subscription.payer.name,
  }));

  const csv = formatLedgerEntriesAsCsv(exportable);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ledger-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
