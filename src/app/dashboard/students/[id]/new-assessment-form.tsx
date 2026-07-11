"use client";

import { useActionState } from "react";
import type { Room } from "@prisma/client";
import { createAssessmentAction } from "./actions";

export function NewAssessmentForm({ studentId, rooms }: { studentId: string; rooms: Room[] }) {
  const [error, formAction, pending] = useActionState(createAssessmentAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <input type="hidden" name="studentId" value={studentId} />

      <div>
        <label htmlFor="level" className="block text-sm font-medium text-neutral-700">
          Level / grade
        </label>
        <input
          id="level"
          name="level"
          type="text"
          required
          placeholder="e.g. Grade 3"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="canContinue" value="true" defaultChecked />
        Can continue to next level
      </label>

      <div>
        <label htmlFor="examBoard" className="block text-sm font-medium text-neutral-700">
          Exam board (optional)
        </label>
        <input
          id="examBoard"
          name="examBoard"
          type="text"
          placeholder="e.g. Trinity, ABRSM"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="examFee" className="block text-sm font-medium text-neutral-700">
          Exam fee (£, optional)
        </label>
        <input
          id="examFee"
          name="examFee"
          type="number"
          step="0.01"
          min="0"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="appointmentAt" className="block text-sm font-medium text-neutral-700">
          Formal appointment date/time (optional)
        </label>
        <input
          id="appointmentAt"
          name="appointmentAt"
          type="datetime-local"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {rooms.length > 0 && (
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-neutral-700">
            Room (optional)
          </label>
          <select
            id="roomId"
            name="roomId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">No specific room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add assessment"}
      </button>
    </form>
  );
}
