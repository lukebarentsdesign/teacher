"use client";

import { useActionState } from "react";
import { updateStudentAction } from "../actions";

type School = { id: string; name: string };
type Student = {
  id: string;
  name: string;
  dob: string | null;
  discipline: string;
  source: string;
  schoolId: string | null;
};

export function EditStudentForm({ student, schools }: { student: Student; schools: School[] }) {
  const [error, formAction, pending] = useActionState(
    updateStudentAction.bind(null, student.id),
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
          defaultValue={student.name}
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
          defaultValue={student.dob ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="discipline" className="block text-sm font-medium text-neutral-700">
          Discipline
        </label>
        <input
          id="discipline"
          name="discipline"
          required
          defaultValue={student.discipline}
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
          defaultValue={student.source}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="HOME">Home</option>
          <option value="SCHOOL_INQUIRY">School inquiry</option>
          <option value="COLLEGE">College</option>
        </select>
      </div>

      <div>
        <label htmlFor="schoolId" className="block text-sm font-medium text-neutral-700">
          School (optional)
        </label>
        <select
          id="schoolId"
          name="schoolId"
          defaultValue={student.schoolId ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">Home student — no school</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
