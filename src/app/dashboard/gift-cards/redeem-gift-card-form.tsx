"use client";

import { useActionState } from "react";
import { redeemGiftCardAction } from "./actions";

type Subscription = { id: string; label: string };

export function RedeemGiftCardForm({ subscriptions }: { subscriptions: Subscription[] }) {
  const [error, action, pending] = useActionState(redeemGiftCardAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="w-40">
        <label htmlFor="code" className="block text-xs font-medium text-neutral-700">
          Gift card code
        </label>
        <input
          id="code"
          name="code"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="subscriptionId" className="block text-xs font-medium text-neutral-700">
          Apply to subscription
        </label>
        <select
          id="subscriptionId"
          name="subscriptionId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            Choose…
          </option>
          {subscriptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <label htmlFor="amount" className="block text-xs font-medium text-neutral-700">
          Amount (£)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={0.01}
          step="0.01"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Redeeming…" : "Redeem"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
