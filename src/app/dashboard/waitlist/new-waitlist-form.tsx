"use client";

import { useActionState } from "react";
import { createWaitlistEntryAction } from "./actions";

type LessonType = { id: string; name: string };
type Location = { id: string; name: string };

export function NewWaitlistForm({ lessonTypes, locations }: { lessonTypes: LessonType[]; locations: Location[] }) {
  const [error, action, pending] = useActionState(createWaitlistEntryAction, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="contactName" className="block text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            id="contactName"
            name="contactName"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="contactEmail" className="block text-sm font-medium text-neutral-700">
            Email (optional)
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="contactPhone" className="block text-sm font-medium text-neutral-700">
            Phone (optional)
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-3">
        {lessonTypes.length > 0 && (
          <div className="flex-1">
            <label htmlFor="lessonTypeId" className="block text-sm font-medium text-neutral-700">
              Lesson type (optional)
            </label>
            <select
              id="lessonTypeId"
              name="lessonTypeId"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            >
              <option value="">Any</option>
              {lessonTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {locations.length > 0 && (
          <div className="flex-1">
            <label htmlFor="locationId" className="block text-sm font-medium text-neutral-700">
              Location (optional)
            </label>
            <select
              id="locationId"
              name="locationId"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            >
              <option value="">Any</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
          Notes (optional)
        </label>
        <input
          id="notes"
          name="notes"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to waitlist"}
      </button>
    </form>
  );
}
