"use client";

import { useActionState, useState } from "react";
import { updateRoomAction } from "../../actions";
import { OpenHoursEditor, type OpenHoursRow } from "../../open-hours-editor";

type Room = {
  id: string;
  label: string;
  features: { hasPiano?: boolean; hasMirrors?: boolean; floor?: string | null };
  openHours: OpenHoursRow[];
};

export function EditRoomForm({ room }: { room: Room }) {
  const [error, formAction, pending] = useActionState(updateRoomAction.bind(null, room.id), undefined);
  const [openHours, setOpenHours] = useState<OpenHoursRow[]>(room.openHours);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <input type="hidden" name="openHours" value={JSON.stringify(openHours)} />

      <div>
        <label htmlFor="label" className="block text-sm font-medium text-neutral-700">
          Room label
        </label>
        <input
          id="label"
          name="label"
          type="text"
          required
          defaultValue={room.label}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="floor" className="block text-sm font-medium text-neutral-700">
          Floor (optional)
        </label>
        <input
          id="floor"
          name="floor"
          type="text"
          defaultValue={room.features.floor ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="hasPiano" value="true" defaultChecked={!!room.features.hasPiano} />
          Has piano
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="hasMirrors" value="true" defaultChecked={!!room.features.hasMirrors} />
          Has mirrors
        </label>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-neutral-700">Open hours (optional)</p>
        <OpenHoursEditor rows={openHours} setRows={setOpenHours} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
