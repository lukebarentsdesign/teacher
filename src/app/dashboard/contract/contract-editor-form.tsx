"use client";

import { useActionState } from "react";
import { saveContractAction } from "./actions";

export function ContractEditorForm({ initialContent }: { initialContent: string }) {
  const [error, formAction, pending] = useActionState(saveContractAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-neutral-700">
          Contract text
        </label>
        <textarea
          id="content"
          name="content"
          rows={16}
          required
          defaultValue={initialContent}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          placeholder="Explain the subscription/ledger model in plain terms — income smoothing, cancellation payouts, make-up credits, etc."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save as new version"}
      </button>
    </form>
  );
}
