"use client";

import { useActionState } from "react";
import type { Room } from "@prisma/client";
import { createGroupClassAction } from "./actions";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type Subject = { id: string; name: string };

export function NewGroupClassForm({
  locationId,
  rooms,
  subjects,
}: {
  locationId: string;
  rooms: Room[];
  subjects: Subject[];
}) {
  const [error, formAction, pending] = useActionState(createGroupClassAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <input type="hidden" name="locationId" value={locationId} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Class name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Grade 3 theory group"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="discipline" className="block text-sm font-medium text-neutral-700">
          Discipline
        </label>
        <input
          id="discipline"
          name="discipline"
          type="text"
          required
          placeholder="e.g. Piano"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor="dayOfWeek" className="block text-sm font-medium text-neutral-700">
            Day
          </label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-neutral-700">
            Start
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            defaultValue="16:00"
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-neutral-700">
            End
          </label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            defaultValue="17:00"
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
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

      {subjects.length > 0 && (
        <div>
          <label htmlFor="subjectId" className="block text-sm font-medium text-neutral-700">
            Subject (optional)
          </label>
          <select
            id="subjectId"
            name="subjectId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">No subject tag</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-400">
            Links this class into the same subject grouping used for students.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add group class"}
      </button>
    </form>
  );
}
