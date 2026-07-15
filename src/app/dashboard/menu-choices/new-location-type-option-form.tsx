"use client";

import { useActionState } from "react";
import { LOCATION_TYPE_CATEGORY_LABELS, LOCATION_TYPE_VALUES } from "@/lib/location-types";
import { createLocationTypeOptionAction } from "./actions";

export function NewLocationTypeOptionForm() {
  const [error, action, pending] = useActionState(createLocationTypeOptionAction, undefined);

  return (
    <form action={action} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Add a venue type</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Add labels that match your world: studio, community centre, sports hall, clinic, theatre, or anything else.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px_90px]">
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-neutral-700">
            Label
          </label>
          <input
            id="label"
            name="label"
            placeholder="e.g. Dance studio"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="locationType" className="block text-sm font-medium text-neutral-700">
            Behaves like
          </label>
          <select
            id="locationType"
            name="locationType"
            defaultValue="HIRED_VENUE"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            {LOCATION_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {LOCATION_TYPE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-neutral-700">
            Order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue="0"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add choice"}
      </button>
    </form>
  );
}