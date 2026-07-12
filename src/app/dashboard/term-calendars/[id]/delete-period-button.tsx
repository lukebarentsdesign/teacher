"use client";

import { useTransition } from "react";
import { deleteTermPeriodAction, deleteHolidayPeriodAction } from "../actions";

export function DeletePeriodButton({
  periodId,
  calendarId,
  kind,
}: {
  periodId: string;
  calendarId: string;
  kind: "term" | "holiday";
}) {
  const [pending, startTransition] = useTransition();
  const action = kind === "term" ? deleteTermPeriodAction : deleteHolidayPeriodAction;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action(periodId, calendarId))}
      className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
    >
      Remove
    </button>
  );
}
