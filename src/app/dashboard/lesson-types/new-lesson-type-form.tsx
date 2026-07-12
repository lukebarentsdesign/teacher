"use client";

import { useActionState } from "react";
import { createLessonTypeAction } from "./actions";

type Location = { id: string; name: string };

export function NewLessonTypeForm({ locations }: { locations: Location[] }) {
  const [error, action, pending] = useActionState(createLessonTypeAction, undefined);

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <form action={action} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Name
        </label>
        <input id="name" name="name" placeholder="e.g. Flute — Beginner" className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description (optional)
        </label>
        <input id="description" name="description" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="defaultDurationMinutes" className="block text-sm font-medium text-neutral-700">
            Default duration (mins)
          </label>
          <input
            id="defaultDurationMinutes"
            name="defaultDurationMinutes"
            type="number"
            min="1"
            defaultValue="30"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="defaultFee" className="block text-sm font-medium text-neutral-700">
            Default fee (£)
          </label>
          <input
            id="defaultFee"
            name="defaultFee"
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
          />
        </div>
      </div>

      {locations.length > 0 && (
        <div>
          <p className="mb-1.5 block text-sm font-medium text-neutral-700">
            Offered at (optional)
          </p>
          <p className="mb-2 text-xs text-neutral-500">
            Leave all unchecked to offer this everywhere. Check specific locations to restrict it
            (e.g. group flute only at one school).
          </p>
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <label
                key={location.id}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white"
              >
                <input type="checkbox" name="locationIds" value={location.id} className="sr-only" />
                {location.name}
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
        {pending ? "Adding…" : "Add lesson type"}
      </button>
    </form>
  );
}
