"use client";

import { useActionState } from "react";
import { createCertificationAction } from "./actions";

export function NewCertificationForm() {
  const [error, action, pending] = useActionState(createCertificationAction, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="certType" className="block text-sm font-medium text-neutral-700">
            Certification
          </label>
          <input
            id="certType"
            name="certType"
            placeholder="e.g. Paediatric First Aid"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="certNumber" className="block text-sm font-medium text-neutral-700">
            Certificate number (optional)
          </label>
          <input
            id="certNumber"
            name="certNumber"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="issuedDate" className="block text-sm font-medium text-neutral-700">
            Issued
          </label>
          <input
            id="issuedDate"
            name="issuedDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="expiryDate" className="block text-sm font-medium text-neutral-700">
            Expires (optional)
          </label>
          <input
            id="expiryDate"
            name="expiryDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-40">
          <label htmlFor="reminderDaysBefore" className="block text-sm font-medium text-neutral-700">
            Remind (days before)
          </label>
          <input
            id="reminderDaysBefore"
            name="reminderDaysBefore"
            type="number"
            min={1}
            placeholder="30"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add certification"}
      </button>
    </form>
  );
}
