"use client";

import { useActionState } from "react";
import { addTermPeriodAction, addHolidayPeriodAction } from "../actions";

export function PeriodForm({ calendarId, kind }: { calendarId: string; kind: "term" | "holiday" }) {
  const action = kind === "term" ? addTermPeriodAction : addHolidayPeriodAction;
  const [error, formAction, pending] = useActionState(action.bind(null, calendarId), undefined);

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div>
        <label className="block text-xs font-medium text-neutral-700">
          {kind === "term" ? "Term name (e.g. Autumn)" : "Holiday name (e.g. Half-term)"}
        </label>
        <input name="name" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-700">Start</label>
          <input name="startDate" type="date" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">End</label>
          <input name="endDate" type="date" className={inputClass} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : kind === "term" ? "Add term" : "Add holiday"}
      </button>
    </form>
  );
}
