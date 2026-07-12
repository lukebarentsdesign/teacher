"use client";

import { useActionState } from "react";
import { updateLoanableItemAction } from "../../actions";

type Item = { id: string; name: string; type: string; condition: string | null; value: string | null };

export function EditItemForm({ item }: { item: Item }) {
  const [error, formAction, pending] = useActionState(
    updateLoanableItemAction.bind(null, item.id),
    undefined
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={item.name}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-neutral-700">
          Type
        </label>
        <input
          id="type"
          name="type"
          required
          defaultValue={item.type}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="condition" className="block text-sm font-medium text-neutral-700">
          Condition (optional)
        </label>
        <input
          id="condition"
          name="condition"
          defaultValue={item.condition ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium text-neutral-700">
          Value (£, optional)
        </label>
        <input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item.value ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
