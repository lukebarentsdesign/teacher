"use client";

import { confirmTimetableAction } from "./actions";

export function ConfirmTimetableForm({
  studentId,
  teacherId,
  schoolId,
  linkId,
  slots,
  disabled,
}: {
  studentId: string;
  teacherId: string;
  schoolId: string;
  linkId: string;
  slots: string;
  disabled: boolean;
}) {
  return (
    <form action={confirmTimetableAction}>
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="linkId" value={linkId} />
      <input type="hidden" name="slots" value={slots} />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        Create lessons
      </button>
    </form>
  );
}
