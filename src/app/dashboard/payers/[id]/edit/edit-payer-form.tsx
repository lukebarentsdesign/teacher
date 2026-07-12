"use client";

import { useActionState } from "react";
import { updatePayerAction } from "../../actions";

type Payer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactPref: string | null;
  notes: string | null;
};

export function EditPayerForm({ payer }: { payer: Payer }) {
  const [error, formAction, pending] = useActionState(updatePayerAction.bind(null, payer.id), undefined);

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
          defaultValue={payer.name}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email (optional)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={payer.email ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
          Phone (optional)
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={payer.phone ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="contactPref" className="block text-sm font-medium text-neutral-700">
          Preferred contact (optional)
        </label>
        <select
          id="contactPref"
          name="contactPref"
          defaultValue={payer.contactPref ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">No preference</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
          Notes / address (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={payer.notes ?? ""}
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
