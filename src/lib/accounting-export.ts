export type ExportableLedgerEntry = {
  date: Date;
  reason: string;
  operation: "CREDIT" | "DEBIT";
  amount: number;
  note: string | null;
  studentName: string;
  payerName: string;
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Generic QuickBooks/Xero-importable CSV — both accept a plain Date/Description/Amount format.
 * CREDIT (cash/credit in, e.g. PAYMENT) is positive; DEBIT (a charge against the balance, e.g.
 * LESSON_DELIVERED) is negative — a standard signed-amount transaction ledger convention.
 */
export function formatLedgerEntriesAsCsv(entries: ExportableLedgerEntry[]): string {
  const header = ["Date", "Description", "Amount", "Student", "Payer"];
  const rows = entries.map((e) => {
    const amount = e.operation === "CREDIT" ? e.amount : -e.amount;
    const description = [e.reason.replace(/_/g, " "), e.note].filter(Boolean).join(" — ");
    return [
      e.date.toISOString().slice(0, 10),
      csvEscape(description),
      amount.toFixed(2),
      csvEscape(e.studentName),
      csvEscape(e.payerName),
    ].join(",");
  });
  return [header.join(","), ...rows].join("\n");
}
