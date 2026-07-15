"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  BUILT_IN_INVOICING_TARGET_OPTIONS,
  BUILT_IN_LOCATION_TYPE_OPTIONS,
  invoicingTargetSelectValue,
  locationTypeSelectValue,
  type InvoicingTargetOptionChoice,
  type LocationTypeOptionChoice,
} from "@/lib/location-types";
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
  customLocationType: string | null;
  customInvoicingTarget: string | null;
  accessNotes: string | null;
  termCalendarId: string | null;
};

type TermCalendar = { id: string; name: string };

export function EditLocationForm({
  location,
  termCalendars,
  locationTypeOptions,
  invoicingTargetOptions,
}: {
  location: Location;
  termCalendars: TermCalendar[];
  locationTypeOptions: LocationTypeOptionChoice[];
  invoicingTargetOptions: InvoicingTargetOptionChoice[];
}) {
  const [error, formAction, pending] = useActionState(
    updateSchoolAction.bind(null, location.id),
    undefined
  );
  const selectedLocationType = locationTypeSelectValue(location, locationTypeOptions);
  const selectedInvoicingTarget = invoicingTargetSelectValue(location, invoicingTargetOptions);
  const currentOptionIsMissing = selectedLocationType.startsWith("current:");
  const currentBillingOptionIsMissing = selectedInvoicingTarget.startsWith("current:");

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
          defaultValue={selectedLocationType}
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
          {currentOptionIsMissing && location.customLocationType && (
            <optgroup label="Current saved value">
              <option value={selectedLocationType}>{location.customLocationType}</option>
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
          defaultValue={selectedInvoicingTarget}
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
          {currentBillingOptionIsMissing && location.customInvoicingTarget && (
            <optgroup label="Current saved value">
              <option value={selectedInvoicingTarget}>{location.customInvoicingTarget}</option>
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
        Simple fallback term dates. Assign a term calendar below for full term/holiday handling - it supersedes these when set.
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
          placeholder="https://..."
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
          Access notes (WiFi, door codes, parking - private to you)
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
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}