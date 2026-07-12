"use client";

import { togglePublishTemplateAction } from "../actions";

export function PublishToggle({ templateId, isPublished }: { templateId: string; isPublished: boolean }) {
  return (
    <button
      type="button"
      onClick={() => togglePublishTemplateAction(templateId)}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
        isPublished
          ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700"
      }`}
    >
      {isPublished ? "Published" : "Publish"}
    </button>
  );
}
