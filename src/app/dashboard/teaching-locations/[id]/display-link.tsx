"use client";

import { useState } from "react";
import { generateDisplayTokenAction } from "../../session-plans/actions";

export function DisplayLink({ locationId, initialToken }: { locationId: string; initialToken: string | null }) {
  const [token, setToken] = useState(initialToken);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = token && typeof window !== "undefined" ? `${window.location.origin}/display/${token}` : null;

  if (!token) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const newToken = await generateDisplayTokenAction(locationId);
          setPending(false);
          if (newToken) setToken(newToken);
        }}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-50"
      >
        {pending ? "Generating…" : "Generate Now/Next display link"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-700">{url ?? `/display/${token}`}</code>
      <button
        type="button"
        onClick={() => {
          if (url) navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-xs text-neutral-500 underline hover:text-neutral-900"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
