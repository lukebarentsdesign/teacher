"use client";

import { leaveOrganisationAction } from "./actions";

export function LeaveOrgButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Leave this organisation? You'll go back to being a standalone account.")) {
          leaveOrganisationAction();
        }
      }}
      className="text-sm text-red-600 underline hover:text-red-800"
    >
      Leave organisation
    </button>
  );
}
