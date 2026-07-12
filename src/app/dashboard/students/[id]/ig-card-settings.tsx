"use client";

import { useActionState } from "react";
import { updateIgCardIdAction } from "../actions";

export function IgCardSettings({ studentId, igCardId }: { studentId: string; igCardId: string | null }) {
  const [error, action, pending] = useActionState(updateIgCardIdAction.bind(null, studentId), undefined);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-neutral-900">IG Card</p>
      <p className="mt-1 text-xs text-neutral-500">
        Links this student to their IG Card wallet pass for scan-based{" "}
        <a href="/dashboard/checkin" className="underline hover:text-neutral-700">
          sign-in/out
        </a>
        . Not full account linking — only the scannable identifier is reused.
      </p>
      <form action={action} className="mt-3 flex items-center gap-2">
        <input
          name="igCardId"
          defaultValue={igCardId ?? ""}
          placeholder="Card ID"
          className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
