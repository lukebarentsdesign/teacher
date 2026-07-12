"use client";

import { useTransition } from "react";
import { deleteSubjectAction } from "./actions";

export function DeleteSubjectButton({ subjectId }: { subjectId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteSubjectAction(subjectId))}
      className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
