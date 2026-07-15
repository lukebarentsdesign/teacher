"use client";

import { useActionState } from "react";
import { INVOICING_TARGET_CATEGORY_LABELS, INVOICING_TARGET_VALUES } from "@/lib/location-types";
import { createInvoicingTargetOptionAction } from "./actions";

export function NewInvoicingTargetOptionForm() {
  const [error, action, pending] = useActionState(createInvoicingTargetOptionAction, undefined);

  return (
    <form action={action} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Add a billing choice</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Add who pays labels that match your setup, while keeping the billing route clear underneath.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_190px_90px]">
        <div>
          <label htmlFor="billing-label" className="block text-sm font-medium text-neutral-700">Label</label>
          <input id="billing-label" name="label" placeholder="e.g. Sponsor" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="invoicingTarget" className="block text-sm font-medium text-neutral-700">Bills like</label>
          <select id="invoicingTarget" name="invoicingTarget" defaultValue="PARENT" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none">
            {INVOICING_TARGET_VALUES.map((value) => (
              <option key={value} value={value}>{INVOICING_TARGET_CATEGORY_LABELS[value]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="billing-sort" className="block text-sm font-medium text-neutral-700">Order</label>
          <input id="billing-sort" name="sortOrder" type="number" min="0" defaultValue="0" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50">
        {pending ? "Adding..." : "Add billing choice"}
      </button>
    </form>
  );
}