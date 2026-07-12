"use client";

import { deleteCourseItemAction } from "../actions";

export function DeleteItemButton({ itemId, courseId }: { itemId: string; courseId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteCourseItemAction(itemId, courseId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
