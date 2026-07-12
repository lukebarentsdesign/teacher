"use client";

import { useActionState, useTransition } from "react";
import {
  setLessonTypeLocationPricingAction,
  removeLessonTypeLocationPricingAction,
} from "../actions";

type Location = { id: string; name: string };
type Pricing = { id: string; locationId: string; locationName: string; fee: string };

export function LocationPricing({
  lessonTypeId,
  defaultFee,
  candidateLocations,
  pricing,
}: {
  lessonTypeId: string;
  defaultFee: string;
  candidateLocations: Location[];
  pricing: Pricing[];
}) {
  const [error, action, pending] = useActionState(
    setLessonTypeLocationPricingAction.bind(null, lessonTypeId),
    undefined
  );
  const [removing, startRemove] = useTransition();

  if (candidateLocations.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No teaching locations to price against yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        Default fee is £{defaultFee}. Override it for a specific location below — e.g. taught from
        a music college costs more than taught from home.
      </p>

      {pricing.length > 0 && (
        <ul className="space-y-2">
          {pricing.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <span className="text-neutral-800">
                {p.locationName} — £{p.fee}
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() => startRemove(() => removeLessonTypeLocationPricingAction(p.id, lessonTypeId))}
                className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
              >
                Remove override
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-neutral-700">Location</label>
          <select
            name="locationId"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            {candidateLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-neutral-700">Fee (£)</label>
          <input
            name="fee"
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
        >
          Set
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
