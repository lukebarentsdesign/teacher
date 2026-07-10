"use client";

import { toggleReminderCompletedAction } from "./actions";

export function ToggleCompletedButton({
  reminderId,
  completed,
}: {
  reminderId: string;
  completed: boolean;
}) {
  return (
    <form action={toggleReminderCompletedAction.bind(null, reminderId, !completed)}>
      <button
        type="submit"
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          completed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {completed ? "Done" : "Not done"}
      </button>
    </form>
  );
}
