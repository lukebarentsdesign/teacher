"use client";

import { useActionState } from "react";
import { recordPaymentAction } from "./actions";

export function RecordPaymentForm({ subscriptionId }: { subscriptionId: string }) {
  const [error, formAction, pending] = useActionState(recordPaymentAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />

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
        {pending ? "Recording…" : "Record payment"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
