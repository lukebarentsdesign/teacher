"use client";

import { useTransition } from "react";
import { toggleLessonTypeActiveAction } from "./actions";

export function ActiveToggle({ lessonTypeId, active }: { lessonTypeId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleLessonTypeActiveAction(lessonTypeId, !active))}
      className="text-xs text-neutral-500 underline hover:text-neutral-900 disabled:opacity-50"
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
