"use client";

import { useTransition } from "react";
import { approvePendingStudentAction, declinePendingStudentAction } from "../actions";

export function ReviewButtons({ studentId }: { studentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => approvePendingStudentAction(studentId))}
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => declinePendingStudentAction(studentId))}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
