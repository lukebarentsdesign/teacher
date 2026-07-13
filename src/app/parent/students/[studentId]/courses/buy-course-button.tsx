"use client";

import { useState } from "react";
import { startCourseCheckoutAction } from "./actions";

export function BuyCourseButton({ studentId, courseId, price }: { studentId: string; courseId: string; price: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const err = await startCourseCheckoutAction(studentId, courseId);
          setPending(false);
          if (err) setError(err);
        }}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Redirecting…" : `Buy for £${price}`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
