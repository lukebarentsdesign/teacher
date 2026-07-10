"use client";

import { useActionState, useState } from "react";
import { requestPaymentAction } from "./actions";

export function RequestPaymentForm({ subscriptionId }: { subscriptionId: string }) {
  const [state, formAction, pending] = useActionState(requestPaymentAction, undefined);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!state?.url) return;
    await navigator.clipboard.writeText(state.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <form action={formAction} className="flex items-end gap-3">
        <input type="hidden" name="subscriptionId" value={subscriptionId} />
        <div>
          <label htmlFor="requestAmount" className="block text-sm font-medium text-neutral-700">
            Amount (£)
          </label>
          <input
            id="requestAmount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-1 w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Creating link…" : "Create payment link"}
        </button>
      </form>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state?.url && (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <input
            readOnly
            value={state.url}
            className="flex-1 bg-transparent text-sm text-neutral-600 outline-none"
          />
          <button
            type="button"
            onClick={copyLink}
            className="text-sm text-neutral-900 underline"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
