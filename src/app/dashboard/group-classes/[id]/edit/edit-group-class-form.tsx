"use client";

import { useActionState } from "react";
import { updateGroupClassAction } from "@/app/dashboard/teaching-locations/[id]/actions";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type Room = { id: string; label: string };
type Subject = { id: string; name: string };

export function EditGroupClassForm({
  groupClassId,
  name,
  discipline,
  dayOfWeek,
  startTime,
  endTime,
  roomId,
  subjectId,
  capacity,
  rooms,
  subjects,
}: {
  groupClassId: string;
  name: string;
  discipline: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomId: string | null;
  subjectId: string | null;
  capacity: number | null;
  rooms: Room[];
  subjects: Subject[];
}) {
  const [error, formAction, pending] = useActionState(
    updateGroupClassAction.bind(null, groupClassId),
    undefined
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Class name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={name}
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
          defaultValue={discipline}
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
            defaultValue={dayOfWeek}
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
            defaultValue={startTime}
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
            defaultValue={endTime}
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
            defaultValue={roomId ?? ""}
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

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-neutral-700">
          Capacity (optional)
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          defaultValue={capacity ?? ""}
          placeholder="Unlimited"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Once a session date hits this many confirmed bookings, further self-service bookings are waitlisted.
        </p>
      </div>

      {subjects.length > 0 && (
        <div>
          <label htmlFor="subjectId" className="block text-sm font-medium text-neutral-700">
            Subject (optional)
          </label>
          <select
            id="subjectId"
            name="subjectId"
            defaultValue={subjectId ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">No subject tag</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
