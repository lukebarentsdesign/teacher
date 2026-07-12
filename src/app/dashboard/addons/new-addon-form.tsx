"use client";

import { useActionState } from "react";
import { createAddOnAction } from "./actions";

export function NewAddOnForm() {
  const [error, action, pending] = useActionState(createAddOnAction, undefined);

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <form action={action} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Name
        </label>
        <input id="name" name="name" placeholder="e.g. Instrument hire" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-neutral-700">
            Price (£)
          </label>
          <input id="price" name="price" type="number" step="0.01" min="0.01" className={inputClass} />
        </div>
        <div>
          <label htmlFor="chargeUnit" className="block text-sm font-medium text-neutral-700">
            Charge unit
          </label>
          <select id="chargeUnit" name="chargeUnit" defaultValue="PER_BOOKING" className={inputClass}>
            <option value="PER_BOOKING">Per booking</option>
            <option value="PER_HOUR">Per hour</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-neutral-700">
          Visibility
        </label>
        <select id="visibility" name="visibility" defaultValue="PUBLIC" className={inputClass}>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private — teacher use only</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add add-on"}
      </button>
    </form>
  );
}
