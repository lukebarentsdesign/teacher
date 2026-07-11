"use client";

import { removeGroupClassMemberAction } from "./actions";

export function RemoveMemberButton({ memberId, groupClassId }: { memberId: string; groupClassId: string }) {
  return (
    <form action={removeGroupClassMemberAction.bind(null, memberId, groupClassId)}>
      <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
        Remove
      </button>
    </form>
  );
}
