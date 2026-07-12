"use client";

import { useState } from "react";
import { deleteEmbedConfigAction } from "./actions";

export function EmbedShareCard({
  embedConfigId,
  label,
  embedToken,
}: {
  embedConfigId: string;
  label: string;
  embedToken: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/onboard/embed/${embedToken}`;
  const snippet = `<iframe src="${url}" width="100%" height="800" style="border:0"></iframe>`;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <button
          type="button"
          onClick={() => deleteEmbedConfigAction(embedConfigId)}
          className="text-xs text-red-600 underline hover:text-red-800"
        >
          Remove
        </button>
      </div>

      <div className="mb-2">
        <p className="mb-1 text-xs font-medium text-neutral-500">Shareable link</p>
        <div className="flex items-center gap-2">
          <input readOnly value={url} className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600" />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 1500);
            }}
            className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
          >
            {copiedLink ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-neutral-500">Embed snippet (for your own website)</p>
        <div className="flex items-center gap-2">
          <input readOnly value={snippet} className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600" />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(snippet);
              setCopiedSnippet(true);
              setTimeout(() => setCopiedSnippet(false), 1500);
            }}
            className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
          >
            {copiedSnippet ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
