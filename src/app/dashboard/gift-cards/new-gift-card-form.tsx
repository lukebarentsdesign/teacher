"use client";

import { useActionState } from "react";
import { createGiftCardAction } from "./actions";

type Payer = { id: string; name: string };

export function NewGiftCardForm({ payers }: { payers: Payer[] }) {
  const [error, action, pending] = useActionState(createGiftCardAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="w-32">
        <label htmlFor="initialValue" className="block text-xs font-medium text-neutral-700">
          Value (£)
        </label>
        <input
          id="initialValue"
          name="initialValue"
          type="number"
          min={1}
          step="0.01"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {payers.length > 0 && (
        <div className="flex-1">
          <label htmlFor="purchasedByPayerId" className="block text-xs font-medium text-neutral-700">
            Purchased by (optional)
          </label>
          <select
            id="purchasedByPayerId"
            name="purchasedByPayerId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">—</option>
            {payers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Issuing…" : "Issue gift card"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
