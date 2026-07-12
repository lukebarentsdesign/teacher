"use client";

import { deletePromoCodeAction } from "./actions";

export function DeletePromoCodeButton({ promoCodeId }: { promoCodeId: string }) {
  return (
    <button
      type="button"
      onClick={() => deletePromoCodeAction(promoCodeId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
