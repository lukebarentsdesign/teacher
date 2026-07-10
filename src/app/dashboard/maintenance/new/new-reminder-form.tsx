"use client";

import { useActionState } from "react";
import type { LoanableItem } from "@prisma/client";
import { createMaintenanceReminderAction } from "../actions";

export function NewReminderForm({ loanableItems }: { loanableItems: LoanableItem[] }) {
  const [error, formAction, pending] = useActionState(createMaintenanceReminderAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="itemDescription" className="block text-sm font-medium text-neutral-700">
          Item / task description
        </label>
        <input
          id="itemDescription"
          name="itemDescription"
          required
          placeholder="e.g. Restring violin, service pedal mechanism"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700">
          Due date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="loanableItemId" className="block text-sm font-medium text-neutral-700">
          Linked loanable item (optional)
        </label>
        <select
          id="loanableItemId"
          name="loanableItemId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">None</option>
          {loanableItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {loanableItems.length === 0 && (
          <p className="mt-1 text-xs text-neutral-400">
            No loanable items on file yet — this reminder will be teacher-only until one is
            linked.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save reminder"}
      </button>
    </form>
  );
}
