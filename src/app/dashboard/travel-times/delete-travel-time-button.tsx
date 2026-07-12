"use client";

import { deleteTravelTimeAction } from "./actions";

export function DeleteTravelTimeButton({ travelTimeId }: { travelTimeId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteTravelTimeAction(travelTimeId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
