"use client";

import { requestPrivateTuitionAction } from "./actions";

export function RequestPrivateTuitionButton({
  studentId,
  teacherName,
}: {
  studentId: string;
  teacherName: string;
}) {
  return (
    <form action={requestPrivateTuitionAction.bind(null, studentId)}>
      <button
        type="submit"
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
      >
        Request private lessons with {teacherName}
      </button>
    </form>
  );
}
