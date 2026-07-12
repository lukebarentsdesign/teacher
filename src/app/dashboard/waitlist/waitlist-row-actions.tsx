"use client";

import { updateWaitlistStatusAction, deleteWaitlistEntryAction } from "./actions";

export function WaitlistRowActions({ entryId, status }: { entryId: string; status: string }) {
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        onChange={(e) => updateWaitlistStatusAction(entryId, e.target.value)}
        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
      >
        <option value="WAITING">Waiting</option>
        <option value="CONTACTED">Contacted</option>
        <option value="CONVERTED">Converted</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button
        type="button"
        onClick={() => deleteWaitlistEntryAction(entryId)}
        className="text-xs text-red-600 underline hover:text-red-800"
      >
        Remove
      </button>
    </div>
  );
}
