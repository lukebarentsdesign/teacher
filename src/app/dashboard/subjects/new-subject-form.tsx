"use client";

import { useActionState } from "react";
import { createSubjectAction } from "./actions";

export function NewSubjectForm() {
  const [error, action, pending] = useActionState(createSubjectAction, undefined);

  return (
    <form action={action} className="flex items-end gap-2 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex-1">
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Subject name
        </label>
        <input
          id="name"
          name="name"
          placeholder="e.g. Flute, Piano, Yoga, Gymnastics"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add subject"}
      </button>
    </form>
  );
}
