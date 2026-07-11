"use client";

import { declinePrivateTuitionRequestAction } from "./actions";

export function DeclinePrivateTuitionRequestButton({
  requestId,
  studentId,
}: {
  requestId: string;
  studentId: string;
}) {
  return (
    <form action={declinePrivateTuitionRequestAction.bind(null, requestId, studentId)}>
      <button
        type="submit"
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
      >
        Decline
      </button>
    </form>
  );
}
