"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendPayerEmailAction } from "./actions";

export function SendEmailForm({ payerId }: { payerId: string }) {
  const [error, formAction, pending] = useActionState(sendPayerEmailAction, undefined);
  const [sent, setSent] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) setSent(!error);
    wasPending.current = pending;
  }, [pending, error]);

  return (
    <form
      action={(formData: FormData) => {
        setSent(false);
        formAction(formData);
      }}
      className="space-y-3 rounded-xl bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="payerId" value={payerId} />
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-neutral-700">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-neutral-700">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {sent && !pending && !error && <p className="text-sm text-green-700">Sent.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
