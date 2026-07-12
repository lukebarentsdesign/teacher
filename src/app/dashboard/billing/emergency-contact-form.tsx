"use client";

import { useActionState } from "react";
import { updateEmergencyContactAction } from "./actions";

export function EmergencyContactForm({
  emergencyContactName,
  emergencyContactPhone,
  emergencyContactEmail,
}: {
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactEmail: string | null;
}) {
  const [error, formAction, pending] = useActionState(updateEmergencyContactAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <p className="text-xs text-neutral-500">
        Who gets alerted if you don&apos;t check out of a home-visit lesson within its grace
        period. Never shown to guardians/students.
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="emergencyContactName" className="block text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            id="emergencyContactName"
            name="emergencyContactName"
            defaultValue={emergencyContactName ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-neutral-700">
            Phone
          </label>
          <input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            defaultValue={emergencyContactPhone ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="emergencyContactEmail" className="block text-sm font-medium text-neutral-700">
          Email (alerts are sent here)
        </label>
        <input
          id="emergencyContactEmail"
          name="emergencyContactEmail"
          type="email"
          defaultValue={emergencyContactEmail ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save contact"}
      </button>
    </form>
  );
}
