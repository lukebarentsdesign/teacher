"use client";

import { deleteGiftCardAction } from "./actions";

export function DeleteGiftCardButton({ giftCardId }: { giftCardId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteGiftCardAction(giftCardId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
