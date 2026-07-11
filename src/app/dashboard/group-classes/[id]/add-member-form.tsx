"use client";

import { useActionState } from "react";
import type { Student } from "@prisma/client";
import { addGroupClassMemberAction } from "./actions";

export function AddMemberForm({ groupClassId, students }: { groupClassId: string; students: Student[] }) {
  const [error, formAction, pending] = useActionState(addGroupClassMemberAction, undefined);

  if (students.length === 0) {
    return <p className="text-sm text-neutral-500">All your students are already in this class.</p>;
  }

  return (
    <form action={formAction} className="flex items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <input type="hidden" name="groupClassId" value={groupClassId} />
      <div className="flex-1">
        <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">
          Add student
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
