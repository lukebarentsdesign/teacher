"use client";

import { useActionState } from "react";
import { updateSchoolAction } from "../../actions";

type Location = {
  id: string;
  name: string;
  address: string | null;
  invoicingTarget: string;
  termStart: string | null;
  termEnd: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  locationType: string;
  accessNotes: string | null;
  termCalendarId: string | null;
};

type TermCalendar = { id: string; name: string };

export function EditLocationForm({
  location,
  termCalendars,
}: {
  location: Location;
  termCalendars: TermCalendar[];
}) {
  const [error, formAction, pending] = useActionState(
    updateSchoolAction.bind(null, location.id),
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
          defaultValue={location.name}
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
          defaultValue={location.locationType}
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
          defaultValue={location.address ?? ""}
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
          defaultValue={location.invoicingTarget}
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
            defaultValue={location.termStart ?? ""}
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
            defaultValue={location.termEnd ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Simple fallback term dates. Assign a term calendar below for full term/holiday handling —
        it supersedes these when set.
      </p>

      <div>
        <label htmlFor="termCalendarId" className="block text-sm font-medium text-neutral-700">
          Term calendar (optional)
        </label>
        <select
          id="termCalendarId"
          name="termCalendarId"
          defaultValue={location.termCalendarId ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">Use the simple term dates above</option>
          {termCalendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="logoUrl" className="block text-sm font-medium text-neutral-700">
          Logo URL (optional)
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={location.logoUrl ?? ""}
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-6">
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-neutral-700">
            Brand color (optional)
          </label>
          <input
            id="primaryColor"
            name="primaryColor"
            type="color"
            defaultValue={location.primaryColor ?? "#2a78d6"}
            className="mt-1 h-10 w-16 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label htmlFor="secondaryColor" className="block text-sm font-medium text-neutral-700">
            Secondary color (optional)
          </label>
          <input
            id="secondaryColor"
            name="secondaryColor"
            type="color"
            defaultValue={location.secondaryColor ?? "#2a78d6"}
            className="mt-1 h-10 w-16 rounded-lg border border-neutral-300"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">Colors this location&apos;s lessons on your calendar views.</p>

      <div>
        <label htmlFor="accessNotes" className="block text-sm font-medium text-neutral-700">
          Access notes (WiFi, door codes, parking — private to you)
        </label>
        <textarea
          id="accessNotes"
          name="accessNotes"
          rows={3}
          defaultValue={location.accessNotes ?? ""}
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
