"use client";

import { useActionState } from "react";
import { parentLoginAction } from "./actions";

export function LoginCodeForm() {
  const [error, formAction, pending] = useActionState(parentLoginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-neutral-700">
          Access code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          maxLength={6}
          required
          autoComplete="one-time-code"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-center text-lg tracking-widest focus:border-neutral-500 focus:outline-none"
          placeholder="000000"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
