"use client";

import { useState } from "react";
import { useActionState } from "react";
import { SessionPlanForm } from "./session-plan-form";
import {
  upsertLessonSessionPlanAction,
  updateSessionPlanAction,
  togglePublishSessionPlanAction,
  deleteSessionPlanAction,
  saveSessionPlanAsTemplateAction,
} from "./actions";

type Plan = { id: string; title: string; content: string; publishedAt: string | null };
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

export function LessonSessionPlanPanel({
  lessonId,
  plan,
  templates,
}: {
  lessonId: string;
  plan: Plan | null;
  templates: Template[];
}) {
  const [editing, setEditing] = useState(false);

  if (!plan) {
    return <SessionPlanForm action={upsertLessonSessionPlanAction.bind(null, lessonId)} templates={templates} submitLabel="Create plan" />;
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <SessionPlanForm
          action={updateSessionPlanAction.bind(null, plan.id)}
          initialTitle={plan.title}
          initialContent={plan.content}
          templates={templates}
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
        <SaveAsTemplateForm sessionPlanId={plan.id} />
        <button type="button" onClick={() => deleteSessionPlanAction(plan.id)} className="text-xs text-red-600 underline hover:text-red-800">
          Remove
        </button>
      </div>
    </div>
  );
}
