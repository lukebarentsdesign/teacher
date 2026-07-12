"use client";

import { useActionState, useState } from "react";
import { createTeacherSchoolLinkAction } from "./actions";

type Row = { dayOfWeek: number; startTime: string; endTime: string; label?: string };

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function RowEditor({
  rows,
  setRows,
  withLabel = false,
}: {
  rows: Row[];
  setRows: (rows: Row[]) => void;
  withLabel?: boolean;
}) {
  function updateRow(index: number, patch: Partial<Row>) {
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
            value={row.startTime}
            onChange={(e) => updateRow(index, { startTime: e.target.value })}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="time"
            value={row.endTime}
            onChange={(e) => updateRow(index, { endTime: e.target.value })}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
          {withLabel && (
            <input
              type="text"
              placeholder="Label (e.g. Assembly)"
              value={row.label ?? ""}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          )}
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
        onClick={() => setRows([...rows, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }])}
        className="text-sm text-neutral-600 underline hover:text-neutral-900"
      >
        + Add row
      </button>
    </div>
  );
}

export function NewLinkForm({ locationId }: { locationId: string }) {
  const [error, formAction, pending] = useActionState(createTeacherSchoolLinkAction, undefined);
  const [availability, setAvailability] = useState<Row[]>([
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
  ]);
  const [protectedBlocks, setProtectedBlocks] = useState<Row[]>([]);

  return (
    <form action={formAction} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="availability" value={JSON.stringify(availability)} />
      <input type="hidden" name="protectedBlocks" value={JSON.stringify(protectedBlocks)} />

      <div>
        <label htmlFor="schedulingMode" className="block text-sm font-medium text-neutral-700">
          Scheduling mode
        </label>
        <select
          id="schedulingMode"
          name="schedulingMode"
          defaultValue="FIXED"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="FIXED">Fixed — same weekly slot all term</option>
          <option value="FLUID">Fluid — rotates across multiple slots</option>
        </select>
      </div>

      <div>
        <label htmlFor="taxHandling" className="block text-sm font-medium text-neutral-700">
          Tax handling here
        </label>
        <select
          id="taxHandling"
          name="taxHandling"
          defaultValue="SELF_EMPLOYED"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="SELF_EMPLOYED">Self-employed</option>
          <option value="PAYE_VIA_SCHOOL">PAYE via school</option>
        </select>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-neutral-700">Availability</p>
        <RowEditor rows={availability} setRows={setAvailability} />
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-neutral-700">
          Protected blocks (never schedule — assembly, lunch, exams)
        </p>
        <RowEditor rows={protectedBlocks} setRows={setProtectedBlocks} withLabel />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save engagement"}
      </button>
    </form>
  );
}
