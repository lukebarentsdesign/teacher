"use client";

import { useActionState } from "react";
import { INVOICING_TARGET_CATEGORY_LABELS, INVOICING_TARGET_VALUES, type InvoicingTargetValue } from "@/lib/location-types";
import { setInvoicingTargetOptionActiveAction, updateInvoicingTargetOptionAction } from "./actions";

type Option = {
  id: string;
  label: string;
  invoicingTarget: InvoicingTargetValue;
  sortOrder: number;
  active: boolean;
};

function OptionRow({ option }: { option: Option }) {
  const [error, action, pending] = useActionState(updateInvoicingTargetOptionAction.bind(null, option.id), undefined);

  return (
    <form action={action} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_190px_90px_auto] sm:items-end">
      <div>
        <label htmlFor={`billing-label-${option.id}`} className="block text-xs font-medium text-neutral-500">Label</label>
        <input id={`billing-label-${option.id}`} name="label" defaultValue={option.label} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none" />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div>
        <label htmlFor={`billing-target-${option.id}`} className="block text-xs font-medium text-neutral-500">Bills like</label>
        <select id={`billing-target-${option.id}`} name="invoicingTarget" defaultValue={option.invoicingTarget} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none">
          {INVOICING_TARGET_VALUES.map((value) => (
            <option key={value} value={value}>{INVOICING_TARGET_CATEGORY_LABELS[value]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`billing-sort-${option.id}`} className="block text-xs font-medium text-neutral-500">Order</label>
        <input id={`billing-sort-${option.id}`} name="sortOrder" type="number" min="0" defaultValue={option.sortOrder} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50">
          {pending ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setInvoicingTargetOptionActiveAction(option.id, !option.active)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-500 transition-colors duration-150 hover:bg-neutral-50">
          {option.active ? "Hide" : "Show"}
        </button>
      </div>
    </form>
  );
}

export function InvoicingTargetOptionsList({ options }: { options: Option[] }) {
  if (options.length === 0) return <p className="text-sm text-neutral-500">No custom billing choices yet.</p>;

  return (
    <div className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
      {options.map((option) => <OptionRow key={option.id} option={option} />)}
    </div>
  );
}