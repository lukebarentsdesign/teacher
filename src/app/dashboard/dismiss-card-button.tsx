"use client";

import { X } from "lucide-react";
import { dismissCardAction } from "./dashboard-cards-actions";

export function DismissCardButton({ cardId }: { cardId: string }) {
  return (
    <button
      type="button"
      onClick={() => dismissCardAction(cardId)}
      className="shrink-0 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
      aria-label="Dismiss"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
