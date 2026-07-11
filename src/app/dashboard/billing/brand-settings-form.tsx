"use client";

import { useActionState } from "react";
import { updateBrandSettingsAction } from "./actions";

export function BrandSettingsForm({
  personalBrandColor,
  autoApplyCreditToNextPayment,
}: {
  personalBrandColor: string | null;
  autoApplyCreditToNextPayment: boolean;
}) {
  const [error, formAction, pending] = useActionState(updateBrandSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="personalBrandColor" className="block text-sm font-medium text-neutral-700">
          Your brand color
        </label>
        <p className="mb-1 text-xs text-neutral-500">
          Used for home-sourced students&apos; lessons on your calendar, when no school color applies.
        </p>
        <input
          id="personalBrandColor"
          name="personalBrandColor"
          type="color"
          defaultValue={personalBrandColor ?? "#171717"}
          className="h-10 w-16 rounded-lg border border-neutral-300"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="autoApplyCreditToNextPayment"
          value="true"
          defaultChecked={autoApplyCreditToNextPayment}
          className="mt-0.5"
        />
        <span>
          Automatically reduce the suggested amount on a subscription&apos;s next payment request by
          any banked make-up credit. If off, the credit is just shown for you to account for manually.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
