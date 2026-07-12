"use client";

import { useActionState } from "react";
import { createCourseAction } from "./actions";

export function NewCourseForm() {
  const [error, action, pending] = useActionState(createCourseAction, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          placeholder="e.g. Flute Warm-ups Video Library"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            Description (optional)
          </label>
          <input
            id="description"
            name="description"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-32">
          <label htmlFor="price" className="block text-sm font-medium text-neutral-700">
            Price (£, optional)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0.01}
            step="0.01"
            placeholder="Free"
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
        {pending ? "Creating…" : "New course"}
      </button>
    </form>
  );
}
