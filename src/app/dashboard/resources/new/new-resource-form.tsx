"use client";

import { useActionState } from "react";
import type { Student } from "@prisma/client";
import { createResourceAction } from "../actions";

export function NewResourceForm({ students, folders }: { students: Student[]; folders: string[] }) {
  const [error, formAction, pending] = useActionState(createResourceAction, undefined);
  const inputClass = "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <form action={formAction} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700">Title</label>
          <input id="title" name="title" required placeholder="Warm-up track, Grade 2 sight-reading scan..." className={inputClass} />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-neutral-700">Type</label>
          <select id="type" name="type" defaultValue="DOCUMENT" className={inputClass}>
            <option value="DOCUMENT">Document / PDF</option>
            <option value="IMAGE">Photo / scan</option>
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>

        <div>
          <label htmlFor="sourceLabel" className="block text-sm font-medium text-neutral-700">Source</label>
          <input id="sourceLabel" name="sourceLabel" list="resource-sources" placeholder="YouTube, Spotify, upload, website" className={inputClass} />
          <datalist id="resource-sources">
            <option value="YouTube" />
            <option value="Spotify" />
            <option value="Audio upload" />
            <option value="Phone scan" />
            <option value="PDF upload" />
            <option value="Website" />
          </datalist>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="url" className="block text-sm font-medium text-neutral-700">Resource link</label>
          <input id="url" name="url" type="url" required placeholder="https://..." className={inputClass} />
        </div>

        <div>
          <label htmlFor="folder" className="block text-sm font-medium text-neutral-700">Folder</label>
          <input id="folder" name="folder" list="resource-folders" placeholder="Warm-ups, backing tracks, scans" className={inputClass} />
          <datalist id="resource-folders">
            {folders.map((folder) => <option key={folder} value={folder} />)}
          </datalist>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-neutral-700">Tags</label>
          <input id="tags" name="tags" placeholder="grade 2, rhythm, exam" className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-neutral-700">Thumbnail URL (optional)</label>
          <input id="thumbnailUrl" name="thumbnailUrl" type="url" placeholder="https://..." className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">Notes (optional)</label>
          <textarea id="description" name="description" rows={3} className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">Attach to a student (optional)</label>
          <select id="studentId" name="studentId" defaultValue="" className={inputClass}>
            <option value="">General library</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <input type="checkbox" name="pinned" className="h-4 w-4 rounded border-neutral-300" />
        Pin in the resource centre
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50">
        {pending ? "Saving..." : "Save resource"}
      </button>
    </form>
  );
}