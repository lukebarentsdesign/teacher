"use client";

export type OpenHoursRow = { dayOfWeek: number; openTime: string; closeTime: string };

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function OpenHoursEditor({
  rows,
  setRows,
}: {
  rows: OpenHoursRow[];
  setRows: (rows: OpenHoursRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<OpenHoursRow>) {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            value={row.dayOfWeek}
            onChange={(e) => updateRow(index, { dayOfWeek: Number(e.target.value) })}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={row.openTime}
            onChange={(e) => updateRow(index, { openTime: e.target.value })}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="time"
            value={row.closeTime}
            onChange={(e) => updateRow(index, { closeTime: e.target.value })}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => setRows(rows.filter((_, i) => i !== index))}
            className="text-xs text-neutral-400 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, { dayOfWeek: 1, openTime: "09:00", closeTime: "17:00" }])}
        className="text-sm text-neutral-600 underline hover:text-neutral-900"
      >
        + Add row
      </button>
    </div>
  );
}
