"use client";

import { useActionState } from "react";
import { bookGroupSessionAction, cancelGroupSessionBookingAction } from "./booking-actions";

type Booking = { id: string; studentId: string; studentName: string; status: string };
type Student = { id: string; name: string };

function BookForm({ groupClassId, students }: { groupClassId: string; students: Student[] }) {
  const [error, formAction, pending] = useActionState(bookGroupSessionAction.bind(null, groupClassId), undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1">
        <label htmlFor="studentId" className="block text-xs font-medium text-neutral-700">
          Student
        </label>
        <select
          id="studentId"
          name="studentId"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sessionDate" className="block text-xs font-medium text-neutral-700">
          Session date
        </label>
        <input
          id="sessionDate"
          name="sessionDate"
          type="date"
          defaultValue={today}
          required
          className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Booking…" : "Book"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

function BookingsByDate({
  groupClassId,
  bookingsByDate,
}: {
  groupClassId: string;
  bookingsByDate: [string, Booking[]][];
}) {
  if (bookingsByDate.length === 0) {
    return <p className="text-sm text-neutral-500">No bookings yet.</p>;
  }

  return (
    <div className="space-y-3">
      {bookingsByDate.map(([date, bookings]) => (
        <div key={date} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-neutral-900">
            {new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <ul className="space-y-1">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">
                  {b.studentName}{" "}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === "CONFIRMED"
                        ? "bg-green-50 text-green-700"
                        : b.status === "WAITLISTED"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {b.status}
                  </span>
                </span>
                {b.status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => cancelGroupSessionBookingAction(b.id, groupClassId)}
                    className="text-xs text-red-600 underline hover:text-red-800"
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function SessionBookingsPanel({
  groupClassId,
  capacity,
  bookings,
  students,
}: {
  groupClassId: string;
  capacity: number | null;
  bookings: { id: string; studentId: string; studentName: string; sessionDate: string; status: string }[];
  students: Student[];
}) {
  const byDate = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = b.sessionDate;
    const list = byDate.get(key) ?? [];
    list.push({ id: b.id, studentId: b.studentId, studentName: b.studentName, status: b.status });
    byDate.set(key, list);
  }
  const sorted = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        Capacity: {capacity ?? "Unlimited"}. Bookings beyond capacity for a given date are
        automatically waitlisted, and promoted in booking order if a confirmed spot is cancelled.
      </p>
      <BookForm groupClassId={groupClassId} students={students} />
      <BookingsByDate groupClassId={groupClassId} bookingsByDate={sorted} />
    </div>
  );
}
