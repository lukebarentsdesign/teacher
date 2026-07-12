"use client";

import { useActionState } from "react";
import { markPresentAction, markAbsentMakeUpAction } from "./actions";

export function AttendanceButtons({ lessonId }: { lessonId: string }) {
  const [presentError, presentAction, presentPending] = useActionState(
    markPresentAction.bind(null, lessonId),
    undefined
  );
  const [absentError, absentAction, absentPending] = useActionState(
    markAbsentMakeUpAction.bind(null, lessonId),
    undefined
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={presentAction}>
          <button
            type="submit"
            disabled={presentPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
          >
            {presentPending ? "Saving…" : "Present ($)"}
          </button>
        </form>
        <form action={absentAction} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="noShowReason"
            placeholder="Reason (optional)"
            className="rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <label className="flex items-center gap-1 text-xs text-neutral-500">
            Informed
            <input
              type="datetime-local"
              name="informedAt"
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:border-neutral-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={absentPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
          >
            {absentPending ? "Saving…" : "Absent, make-up owed"}
          </button>
        </form>
      </div>
      {(presentError || absentError) && (
        <p className="text-sm text-red-600">{presentError ?? absentError}</p>
      )}
    </div>
  );
}
