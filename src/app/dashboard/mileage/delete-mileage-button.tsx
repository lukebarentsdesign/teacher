"use client";

import { deleteMileageLogAction } from "./actions";

export function DeleteMileageButton({ mileageLogId }: { mileageLogId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteMileageLogAction(mileageLogId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
