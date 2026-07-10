"use client";

import { setAssignmentStatusAction } from "./actions";

export function ReviewButtons({ assignmentId }: { assignmentId: string }) {
  return (
    <div className="mt-3 flex gap-2">
      <form action={setAssignmentStatusAction.bind(null, assignmentId, "REVIEWED_DONE")}>
        <button
          type="submit"
          className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors duration-150 hover:bg-green-50"
        >
          Mark done
        </button>
      </form>
      <form action={setAssignmentStatusAction.bind(null, assignmentId, "REVIEWED_NOT_DONE")}>
        <button
          type="submit"
          className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors duration-150 hover:bg-amber-50"
        >
          Mark not done
        </button>
      </form>
    </div>
  );
}
