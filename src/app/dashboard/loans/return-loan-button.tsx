"use client";

import { returnLoanAction } from "./actions";

export function ReturnLoanButton({ loanId }: { loanId: string }) {
  return (
    <form action={returnLoanAction.bind(null, loanId)}>
      <button
        type="submit"
        className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
      >
        Return
      </button>
    </form>
  );
}
