"use client";

import { useState } from "react";
import { createInviteAction, revokeInviteAction } from "./actions";

export function InviteGenerator() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const err = await createInviteAction();
          setPending(false);
          setError(err);
        }}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-50"
      >
        {pending ? "Generating…" : "Generate invite link"}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function InviteLink({ inviteId, token }: { inviteId: string; token: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/dashboard/organisation/join/${token}`;

  return (
    <div className="flex items-center gap-2">
      <input readOnly value={url} className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600" />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={() => revokeInviteAction(inviteId)}
        className="shrink-0 text-xs text-red-600 underline hover:text-red-800"
      >
        Revoke
      </button>
    </div>
  );
}
