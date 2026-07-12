"use client";

import { useState } from "react";
import { checkInAction, checkOutAction } from "./actions";

type CheckIn = { checkedInAt: string | null; checkedOutAt: string | null } | null;

export function LoneWorkerPanel({ lessonId, checkIn, hasEmergencyContact }: { lessonId: string; checkIn: CheckIn; hasEmergencyContact: boolean }) {
  const [pending, setPending] = useState(false);

  const checkedIn = !!checkIn?.checkedInAt;
  const checkedOut = !!checkIn?.checkedOutAt;

  return (
    <div className="space-y-2">
      {!hasEmergencyContact && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No emergency contact set — the overdue-checkout alert won&apos;t have anywhere to send.
          Add one under Billing settings.
        </p>
      )}
      <div className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm">
        <button
          type="button"
          disabled={pending || checkedIn}
          onClick={async () => {
            setPending(true);
            await checkInAction(lessonId);
            setPending(false);
          }}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
        >
          {checkedIn ? `Checked in ${new Date(checkIn!.checkedInAt!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Check in"}
        </button>
        <button
          type="button"
          disabled={pending || !checkedIn || checkedOut}
          onClick={async () => {
            setPending(true);
            await checkOutAction(lessonId);
            setPending(false);
          }}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
        >
          {checkedOut ? `Checked out ${new Date(checkIn!.checkedOutAt!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Check out"}
        </button>
      </div>
    </div>
  );
}
