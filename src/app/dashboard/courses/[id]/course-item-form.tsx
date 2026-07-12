"use client";

import { useActionState } from "react";
import { addCourseItemAction } from "../actions";

type LessonType = { id: string; name: string };

export function CourseItemForm({ courseId, lessonTypes }: { courseId: string; lessonTypes: LessonType[] }) {
  const [error, action, pending] = useActionState(addCourseItemAction.bind(null, courseId), undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="title" className="block text-xs font-medium text-neutral-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-32">
          <label htmlFor="mediaType" className="block text-xs font-medium text-neutral-700">
            Type
          </label>
          <select
            id="mediaType"
            name="mediaType"
            defaultValue="VIDEO"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="VIDEO">Video</option>
            <option value="AUDIO">Audio</option>
            <option value="DOCUMENT">Document</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="mediaUrl" className="block text-xs font-medium text-neutral-700">
          Media URL
        </label>
        <input
          id="mediaUrl"
          name="mediaUrl"
          type="url"
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {lessonTypes.length > 0 && (
        <div>
          <label htmlFor="lessonTypeId" className="block text-xs font-medium text-neutral-700">
            Link to lesson type (optional)
          </label>
          <select
            id="lessonTypeId"
            name="lessonTypeId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">—</option>
            {lessonTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add item"}
      </button>
    </form>
  );
}
