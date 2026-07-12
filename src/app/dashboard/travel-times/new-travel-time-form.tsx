"use client";

import { useActionState } from "react";
import { upsertTravelTimeAction } from "./actions";

type Location = { id: string; name: string };

export function NewTravelTimeForm({ locations }: { locations: Location[] }) {
  const [error, action, pending] = useActionState(upsertTravelTimeAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1">
        <label htmlFor="fromLocationId" className="block text-xs font-medium text-neutral-700">
          From
        </label>
        <select
          id="fromLocationId"
          name="fromLocationId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            Choose…
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label htmlFor="toLocationId" className="block text-xs font-medium text-neutral-700">
          To
        </label>
        <select
          id="toLocationId"
          name="toLocationId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            Choose…
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-28">
        <label htmlFor="minutes" className="block text-xs font-medium text-neutral-700">
          Minutes
        </label>
        <input
          id="minutes"
          name="minutes"
          type="number"
          min={1}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
