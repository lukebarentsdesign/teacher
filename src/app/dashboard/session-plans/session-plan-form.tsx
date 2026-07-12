"use client";

import { useActionState, useState } from "react";

type Template = { id: string; title: string; content: string };
type FormAction = (state: string | undefined, formData: FormData) => Promise<string | undefined>;

export function SessionPlanForm({
  action,
  initialTitle = "",
  initialContent = "",
  templates,
  submitLabel,
}: {
  action: FormAction;
  initialTitle?: string;
  initialContent?: string;
  templates: Template[];
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      {templates.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-neutral-700">Start from a template</label>
          <select
            onChange={(e) => {
              const t = templates.find((tpl) => tpl.id === e.target.value);
              if (t) {
                setTitle(t.title);
                setContent(t.content);
              }
            }}
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">— blank —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="title" className="block text-xs font-medium text-neutral-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Today's warm-up & scales"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-xs font-medium text-neutral-700">
          Plan
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening in this session — agenda, warm-up, focus points…"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
