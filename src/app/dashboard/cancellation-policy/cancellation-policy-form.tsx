"use client";

import { useActionState } from "react";
import { upsertCancellationPolicyAction, deleteCancellationPolicyAction } from "./actions";

type Policy = {
  id: string;
  noticeHoursRequired: number;
  lateCancelAction: string;
  noShowAction: string;
  partialChargePercent: number | null;
} | null;

const ACTION_OPTIONS = [
  { value: "CREDIT", label: "Free — banked make-up credit (no charge)" },
  { value: "PARTIAL_CHARGE", label: "Partial charge" },
  { value: "FULL_CHARGE", label: "Full charge" },
  { value: "FORFEIT", label: "Forfeit — no charge, no make-up owed" },
];

export function CancellationPolicyForm({ locationId, policy }: { locationId: string | null; policy: Policy }) {
  const boundAction = upsertCancellationPolicyAction.bind(null, locationId);
  const [error, action, pending] = useActionState(boundAction, undefined);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <form action={action} className="space-y-3">
        <div>
          <label htmlFor="noticeHoursRequired" className="block text-sm font-medium text-neutral-700">
            Notice required (hours)
          </label>
          <input
            id="noticeHoursRequired"
            name="noticeHoursRequired"
            type="number"
            min={0}
            defaultValue={policy?.noticeHoursRequired ?? 24}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Cancellations with at least this much notice are always free, regardless of the actions below.
          </p>
        </div>
        <div>
          <label htmlFor="lateCancelAction" className="block text-sm font-medium text-neutral-700">
            Late cancellation (told you, but not enough notice)
          </label>
          <select
            id="lateCancelAction"
            name="lateCancelAction"
            defaultValue={policy?.lateCancelAction ?? "CREDIT"}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="noShowAction" className="block text-sm font-medium text-neutral-700">
            No-show (no notice at all)
          </label>
          <select
            id="noShowAction"
            name="noShowAction"
            defaultValue={policy?.noShowAction ?? "CREDIT"}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="partialChargePercent" className="block text-sm font-medium text-neutral-700">
            Partial charge percent
          </label>
          <input
            id="partialChargePercent"
            name="partialChargePercent"
            type="number"
            min={1}
            max={100}
            defaultValue={policy?.partialChargePercent ?? 50}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-400">Only used where either action above is set to Partial charge.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : policy ? "Save changes" : "Set policy"}
          </button>
          {policy && (
            <button
              type="button"
              onClick={() => deleteCancellationPolicyAction(policy.id, locationId)}
              className="text-xs text-red-600 underline hover:text-red-800"
            >
              Remove policy (revert to always-free)
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
