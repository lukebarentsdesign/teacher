"use client";

import { deleteIncidentLogAction } from "./actions";

export function DeleteIncidentButton({ incidentId }: { incidentId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteIncidentLogAction(incidentId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
