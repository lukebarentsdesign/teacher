"use client";

import { useState } from "react";
import { sendProgressSummaryAction } from "./actions";

export function SendSummaryButton({ studentId, summaryText }: { studentId: string; summaryText: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const err = await sendProgressSummaryAction(studentId, summaryText);
          setPending(false);
          setMessage(err ?? "Sent.");
        }}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send to guardian(s)"}
      </button>
      {message && <p className="mt-2 text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
