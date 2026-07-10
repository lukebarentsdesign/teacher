"use client";

import { useActionState } from "react";
import type { Payer } from "@prisma/client";
import { linkPayerAction } from "./actions";

export function LinkPayerForm({ studentId, payers }: { studentId: string; payers: Payer[] }) {
  const [error, formAction, pending] = useActionState(linkPayerAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="flex-1">
        <label htmlFor="payerId" className="block text-sm font-medium text-neutral-700">
          Link an existing payer
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Linking…" : "Link"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
