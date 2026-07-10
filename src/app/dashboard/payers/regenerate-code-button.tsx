"use client";

import { regenerateAccessCodeAction } from "./actions";

export function RegenerateCodeButton({ payerId }: { payerId: string }) {
  return (
    <form action={regenerateAccessCodeAction.bind(null, payerId)}>
      <button
        type="submit"
        className="text-xs text-neutral-500 underline transition-colors duration-150 hover:text-neutral-900"
      >
        Regenerate
      </button>
    </form>
  );
}
