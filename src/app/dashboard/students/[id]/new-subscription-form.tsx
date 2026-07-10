"use client";

import { useActionState } from "react";
import type { Payer } from "@prisma/client";
import { createSubscriptionAction } from "./actions";

export function NewSubscriptionForm({ studentId, payers }: { studentId: string; payers: Payer[] }) {
  const [error, formAction, pending] = useActionState(createSubscriptionAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <input type="hidden" name="studentId" value={studentId} />

      <div>
        <label htmlFor="payerId" className="block text-sm font-medium text-neutral-700">
          Payer
        </label>
        <select
          id="payerId"
          name="payerId"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {payers.map((payer) => (
            <option key={payer.id} value={payer.id}>
              {payer.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="billingModel" className="block text-sm font-medium text-neutral-700">
          Billing model
        </label>
        <select
          id="billingModel"
          name="billingModel"
          defaultValue="SMOOTHED_SUBSCRIPTION"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="SMOOTHED_SUBSCRIPTION">Smoothed subscription (annual ÷ 12)</option>
          <option value="PER_LESSON">Per lesson</option>
          <option value="HOURLY">Hourly</option>
          <option value="TERMLY">Termly</option>
        </select>
      </div>

      <div>
        <label htmlFor="annualFee" className="block text-sm font-medium text-neutral-700">
          Annual fee (£)
        </label>
        <input
          id="annualFee"
          name="annualFee"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700">
          Start date
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Create subscription"}
      </button>
    </form>
  );
}
