"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type School = { id: string; name: string };

export function NewUnavailabilityForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [error, setError] = useState<string>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!start || !end) return setError("Pick a start and end date/time.");
    if (new Date(end) <= new Date(start)) return setError("End must be after start.");

    const query = new URLSearchParams({ start, end });
    if (reason) query.set("reason", reason);
    if (schoolId) query.set("schoolId", schoolId);
    router.push(`/dashboard/unavailability/preview?${query.toString()}`);
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start" className="block text-sm font-medium text-neutral-700">
            From
          </label>
          <input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="end" className="block text-sm font-medium text-neutral-700">
            Until
          </label>
          <input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-neutral-700">
          Reason (optional)
        </label>
        <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Illness" className={inputClass} />
      </div>

      {schools.length > 0 && (
        <div>
          <label htmlFor="schoolId" className="block text-sm font-medium text-neutral-700">
            Scope
          </label>
          <select id="schoolId" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={inputClass}>
            <option value="">All schools &amp; home students</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                Just {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
      >
        Review affected lessons
      </button>
    </form>
  );
}
