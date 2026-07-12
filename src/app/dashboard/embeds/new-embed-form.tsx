"use client";

import { useActionState } from "react";
import { createEmbedConfigAction } from "./actions";

type Location = { id: string; name: string };
type LessonType = { id: string; name: string };

export function NewEmbedForm({ locations, lessonTypes }: { locations: Location[]; lessonTypes: LessonType[] }) {
  const [error, action, pending] = useActionState(createEmbedConfigAction, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-neutral-700">
          Name (for your own reference)
        </label>
        <input
          id="label"
          name="label"
          placeholder="e.g. Facebook bio link"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-3">
        {locations.length > 0 && (
          <div className="flex-1">
            <label htmlFor="locationId" className="block text-sm font-medium text-neutral-700">
              Scope to location (optional)
            </label>
            <select
              id="locationId"
              name="locationId"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1">
          <label htmlFor="brandColor" className="block text-sm font-medium text-neutral-700">
            Heading color (optional)
          </label>
          <input
            id="brandColor"
            name="brandColor"
            type="color"
            defaultValue="#171717"
            className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2"
          />
        </div>
      </div>
      {lessonTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Limit to lesson types (optional — leave all unchecked for everything)
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            {lessonTypes.map((lt) => (
              <label key={lt.id} className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs">
                <input type="checkbox" name="lessonTypeIds" value={lt.id} />
                {lt.name}
              </label>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create embed"}
      </button>
    </form>
  );
}
