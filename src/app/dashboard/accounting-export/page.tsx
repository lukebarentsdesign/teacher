export default function AccountingExportPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Accounting export</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Download your ledger as a CSV in a QuickBooks/Xero-importable format (Date, Description,
          Amount, Student, Payer). On-demand only — there&apos;s no scheduled/emailed version.
        </p>
      </div>

      <form action="/api/accounting-export" method="get" className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="from" className="block text-sm font-medium text-neutral-700">
              From (optional)
            </label>
            <input
              id="from"
              name="from"
              type="date"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="to" className="block text-sm font-medium text-neutral-700">
              To (optional)
            </label>
            <input
              id="to"
              name="to"
              type="date"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Download CSV
        </button>
      </form>
    </div>
  );
}
