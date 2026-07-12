"use client";

import { useActionState } from "react";
import { addTemplateSectionAction } from "../actions";

export function SectionForm({ templateId }: { templateId: string }) {
  const boundAction = addTemplateSectionAction.bind(null, templateId);
  const [error, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="flex items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1">
        <label htmlFor="title" className="block text-xs font-medium text-neutral-700">
          Section title
        </label>
        <input
          id="title"
          name="title"
          placeholder="e.g. Long tones & breath control"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="w-40">
        <label htmlFor="estimatedLessons" className="block text-xs font-medium text-neutral-700">
          Est. lessons
        </label>
        <input
          id="estimatedLessons"
          name="estimatedLessons"
          type="number"
          min={1}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add section"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
