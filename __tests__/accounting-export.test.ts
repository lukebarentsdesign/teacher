import { formatLedgerEntriesAsCsv, type ExportableLedgerEntry } from "@/lib/accounting-export";

describe("formatLedgerEntriesAsCsv", () => {
  test("CREDIT is positive, DEBIT is negative", () => {
    const entries: ExportableLedgerEntry[] = [
      { date: new Date(2026, 0, 5), reason: "PAYMENT", operation: "CREDIT", amount: 50, note: null, studentName: "Alice", payerName: "Jo" },
      { date: new Date(2026, 0, 6), reason: "LESSON_DELIVERED", operation: "DEBIT", amount: 25, note: null, studentName: "Alice", payerName: "Jo" },
    ];
    const csv = formatLedgerEntriesAsCsv(entries);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Description,Amount,Student,Payer");
    expect(lines[1]).toContain("50.00");
    expect(lines[2]).toContain("-25.00");
  });

  test("escapes commas and quotes in description/name fields", () => {
    const entries: ExportableLedgerEntry[] = [
      { date: new Date(2026, 0, 5), reason: "MANUAL_CORRECTION", operation: "CREDIT", amount: 10, note: 'refund, "goodwill"', studentName: "Alice", payerName: "Jo" },
    ];
    const csv = formatLedgerEntriesAsCsv(entries);
    expect(csv).toContain('"MANUAL CORRECTION — refund, ""goodwill"""');
  });

  test("empty entries still produces just the header", () => {
    expect(formatLedgerEntriesAsCsv([])).toBe("Date,Description,Amount,Student,Payer");
  });
});
