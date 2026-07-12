import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taxYearRange, taxYearForDate } from "@/lib/mileage";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : taxYearForDate(new Date());
  const { start, end } = taxYearRange(year);

  const [payments, expenses, mileageLogs] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: {
        reason: "PAYMENT",
        date: { gte: start, lte: end },
        subscription: { student: { teacherId: session.user.id } },
      },
      include: { subscription: { include: { student: true, payer: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({
      where: { teacherId: session.user.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.mileageLog.findMany({
      where: { teacherId: session.user.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  const rows: string[] = ["Type,Date,Description,Amount"];
  for (const p of payments) {
    rows.push(
      [
        "Income",
        p.date.toISOString().slice(0, 10),
        csvEscape(`Payment — ${p.subscription.student.name} (${p.subscription.payer.name})`),
        p.amount.toString(),
      ].join(",")
    );
  }
  for (const e of expenses) {
    rows.push(
      ["Expense", e.date.toISOString().slice(0, 10), csvEscape(`${e.category}${e.note ? ` — ${e.note}` : ""}`), `-${e.amount.toString()}`].join(",")
    );
  }
  for (const m of mileageLogs) {
    rows.push(
      ["Mileage", m.date.toISOString().slice(0, 10), csvEscape(`${m.miles.toString()} miles${m.purpose ? ` — ${m.purpose}` : ""}`), ""].join(",")
    );
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tax-pack-${year}-${year + 1}.csv"`,
    },
  });
}
