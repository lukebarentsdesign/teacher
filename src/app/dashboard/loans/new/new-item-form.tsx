"use client";

import { useActionState } from "react";
import { createLoanableItemAction } from "../actions";

export function NewItemForm() {
  const [error, formAction, pending] = useActionState(createLoanableItemAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. 3/4 size violin"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-neutral-700">
          Type
        </label>
        <input
          id="type"
          name="type"
          required
          placeholder="e.g. instrument, book, CD"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="condition" className="block text-sm font-medium text-neutral-700">
          Condition (optional)
        </label>
        <input
          id="condition"
          name="condition"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium text-neutral-700">
          Value (£, optional)
        </label>
        <input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save item"}
      </button>
    </form>
  );
}
