"use client";

import { useActionState } from "react";
import { scheduleMakeUpAction } from "./actions";

export function ScheduleMakeUpForm({
  makeUpLessonRowId,
  candidateLessons,
}: {
  makeUpLessonRowId: string;
  candidateLessons: { id: string; scheduledAt: Date }[];
}) {
  const [error, formAction, pending] = useActionState(scheduleMakeUpAction, undefined);

  if (candidateLessons.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No upcoming unlinked lessons for this student yet — generate one via Generate timetable, then
        come back here to link it.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="makeUpLessonRowId" value={makeUpLessonRowId} />
      <select
        name="lessonId"
        required
        className="rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-500 focus:outline-none"
      >
        {candidateLessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
            {lesson.scheduledAt.toLocaleDateString("en-GB")}{" "}
            {lesson.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Linking…" : "Link as make-up"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
