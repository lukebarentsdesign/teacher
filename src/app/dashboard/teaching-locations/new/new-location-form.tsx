"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  BUILT_IN_INVOICING_TARGET_OPTIONS,
  BUILT_IN_LOCATION_TYPE_OPTIONS,
  type InvoicingTargetOptionChoice,
  type LocationTypeOptionChoice,
} from "@/lib/location-types";
import { createSchoolAction } from "../actions";

export function NewLocationForm({
  locationTypeOptions,
  invoicingTargetOptions,
}: {
  locationTypeOptions: LocationTypeOptionChoice[];
  invoicingTargetOptions: InvoicingTargetOptionChoice[];
}) {
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
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="locationType" className="block text-sm font-medium text-neutral-700">
            Type
          </label>
          <Link href="/dashboard/menu-choices" className="text-xs font-medium text-brand-650 hover:text-brand-700">
            Edit choices
          </Link>
        </div>
        <select
          id="locationType"
          name="locationType"
          defaultValue="SCHOOL"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {BUILT_IN_LOCATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {locationTypeOptions.length > 0 && (
            <optgroup label="Your choices">
              {locationTypeOptions.map((option) => (
                <option key={option.id} value={`custom:${option.id}`}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          )}
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
          {BUILT_IN_INVOICING_TARGET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {invoicingTargetOptions.length > 0 && (
            <optgroup label="Your choices">
              {invoicingTargetOptions.map((option) => (
                <option key={option.id} value={`custom:${option.id}`}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          Access notes (WiFi, door codes, parking - private to you)
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
        {pending ? "Saving..." : "Save teaching location"}
      </button>
    </form>
  );
}