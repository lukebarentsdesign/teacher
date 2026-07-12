"use client";

import { useActionState } from "react";
import { saveMeetingUrlAction } from "./actions";

export function MeetingUrlForm({ lessonId, initialUrl }: { lessonId: string; initialUrl: string }) {
  const [error, action, pending] = useActionState(saveMeetingUrlAction.bind(null, lessonId), undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        type="url"
        name="meetingUrl"
        defaultValue={initialUrl}
        placeholder="https://zoom.us/j/..."
        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <a
        href={`/api/lessons/${lessonId}/ics`}
        className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50"
      >
        Add to calendar (.ics)
      </a>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
