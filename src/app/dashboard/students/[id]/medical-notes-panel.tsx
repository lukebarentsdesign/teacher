"use client";

import { useActionState } from "react";
import { addMedicalNoteAction, deleteMedicalNoteAction } from "./medical-notes-actions";

type Note = { id: string; note: string; severity: string; createdAt: string };

const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-neutral-100 text-neutral-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

function NoteForm({ studentId }: { studentId: string }) {
  const [error, action, pending] = useActionState(addMedicalNoteAction.bind(null, studentId), undefined);

  return (
    <form action={action} className="flex items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1">
        <label htmlFor="note" className="block text-xs font-medium text-neutral-700">
          Note
        </label>
        <input
          id="note"
          name="note"
          placeholder="e.g. Nut allergy — carries own EpiPen"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="w-32">
        <label htmlFor="severity" className="block text-xs font-medium text-neutral-700">
          Severity
        </label>
        <select
          id="severity"
          name="severity"
          defaultValue="LOW"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

export function MedicalNotesPanel({ studentId, notes }: { studentId: string; notes: Note[] }) {
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Teacher-only — never shown to guardians or students on the microsite.
      </p>
      {notes.length === 0 ? (
        <p className="text-sm text-neutral-500">No medical notes on file.</p>
      ) : (
        <ul className="space-y-1.5">
          {notes.map((n) => (
            <li key={n.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <span className="text-neutral-800">
                {n.note}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[n.severity]}`}>
                  {n.severity}
                </span>
              </span>
              <button
                type="button"
                onClick={() => deleteMedicalNoteAction(n.id, studentId)}
                className="text-xs text-red-600 underline hover:text-red-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <NoteForm studentId={studentId} />
    </div>
  );
}
