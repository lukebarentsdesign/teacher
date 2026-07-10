"use client";

import { useActionState } from "react";
import type { Student } from "@prisma/client";
import { createResourceAction } from "../actions";

export function NewResourceForm({ students }: { students: Student[] }) {
  const [error, formAction, pending] = useActionState(createResourceAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-neutral-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue="DOCUMENT"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="DOCUMENT">Document</option>
          <option value="AUDIO">Audio</option>
          <option value="VIDEO">Video</option>
        </select>
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-neutral-700">
          URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description (optional)
        </label>
        <input
          id="description"
          name="description"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">
          Attach to a student (optional — leave blank for the general library)
        </label>
        <select
          id="studentId"
          name="studentId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">General library</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save resource"}
      </button>
    </form>
  );
}
