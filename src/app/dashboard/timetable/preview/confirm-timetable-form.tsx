"use client";

import { confirmTimetableAction } from "./actions";

export function ConfirmTimetableForm({
  studentId,
  locationId,
  linkId,
  slots,
  roomId,
  disabled,
}: {
  studentId: string;
  locationId: string;
  linkId: string;
  slots: string;
  roomId?: string;
  disabled: boolean;
}) {
  return (
    <form action={confirmTimetableAction}>
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="linkId" value={linkId} />
      <input type="hidden" name="slots" value={slots} />
      {roomId && <input type="hidden" name="roomId" value={roomId} />}
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
