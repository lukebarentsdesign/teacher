"use client";

import { useActionState } from "react";
import { bookGroupSessionAsGuardianAction, cancelGroupSessionAsGuardianAction } from "./actions";

type Upcoming = { date: string; label: string; existingStatus: string | null; existingBookingId: string | null };

export function BookSessionForm({
  studentId,
  groupClassId,
  upcoming,
}: {
  studentId: string;
  groupClassId: string;
  upcoming: Upcoming[];
}) {
  const [error, action, pending] = useActionState(bookGroupSessionAsGuardianAction.bind(null, studentId), undefined);

  return (
    <div className="space-y-2">
      {upcoming.map((slot) => (
        <div key={slot.date} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
          <span className="text-neutral-800">{slot.label}</span>
          {slot.existingStatus === "CONFIRMED" || slot.existingStatus === "WAITLISTED" ? (
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  slot.existingStatus === "CONFIRMED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {slot.existingStatus}
              </span>
              <button
                type="button"
                onClick={() => cancelGroupSessionAsGuardianAction(studentId, slot.existingBookingId!)}
                className="text-xs text-red-600 underline hover:text-red-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <form action={action}>
              <input type="hidden" name="groupClassId" value={groupClassId} />
              <input type="hidden" name="sessionDate" value={slot.date} />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                Book
              </button>
            </form>
          )}
        </div>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
