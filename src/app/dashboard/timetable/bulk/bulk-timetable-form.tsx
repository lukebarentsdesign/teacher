"use client";

import { useMemo, useState, useTransition } from "react";
import {
  previewBulkTimetableAction,
  confirmBulkTimetableAction,
  type BulkPreview,
} from "./actions";

type Location = {
  id: string;
  name: string;
  windowCount: number;
  termStart: string | null;
  termEnd: string | null;
  terms: { name: string; startDate: string; endDate: string }[];
};
type LessonType = { id: string; name: string; defaultDurationMinutes: number; locationIds: string[] };
type Student = { id: string; name: string; locationId: string | null; requestedLessonTypeId: string | null };

export function BulkTimetableForm({
  locations,
  lessonTypes,
  students,
}: {
  locations: Location[];
  lessonTypes: LessonType[];
  students: Student[];
}) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const location = locations.find((l) => l.id === locationId);

  // Lesson types offered at this location (empty locationIds = offered everywhere).
  const availableLessonTypes = useMemo(
    () => lessonTypes.filter((lt) => lt.locationIds.length === 0 || lt.locationIds.includes(locationId)),
    [lessonTypes, locationId]
  );
  const [lessonTypeId, setLessonTypeId] = useState(availableLessonTypes[0]?.id ?? "");
  const lessonType = availableLessonTypes.find((lt) => lt.id === lessonTypeId) ?? availableLessonTypes[0];

  // Term options: the location's TermCalendar terms, else a single fallback from termStart/termEnd.
  const termOptions = useMemo(() => {
    if (!location) return [];
    if (location.terms.length > 0) return location.terms;
    if (location.termStart && location.termEnd)
      return [{ name: "Term", startDate: location.termStart, endDate: location.termEnd }];
    return [];
  }, [location]);
  const [termIndex, setTermIndex] = useState(0);
  const term = termOptions[termIndex];

  const studentsHere = useMemo(
    () => students.filter((s) => s.locationId === locationId),
    [students, locationId]
  );
  // Default-select students whose requested lesson type matches; if none match, select all.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const effectiveSelected = useMemo(() => {
    if (selectedIds.size > 0) return selectedIds;
    const matching = studentsHere.filter((s) => s.requestedLessonTypeId === lessonTypeId).map((s) => s.id);
    return new Set(matching.length > 0 ? matching : studentsHere.map((s) => s.id));
  }, [selectedIds, studentsHere, lessonTypeId]);

  const [targetPerStudent, setTargetPerStudent] = useState(10);
  const [durationMins, setDurationMins] = useState(lessonType?.defaultDurationMinutes ?? 30);
  const [minGapMinutes, setMinGapMinutes] = useState(10);

  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string>();
  const [pending, startTransition] = useTransition();

  function buildPayload() {
    return {
      locationId,
      lessonTypeId,
      studentIds: [...effectiveSelected],
      termStart: term?.startDate ?? "",
      termEnd: term?.endDate ?? "",
      targetPerStudent,
      durationMins,
      minGapMinutes,
    };
  }

  function onPreview() {
    setConfirmMsg(undefined);
    startTransition(async () => setPreview(await previewBulkTimetableAction(buildPayload())));
  }

  function onConfirm() {
    startTransition(async () => {
      const res = await confirmBulkTimetableAction(buildPayload());
      if (res.error) setConfirmMsg(res.error);
      else {
        setConfirmMsg(`Created ${res.created} lesson${res.created === 1 ? "" : "s"}.`);
        setPreview(null);
      }
    });
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Location</label>
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setSelectedIds(new Set());
                setTermIndex(0);
                setPreview(null);
              }}
              className={inputClass}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {location && location.windowCount === 0 && (
              <p className="mt-1 text-xs text-amber-700">No availability windows set here yet.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Lesson type</label>
            <select
              value={lessonTypeId}
              onChange={(e) => {
                setLessonTypeId(e.target.value);
                const lt = availableLessonTypes.find((x) => x.id === e.target.value);
                if (lt) setDurationMins(lt.defaultDurationMinutes);
                setSelectedIds(new Set());
                setPreview(null);
              }}
              className={inputClass}
            >
              {availableLessonTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Term</label>
          {termOptions.length === 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              No term dates for this location — set term dates or assign a term calendar first.
            </p>
          ) : (
            <select value={termIndex} onChange={(e) => setTermIndex(Number(e.target.value))} className={inputClass}>
              {termOptions.map((t, i) => (
                <option key={i} value={i}>
                  {t.name} ({t.startDate} → {t.endDate})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Lessons / student</label>
            <input
              type="number"
              min="1"
              value={targetPerStudent}
              onChange={(e) => setTargetPerStudent(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Duration (min)</label>
            <input
              type="number"
              min="1"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Min gap (min)</label>
            <input
              type="number"
              min="0"
              value={minGapMinutes}
              onChange={(e) => setMinGapMinutes(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            Students ({effectiveSelected.size} of {studentsHere.length})
          </p>
          {studentsHere.length === 0 ? (
            <p className="text-xs text-neutral-500">No active students at this location.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {studentsHere.map((s) => {
                const checked = effectiveSelected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                      checked ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(effectiveSelected);
                        if (next.has(s.id)) next.delete(s.id);
                        else next.add(s.id);
                        setSelectedIds(next);
                        setPreview(null);
                      }}
                      className="sr-only"
                    />
                    {s.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onPreview}
          disabled={pending || !term || effectiveSelected.size === 0}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Working…" : "Preview plan"}
        </button>
      </div>

      {confirmMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {confirmMsg}
        </div>
      )}

      {preview?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {preview.error}
        </div>
      )}

      {preview?.assignments && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {preview.assignments.length} lesson{preview.assignments.length === 1 ? "" : "s"} to create ·{" "}
            {preview.totalSlots} candidate slot{preview.totalSlots === 1 ? "" : "s"} in this term.
          </p>

          {preview.unfilled && preview.unfilled.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Not enough slots to fully schedule everyone:
              <ul className="mt-2 list-inside list-disc">
                {preview.unfilled.map((u, i) => (
                  <li key={i}>
                    {u.studentName}: {u.scheduled} of {u.wanted}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-neutral-200 bg-white text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {preview.assignments.map((a, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2 text-neutral-900">{a.studentName}</td>
                    <td className="px-4 py-2 text-neutral-500">{fmt(a.scheduledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || preview.assignments.length === 0}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
          >
            {pending ? "Creating…" : `Create ${preview.assignments.length} lessons`}
          </button>
        </div>
      )}
    </div>
  );
}
