"use client";

import { useActionState, useState } from "react";
import { createRoomAction } from "./actions";

type OpenHoursRow = { dayOfWeek: number; openTime: string; closeTime: string };

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function OpenHoursEditor({
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

export function NewRoomForm({ schoolId }: { schoolId: string }) {
  const [error, formAction, pending] = useActionState(createRoomAction, undefined);
  const [openHours, setOpenHours] = useState<OpenHoursRow[]>([]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="openHours" value={JSON.stringify(openHours)} />

      <div>
        <label htmlFor="label" className="block text-sm font-medium text-neutral-700">
          Room label
        </label>
        <input
          id="label"
          name="label"
          type="text"
          required
          placeholder="e.g. Music room 2"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="floor" className="block text-sm font-medium text-neutral-700">
          Floor (optional)
        </label>
        <input
          id="floor"
          name="floor"
          type="text"
          placeholder="e.g. 1st"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="hasPiano" value="true" />
          Has piano
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="hasMirrors" value="true" />
          Has mirrors
        </label>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-neutral-700">Open hours (optional)</p>
        <OpenHoursEditor rows={openHours} setRows={setOpenHours} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add room"}
      </button>
    </form>
  );
}
