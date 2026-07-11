"use client";

import { useActionState } from "react";
import type { LoanableItem, Student } from "@prisma/client";
import { checkOutLoanAction } from "./actions";

export function CheckoutForm({
  availableItems,
  students,
}: {
  availableItems: LoanableItem[];
  students: Student[];
}) {
  const [error, formAction, pending] = useActionState(checkOutLoanAction, undefined);

  if (availableItems.length === 0) {
    return <p className="text-sm text-neutral-500">No equipment currently available to loan out.</p>;
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="itemId" className="block text-sm font-medium text-neutral-700">
          Item
        </label>
        <select
          id="itemId"
          name="itemId"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {availableItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700">
          Student
        </label>
        <select
          id="studentId"
          name="studentId"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dueBackDate" className="block text-sm font-medium text-neutral-700">
          Due back
        </label>
        <input
          id="dueBackDate"
          name="dueBackDate"
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Check out"}
      </button>
    </form>
  );
}
