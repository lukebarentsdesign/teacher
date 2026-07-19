"use client";

import { useState } from "react";
import { useActionState } from "react";
import { SessionPlanForm } from "./session-plan-form";
import {
  createGroupClassSessionPlanAction,
  updateSessionPlanAction,
  togglePublishSessionPlanAction,
  deleteSessionPlanAction,
  saveSessionPlanAsTemplateAction,
} from "./actions";

type Plan = { id: string; title: string; content: string; publishedAt: string | null; createdAt: string };
type Template = { id: string; title: string; content: string };

function SaveAsTemplateForm({ sessionPlanId }: { sessionPlanId: string }) {
  const boundAction = saveSessionPlanAsTemplateAction.bind(null, sessionPlanId);
  const [error, action, pending] = useActionState(boundAction, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-neutral-500 underline hover:text-neutral-900">
        Save as template
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input name="title" placeholder="Template title" required className="rounded-lg border border-neutral-300 px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

function CurrentPlanCard({ plan, moduleEnabled }: { plan: Plan; moduleEnabled: boolean }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="space-y-2">
        <SessionPlanForm
          action={updateSessionPlanAction.bind(null, plan.id)}
          initialTitle={plan.title}
          initialContent={plan.content}
          templates={[]}
          submitLabel="Save changes"
        />
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-500 underline hover:text-neutral-900">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Current plan</p>
          <p className="text-sm font-semibold text-neutral-900">{plan.title}</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-600">{plan.content}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            plan.publishedAt ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {plan.publishedAt ? "Published" : "Draft"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-neutral-500 underline hover:text-neutral-900">
          Edit
        </button>
        <button
          type="button"
          onClick={() => togglePublishSessionPlanAction(plan.id)}
          className="text-xs text-neutral-500 underline hover:text-neutral-900"
        >
          {plan.publishedAt ? "Unpublish" : "Publish to display"}
        </button>
        {moduleEnabled && <SaveAsTemplateForm sessionPlanId={plan.id} />}
        <button type="button" onClick={() => deleteSessionPlanAction(plan.id)} className="text-xs text-red-600 underline hover:text-red-800">
          Remove
        </button>
      </div>
    </div>
  );
}

export function GroupClassSessionPlanPanel({
  groupClassId,
  plans,
  templates,
  moduleEnabled,
}: {
  groupClassId: string;
  plans: Plan[];
  templates: Template[];
  moduleEnabled: boolean;
}) {
  const [startingNew, setStartingNew] = useState(false);
  const [current, ...history] = plans;

  return (
    <div className="space-y-3">
      {current && !startingNew && <CurrentPlanCard plan={current} moduleEnabled={moduleEnabled} />}

      {!moduleEnabled ? (
        <p className="text-sm text-neutral-500">
          The Group teaching module isn&apos;t enabled on this account, so a new session plan
          can&apos;t be started — get in touch if you&apos;d like it switched on.
        </p>
      ) : startingNew || !current ? (
        <div className="space-y-2">
          <SessionPlanForm
            action={createGroupClassSessionPlanAction.bind(null, groupClassId)}
            templates={templates}
            submitLabel="Start this session's plan"
          />
          {current && (
            <button type="button" onClick={() => setStartingNew(false)} className="text-xs text-neutral-500 underline hover:text-neutral-900">
              Cancel
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => setStartingNew(true)} className="text-xs text-neutral-500 underline hover:text-neutral-900">
          Start a new session plan
        </button>
      )}

      {history.length > 0 && (
        <details className="text-xs text-neutral-500">
          <summary className="cursor-pointer">Past plans ({history.length})</summary>
          <ul className="mt-2 space-y-1">
            {history.map((p) => (
              <li key={p.id}>
                {new Date(p.createdAt).toLocaleDateString("en-GB")} · {p.title}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
