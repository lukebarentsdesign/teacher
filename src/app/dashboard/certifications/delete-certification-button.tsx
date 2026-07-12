"use client";

import { deleteCertificationAction } from "./actions";

export function DeleteCertificationButton({ certId }: { certId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteCertificationAction(certId)}
      className="text-xs text-red-600 underline hover:text-red-800"
    >
      Remove
    </button>
  );
}
