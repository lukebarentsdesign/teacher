"use client";

import { useActionState } from "react";
import { createIncidentLogAction } from "./actions";

type Student = { id: string; name: string };

export function NewIncidentForm({ students, defaultStudentId }: { students: Student[]; defaultStudentId?: string }) {
  const [error, action, pending] = useActionState(createIncidentLogAction, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">
            Student (optional)
          </label>
          <select
            id="studentId"
            name="studentId"
            defaultValue={defaultStudentId ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">Not student-specific</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          What happened
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="actionTaken" className="block text-sm font-medium text-neutral-700">
            Action taken (optional)
          </label>
          <input
            id="actionTaken"
            name="actionTaken"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="reportedToWhom" className="block text-sm font-medium text-neutral-700">
            Reported to (optional)
          </label>
          <input
            id="reportedToWhom"
            name="reportedToWhom"
            placeholder="e.g. Guardian by phone"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log incident"}
      </button>
    </form>
  );
}
