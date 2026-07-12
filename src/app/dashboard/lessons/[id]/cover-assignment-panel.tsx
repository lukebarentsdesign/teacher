"use client";

import { useActionState } from "react";
import { addCoverAssignmentAction, deleteCoverAssignmentAction } from "./actions";

type OrgMember = { id: string; name: string };
type Cover = { id: string; reason: string | null; coveringInstructorName: string };

export function CoverAssignmentPanel({
  lessonId,
  orgMembers,
  covers,
}: {
  lessonId: string;
  orgMembers: OrgMember[];
  covers: Cover[];
}) {
  const [error, action, pending] = useActionState(addCoverAssignmentAction.bind(null, lessonId), undefined);

  if (orgMembers.length === 0) return null;

  return (
    <div className="space-y-3">
      {covers.length > 0 && (
        <ul className="space-y-1.5">
          {covers.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <span className="text-neutral-800">
                Covered by <span className="font-medium">{c.coveringInstructorName}</span>
                {c.reason && <span className="text-neutral-500"> — {c.reason}</span>}
              </span>
              <button
                type="button"
                onClick={() => deleteCoverAssignmentAction(c.id, lessonId)}
                className="text-xs text-red-600 underline hover:text-red-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex-1">
          <label htmlFor="coveringInstructorId" className="block text-xs font-medium text-neutral-700">
            Covering instructor
          </label>
          <select
            id="coveringInstructorId"
            name="coveringInstructorId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="" disabled>
              Choose…
            </option>
            {orgMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="reason" className="block text-xs font-medium text-neutral-700">
            Reason (optional)
          </label>
          <input
            id="reason"
            name="reason"
            placeholder="e.g. Annual leave"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Assign cover"}
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
