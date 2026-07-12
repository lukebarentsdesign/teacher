"use client";

import { useState } from "react";

type Location = { id: string; name: string };

export function ShareOnboardingLink({
  teacherId,
  locations,
  hasLessonTypes,
}: {
  teacherId: string;
  locations: Location[];
  hasLessonTypes: boolean;
}) {
  const [locationId, setLocationId] = useState("");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/onboard/${teacherId}${locationId ? `?location=${locationId}` : ""}`;

  if (!hasLessonTypes) {
    return (
      <p className="text-sm text-neutral-500">
        Add at least one active lesson type first — the link has nothing for a student to choose
        from otherwise.
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      {locations.length > 0 && (
        <div className="mb-3">
          <label htmlFor="locationScope" className="block text-xs font-medium text-neutral-700">
            Scope to one location (optional)
          </label>
          <select
            id="locationScope"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
