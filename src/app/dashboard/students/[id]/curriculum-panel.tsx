"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  importCurriculumAction,
  updateSectionStatusAction,
  updateCurriculumStatusAction,
  saveCurriculumAsTemplateAction,
  duplicateCurriculumAction,
  deleteStudentCurriculumAction,
  createBlankCurriculumAction,
  addStudentCurriculumSectionAction,
} from "./curriculum-actions";

type Section = {
  id: string;
  order: number;
  title: string;
  description: string | null;
  status: string;
};

type Curriculum = {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  sections: Section[];
};

type Template = { id: string; title: string; subject: string | null };
type OtherStudent = { id: string; name: string };

function SectionRow({
  section,
  studentCurriculumId,
  studentId,
}: {
  section: Section;
  studentCurriculumId: string;
  studentId: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
      <div>
        <p className="font-medium text-neutral-800">{section.title}</p>
        {section.description && <p className="text-xs text-neutral-500">{section.description}</p>}
      </div>
      <select
        defaultValue={section.status}
        onChange={(e) => updateSectionStatusAction(section.id, studentCurriculumId, studentId, e.target.value)}
        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
      >
        <option value="NOT_STARTED">Not started</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </li>
  );
}

function SaveAsTemplateForm({ studentCurriculumId, studentId }: { studentCurriculumId: string; studentId: string }) {
  const boundAction = saveCurriculumAsTemplateAction.bind(null, studentCurriculumId, studentId);
  const [error, action, pending] = useActionState(boundAction, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 underline hover:text-neutral-900"
      >
        Save as template
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        name="title"
        placeholder="Template title"
        required
        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

function DuplicateForm({
  studentCurriculumId,
  studentId,
  otherStudents,
}: {
  studentCurriculumId: string;
  studentId: string;
  otherStudents: OtherStudent[];
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (otherStudents.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 underline hover:text-neutral-900"
      >
        Duplicate to another student
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
      >
        <option value="">Pick a student…</option>
        {otherStudents.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!target || pending}
        onClick={async () => {
          setPending(true);
          const err = await duplicateCurriculumAction(studentCurriculumId, studentId, target);
          setPending(false);
          setError(err);
          if (!err) setOpen(false);
        }}
        className="rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Copying…" : "Copy"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function AddSectionForm({ studentCurriculumId, studentId }: { studentCurriculumId: string; studentId: string }) {
  const boundAction = addStudentCurriculumSectionAction.bind(null, studentCurriculumId, studentId);
  const [error, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        name="title"
        placeholder="Add a section…"
        required
        className="flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

function BlankCurriculumForm({ studentId }: { studentId: string }) {
  const boundAction = createBlankCurriculumAction.bind(null, studentId);
  const [error, action, pending] = useActionState(boundAction, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 underline hover:text-neutral-900"
      >
        …or start a blank plan from scratch
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm">
      <input
        name="title"
        placeholder="Plan title"
        required
        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        name="subject"
        placeholder="Subject (optional)"
        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Starting…" : "Start"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

function ImportForm({ studentId, templates }: { studentId: string; templates: Template[] }) {
  const [templateId, setTemplateId] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm">
      <select
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      >
        <option value="">Import a curriculum template…</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
            {t.subject ? ` (${t.subject})` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!templateId || pending}
        onClick={async () => {
          setPending(true);
          await importCurriculumAction(studentId, templateId);
          setPending(false);
          setTemplateId("");
        }}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Importing…" : "Import"}
      </button>
    </div>
  );
}

function ModuleLockedNotice() {
  return (
    <p className="text-xs text-neutral-500">
      The Curriculum &amp; content module isn&apos;t enabled on this account — get in touch if
      you&apos;d like it switched on.
    </p>
  );
}

export function CurriculumPanel({
  studentId,
  curricula,
  templates,
  otherStudents,
  moduleEnabled,
}: {
  studentId: string;
  curricula: Curriculum[];
  templates: Template[];
  otherStudents: OtherStudent[];
  moduleEnabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {curricula.length === 0 ? (
        <p className="text-sm text-neutral-500">No curriculum plan yet.</p>
      ) : (
        <div className="space-y-4">
          {curricula.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{c.title}</p>
                  {c.subject && <p className="text-xs text-neutral-500">{c.subject}</p>}
                </div>
                <select
                  defaultValue={c.status}
                  onChange={(e) => updateCurriculumStatusAction(c.id, studentId, e.target.value)}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <ul className="mb-2 space-y-1.5">
                {c.sections.map((s) => (
                  <SectionRow key={s.id} section={s} studentCurriculumId={c.id} studentId={studentId} />
                ))}
              </ul>
              {moduleEnabled ? (
                <AddSectionForm studentCurriculumId={c.id} studentId={studentId} />
              ) : (
                <ModuleLockedNotice />
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {moduleEnabled && (
                  <>
                    <SaveAsTemplateForm studentCurriculumId={c.id} studentId={studentId} />
                    <DuplicateForm studentCurriculumId={c.id} studentId={studentId} otherStudents={otherStudents} />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => deleteStudentCurriculumAction(c.id, studentId)}
                  className="text-xs text-red-600 underline hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {moduleEnabled ? (
        <>
          {templates.length > 0 ? (
            <ImportForm studentId={studentId} templates={templates} />
          ) : (
            <p className="text-xs text-neutral-500">
              No templates yet —{" "}
              <Link href="/dashboard/curriculum-templates" className="underline hover:text-neutral-900">
                build one
              </Link>{" "}
              or save a plan built here as a template.
            </p>
          )}
          <BlankCurriculumForm studentId={studentId} />
        </>
      ) : (
        <ModuleLockedNotice />
      )}
    </div>
  );
}
