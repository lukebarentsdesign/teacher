"use client";

import { useActionState } from "react";
import { updateStudentSubjectsAction } from "../actions";

type Subject = { id: string; name: string };

export function SubjectsSettings({
  studentId,
  allSubjects,
  selectedIds,
}: {
  studentId: string;
  allSubjects: Subject[];
  selectedIds: string[];
}) {
  const [error, action, pending] = useActionState(
    updateStudentSubjectsAction.bind(null, studentId),
    undefined
  );

  if (allSubjects.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No subjects defined yet — add some under{" "}
        <a href="/dashboard/subjects" className="underline hover:text-neutral-700">
          Subjects
        </a>{" "}
        in Setup, then tag this student with what they&apos;re taught.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {allSubjects.map((subject) => (
          <label
            key={subject.id}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white"
          >
            <input
              type="checkbox"
              name="subjectIds"
              value={subject.id}
              defaultChecked={selectedIds.includes(subject.id)}
              className="sr-only"
            />
            {subject.name}
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save subjects"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
