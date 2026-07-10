"use client";

import { useActionState } from "react";
import { acceptContractAction } from "./actions";

export function AcceptContractForm() {
  const [error, formAction, pending] = useActionState(acceptContractAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="typedName" className="block text-sm font-medium text-neutral-700">
          Type your full name
        </label>
        <input
          id="typedName"
          name="typedName"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="agree" className="mt-0.5" />
        I have read and agree to these terms.
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Accept"}
      </button>
    </form>
  );
}
