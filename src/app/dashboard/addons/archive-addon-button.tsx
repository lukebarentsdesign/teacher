"use client";

import { useTransition } from "react";
import { archiveAddOnAction } from "./actions";

export function ArchiveAddOnButton({ addOnId }: { addOnId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => archiveAddOnAction(addOnId))}
      className="text-xs text-neutral-500 underline hover:text-neutral-900 disabled:opacity-50"
    >
      Archive
    </button>
  );
}
