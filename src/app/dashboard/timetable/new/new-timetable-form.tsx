"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Student } from "@prisma/client";
import type { TimeSlot } from "@/lib/scheduling";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type LinkOption = {
  id: string;
  schoolId: string;
  schoolName: string;
  schedulingMode: "FIXED" | "FLUID";
  termStart: string | null;
  termEnd: string | null;
  availableSlots: TimeSlot[];
};

function slotKey(slot: TimeSlot) {
  return `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
}

export function NewTimetableForm({ students, links }: { students: Student[]; links: LinkOption[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [linkId, setLinkId] = useState(links[0]?.id ?? "");
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | undefined>();

  const link = links.find((l) => l.id === linkId);

  const slotsForLink = useMemo(() => link?.availableSlots ?? [], [link]);

  function toggleSlot(key: string, single: boolean) {
    setSelectedSlotKeys((prev) => {
      if (single) return new Set([key]);
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (!link) {
      setError("Pick a school engagement.");
      return;
    }
    if (!link.termStart || !link.termEnd) {
      setError(`${link.schoolName} has no term dates set — add them before generating a timetable.`);
      return;
    }
    const chosenSlots = slotsForLink.filter((slot) => selectedSlotKeys.has(slotKey(slot)));
    if (chosenSlots.length === 0) {
      setError("Pick at least one slot.");
      return;
    }
    if (link.schedulingMode === "FIXED" && chosenSlots.length > 1) {
      setError("Fixed mode uses exactly one slot.");
      return;
    }

    const query = new URLSearchParams({
      studentId,
      linkId: link.id,
      slots: JSON.stringify(chosenSlots),
    });
    router.push(`/dashboard/timetable/preview?${query.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">
          Student
        </label>
        <select
          id="studentId"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="linkId" className="block text-sm font-medium text-neutral-700">
          School / engagement
        </label>
        <select
          id="linkId"
          value={linkId}
          onChange={(e) => {
            setLinkId(e.target.value);
            setSelectedSlotKeys(new Set());
          }}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {links.map((option) => (
            <option key={option.id} value={option.id}>
              {option.schoolName} ({option.schedulingMode})
            </option>
          ))}
        </select>
      </div>

      {link && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            {link.schedulingMode === "FIXED"
              ? "Pick one weekly slot"
              : "Pick the slots to rotate across"}
          </p>
          {slotsForLink.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No available slots (everything is either unset or hits a protected block).
            </p>
          ) : (
            <div className="space-y-2">
              {slotsForLink.map((slot) => {
                const key = slotKey(slot);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type={link.schedulingMode === "FIXED" ? "radio" : "checkbox"}
                      name="slot"
                      checked={selectedSlotKeys.has(key)}
                      onChange={() => toggleSlot(key, link.schedulingMode === "FIXED")}
                    />
                    {DAY_LABELS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
      >
        Preview timetable
      </button>
    </form>
  );
}
