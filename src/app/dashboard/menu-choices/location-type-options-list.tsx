"use client";

import { useActionState } from "react";
import { LOCATION_TYPE_CATEGORY_LABELS, LOCATION_TYPE_VALUES, type LocationTypeValue } from "@/lib/location-types";
import { setLocationTypeOptionActiveAction, updateLocationTypeOptionAction } from "./actions";

type Option = {
  id: string;
  label: string;
  locationType: LocationTypeValue;
  sortOrder: number;
  active: boolean;
};

function OptionRow({ option }: { option: Option }) {
  const [error, action, pending] = useActionState(updateLocationTypeOptionAction.bind(null, option.id), undefined);

  return (
    <form action={action} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_180px_90px_auto] sm:items-end">
      <div>
        <label htmlFor={`label-${option.id}`} className="block text-xs font-medium text-neutral-500">
          Label
        </label>
        <input
          id={`label-${option.id}`}
          name="label"
          defaultValue={option.label}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div>
        <label htmlFor={`locationType-${option.id}`} className="block text-xs font-medium text-neutral-500">
          Behaves like
        </label>
        <select
          id={`locationType-${option.id}`}
          name="locationType"
          defaultValue={option.locationType}
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
        <label htmlFor={`sortOrder-${option.id}`} className="block text-xs font-medium text-neutral-500">
          Order
        </label>
        <input
          id={`sortOrder-${option.id}`}
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={option.sortOrder}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setLocationTypeOptionActiveAction(option.id, !option.active)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-500 transition-colors duration-150 hover:bg-neutral-50"
        >
          {option.active ? "Hide" : "Show"}
        </button>
      </div>
    </form>
  );
}

export function LocationTypeOptionsList({ options }: { options: Option[] }) {
  if (options.length === 0) {
    return <p className="text-sm text-neutral-500">No custom venue types yet.</p>;
  }

  return (
    <div className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
      {options.map((option) => (
        <OptionRow key={option.id} option={option} />
      ))}
    </div>
  );
}