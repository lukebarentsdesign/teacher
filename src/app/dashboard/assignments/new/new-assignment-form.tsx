"use client";

import { useActionState } from "react";
import type { Student, Resource } from "@prisma/client";
import { createAssignmentAction } from "../actions";

export function NewAssignmentForm({
  students,
  resources,
}: {
  students: Student[];
  resources: Resource[];
}) {
  const [error, formAction, pending] = useActionState(createAssignmentAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">
          Student
        </label>
        <select
          id="studentId"
          name="studentId"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

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
        <label htmlFor="instructions" className="block text-sm font-medium text-neutral-700">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="target" className="block text-sm font-medium text-neutral-700">
          Target
        </label>
        <input
          id="target"
          name="target"
          required
          placeholder="e.g. 10 minutes daily, scales in C major"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="assignedDate" className="block text-sm font-medium text-neutral-700">
            Assigned date
          </label>
          <input
            id="assignedDate"
            name="assignedDate"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="reviewDate" className="block text-sm font-medium text-neutral-700">
            Review date
          </label>
          <input
            id="reviewDate"
            name="reviewDate"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="resourceId" className="block text-sm font-medium text-neutral-700">
          Attached resource (optional)
        </label>
        <select
          id="resourceId"
          name="resourceId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">None</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.title}
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
        {pending ? "Saving…" : "Save assignment"}
      </button>
    </form>
  );
}
