"use client";

import { useActionState } from "react";
import { createExpenseAction } from "./actions";

export function NewExpenseForm() {
  const [error, formAction, pending] = useActionState(createExpenseAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">
          Amount (£)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
          Category
        </label>
        <input
          id="category"
          name="category"
          required
          placeholder="e.g. Travel"
          className="mt-1 w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="note" className="block text-sm font-medium text-neutral-700">
          Note (optional)
        </label>
        <input
          id="note"
          name="note"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add expense"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
