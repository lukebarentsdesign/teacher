"use client";

import { useActionState } from "react";
import { applyAsCreditAction } from "./actions";

export function ApplyAsCreditButton({ makeUpLessonRowId }: { makeUpLessonRowId: string }) {
  const [error, formAction, pending] = useActionState(
    applyAsCreditAction.bind(null, makeUpLessonRowId),
    undefined
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Apply as next-period credit"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </form>
  );
}
