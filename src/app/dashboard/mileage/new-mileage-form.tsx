"use client";

import { useActionState } from "react";
import { createMileageLogAction } from "./actions";

type Location = { id: string; name: string };

export function NewMileageForm({ locations }: { locations: Location[] }) {
  const [error, action, pending] = useActionState(createMileageLogAction, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex gap-3">
        <div className="w-40">
          <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-32">
          <label htmlFor="miles" className="block text-sm font-medium text-neutral-700">
            Miles
          </label>
          <input
            id="miles"
            name="miles"
            type="number"
            min={0.1}
            step="0.1"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="purpose" className="block text-sm font-medium text-neutral-700">
            Purpose (optional)
          </label>
          <input
            id="purpose"
            name="purpose"
            placeholder="e.g. Home to St Mary's"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      {locations.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="fromLocationId" className="block text-sm font-medium text-neutral-700">
              From (optional)
            </label>
            <select
              id="fromLocationId"
              name="fromLocationId"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            >
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="toLocationId" className="block text-sm font-medium text-neutral-700">
              To (optional)
            </label>
            <select
              id="toLocationId"
              name="toLocationId"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            >
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log trip"}
      </button>
    </form>
  );
}
