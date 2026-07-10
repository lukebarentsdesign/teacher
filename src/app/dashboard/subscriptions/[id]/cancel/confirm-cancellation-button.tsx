"use client";

import { confirmCancellationAction } from "../actions";

export function ConfirmCancellationButton({ subscriptionId }: { subscriptionId: string }) {
  return (
    <form action={confirmCancellationAction.bind(null, subscriptionId)}>
      <button
        type="submit"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700"
      >
        Confirm cancellation
      </button>
    </form>
  );
}
