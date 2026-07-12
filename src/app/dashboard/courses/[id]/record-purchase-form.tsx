"use client";

import { useActionState } from "react";
import { recordCoursePurchaseAction } from "../actions";

type Payer = { id: string; name: string };

export function RecordPurchaseForm({ courseId, payers, defaultAmount }: { courseId: string; payers: Payer[]; defaultAmount: string }) {
  const [error, action, pending] = useActionState(recordCoursePurchaseAction.bind(null, courseId), undefined);

  if (payers.length === 0) return null;

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1">
        <label htmlFor="payerId" className="block text-xs font-medium text-neutral-700">
          Payer
        </label>
        <select
          id="payerId"
          name="payerId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            Choose…
          </option>
          {payers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <label htmlFor="amountPaid" className="block text-xs font-medium text-neutral-700">
          Amount paid (£)
        </label>
        <input
          id="amountPaid"
          name="amountPaid"
          type="number"
          min={0.01}
          step="0.01"
          defaultValue={defaultAmount}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Recording…" : "Record purchase"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
