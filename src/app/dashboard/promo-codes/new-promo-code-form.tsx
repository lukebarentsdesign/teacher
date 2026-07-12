"use client";

import { useActionState } from "react";
import { createPromoCodeAction } from "./actions";

type LessonType = { id: string; name: string };

export function NewPromoCodeForm({ lessonTypes }: { lessonTypes: LessonType[] }) {
  const [error, action, pending] = useActionState(createPromoCodeAction, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="code" className="block text-sm font-medium text-neutral-700">
            Code
          </label>
          <input
            id="code"
            name="code"
            placeholder="SUMMER10"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-40">
          <label htmlFor="discountType" className="block text-sm font-medium text-neutral-700">
            Type
          </label>
          <select
            id="discountType"
            name="discountType"
            defaultValue="PERCENT"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
        </div>
        <div className="w-32">
          <label htmlFor="value" className="block text-sm font-medium text-neutral-700">
            Value
          </label>
          <input
            id="value"
            name="value"
            type="number"
            min={0.01}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="validFrom" className="block text-sm font-medium text-neutral-700">
            Valid from (optional)
          </label>
          <input
            id="validFrom"
            name="validFrom"
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="validTo" className="block text-sm font-medium text-neutral-700">
            Valid to (optional)
          </label>
          <input
            id="validTo"
            name="validTo"
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-32">
          <label htmlFor="usageLimit" className="block text-sm font-medium text-neutral-700">
            Usage limit
          </label>
          <input
            id="usageLimit"
            name="usageLimit"
            type="number"
            min={1}
            placeholder="Unlimited"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>
      {lessonTypes.length > 0 && (
        <div>
          <label htmlFor="lessonTypeId" className="block text-sm font-medium text-neutral-700">
            Scope to lesson type (optional, informational)
          </label>
          <select
            id="lessonTypeId"
            name="lessonTypeId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">Any</option>
            {lessonTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "New promo code"}
      </button>
    </form>
  );
}
