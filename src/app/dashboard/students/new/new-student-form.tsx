"use client";

import { useActionState } from "react";
import { createStudentAction } from "../actions";
import type { School } from "@prisma/client";

export function NewStudentForm({ schools }: { schools: School[] }) {
  const [error, formAction, pending] = useActionState(createStudentAction, undefined);

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
        <label htmlFor="dob" className="block text-sm font-medium text-neutral-700">
          Date of birth (optional)
        </label>
        <input
          id="dob"
          name="dob"
          type="date"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="discipline" className="block text-sm font-medium text-neutral-700">
          Instrument / class / discipline
        </label>
        <input
          id="discipline"
          name="discipline"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-neutral-700">
          Source
        </label>
        <select
          id="source"
          name="source"
          defaultValue="HOME"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="HOME">Home</option>
          <option value="SCHOOL_INQUIRY">School inquiry</option>
          <option value="COLLEGE">College</option>
        </select>
      </div>

      <div>
        <label htmlFor="schoolId" className="block text-sm font-medium text-neutral-700">
          School (optional — leave blank for home students)
        </label>
        <select
          id="schoolId"
          name="schoolId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">None</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="igCardId" className="block text-sm font-medium text-neutral-700">
          IG Card ID (optional)
        </label>
        <input
          id="igCardId"
          name="igCardId"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save student"}
      </button>
    </form>
  );
}
