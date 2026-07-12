"use client";

import { useActionState, useTransition } from "react";
import { createVenueFeeArrangementAction, deleteVenueFeeArrangementAction } from "./actions";

type Arrangement = {
  id: string;
  feeType: string;
  amount: string;
  billingMode: string;
  notes: string | null;
};

const FEE_TYPE_LABEL: Record<string, string> = {
  FLAT_PER_SESSION: "Flat, per session",
  PERCENT_OF_LESSON_FEE: "% of lesson fee",
  PERIOD_RENTAL: "Period rental (e.g. termly)",
};

export function VenueFeeArrangements({ locationId, arrangements }: { locationId: string; arrangements: Arrangement[] }) {
  const [error, action, pending] = useActionState(createVenueFeeArrangementAction, undefined);
  const [removing, startRemove] = useTransition();

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Your own cost for using this venue — feeds the income forecast. Absorbed into your
        LessonType pricing by default; only itemised as a separate charge to the payer if you
        explicitly set that below.
      </p>

      {arrangements.length > 0 && (
        <ul className="space-y-2">
          {arrangements.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-neutral-800">£{a.amount}</span>
                <span className="ml-2 text-neutral-500">{FEE_TYPE_LABEL[a.feeType]}</span>
                {a.billingMode === "ITEMISED_TO_PAYER" && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Itemised to payer
                  </span>
                )}
                {a.notes && <p className="mt-0.5 text-xs text-neutral-400">{a.notes}</p>}
              </div>
              <button
                type="button"
                disabled={removing}
                onClick={() => startRemove(() => deleteVenueFeeArrangementAction(a.id, locationId))}
                className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <input type="hidden" name="locationId" value={locationId} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700">Fee type</label>
            <select name="feeType" defaultValue="FLAT_PER_SESSION" className={inputClass}>
              <option value="FLAT_PER_SESSION">Flat, per session</option>
              <option value="PERCENT_OF_LESSON_FEE">% of lesson fee</option>
              <option value="PERIOD_RENTAL">Period rental</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700">Amount</label>
            <input name="amount" type="number" step="0.01" min="0.01" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">Billing</label>
          <select name="billingMode" defaultValue="ABSORBED_INTO_FEE" className={inputClass}>
            <option value="ABSORBED_INTO_FEE">Absorbed into my lesson pricing (default)</option>
            <option value="ITEMISED_TO_PAYER">Itemise as its own charge to the payer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">Notes (optional)</label>
          <input name="notes" className={inputClass} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add venue fee"}
        </button>
      </form>
    </div>
  );
}
