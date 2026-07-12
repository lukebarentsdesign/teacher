"use client";

import { deleteTemplateSectionAction } from "../actions";

export function DeleteSectionButton({ sectionId, templateId }: { sectionId: string; templateId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteTemplateSectionAction(sectionId, templateId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
