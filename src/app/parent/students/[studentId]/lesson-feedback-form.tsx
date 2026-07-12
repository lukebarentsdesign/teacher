"use client";

import { useActionState } from "react";
import { submitLessonFeedbackAction } from "./actions";

type Existing = { rating: number; comments: string | null } | null;

export function LessonFeedbackForm({
  studentId,
  lessonId,
  existing,
}: {
  studentId: string;
  lessonId: string;
  existing: Existing;
}) {
  const boundAction = submitLessonFeedbackAction.bind(null, studentId, lessonId);
  const [error, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
      <label htmlFor={`rating-${lessonId}`} className="text-xs text-neutral-500">
        Rate this lesson
      </label>
      <select
        id={`rating-${lessonId}`}
        name="rating"
        defaultValue={existing?.rating ?? ""}
        className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
      >
        <option value="" disabled>
          —
        </option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {"★".repeat(n)}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="comments"
        defaultValue={existing?.comments ?? ""}
        placeholder="Comments (optional)"
        className="min-w-[10rem] flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : existing ? "Update" : "Submit"}
      </button>
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </form>
  );
}
