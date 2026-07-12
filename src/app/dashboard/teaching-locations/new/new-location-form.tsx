"use client";

import { useActionState } from "react";
import { createSchoolAction } from "../actions";

export function NewLocationForm() {
  const [error, formAction, pending] = useActionState(createSchoolAction, undefined);

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
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="locationType" className="block text-sm font-medium text-neutral-700">
          Type
        </label>
        <select
          id="locationType"
          name="locationType"
          defaultValue="SCHOOL"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="SCHOOL">School</option>
          <option value="STUDENT_HOME">Student&apos;s home</option>
          <option value="TEACHER_BASE">My own base</option>
          <option value="HIRED_VENUE">Hired venue</option>
          <option value="ONLINE">Online</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-neutral-700">
          Address (optional)
        </label>
        <input
          id="address"
          name="address"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="invoicingTarget" className="block text-sm font-medium text-neutral-700">
          Who gets billed for lessons here?
        </label>
        <select
          id="invoicingTarget"
          name="invoicingTarget"
          defaultValue="PARENT"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="PARENT">Parent</option>
          <option value="SCHOOL">School</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="termStart" className="block text-sm font-medium text-neutral-700">
            Term start (optional)
          </label>
          <input
            id="termStart"
            name="termStart"
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="termEnd" className="block text-sm font-medium text-neutral-700">
            Term end (optional)
          </label>
          <input
            id="termEnd"
            name="termEnd"
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Needed later for the timetable generator to know how many weeks to schedule.
      </p>

      <div>
        <label htmlFor="primaryColor" className="block text-sm font-medium text-neutral-700">
          Brand color (optional)
        </label>
        <p className="mb-1 text-xs text-neutral-500">
          Colors this location&apos;s lessons on your calendar views.
        </p>
        <input
          id="primaryColor"
          name="primaryColor"
          type="color"
          defaultValue="#2a78d6"
          className="h-10 w-16 rounded-lg border border-neutral-300"
        />
      </div>

      <div>
        <label htmlFor="accessNotes" className="block text-sm font-medium text-neutral-700">
          Access notes (WiFi, door codes, parking — private to you)
        </label>
        <textarea
          id="accessNotes"
          name="accessNotes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save teaching location"}
      </button>
    </form>
  );
}
