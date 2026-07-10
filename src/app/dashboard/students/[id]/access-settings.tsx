"use client";

import { useActionState } from "react";
import {
  grantIndependentAccessAction,
  revokeIndependentAccessAction,
  regenerateStudentAccessCodeAction,
  toggleShareBalanceAction,
} from "./actions";

type Props = {
  studentId: string;
  dob: string | null; // ISO date or null
  hasIndependentAccess: boolean;
  studentAccessCode: string | null;
  shareBalanceWithStudent: boolean;
};

function calculateAgeEligible(dob: string | null): boolean {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age >= 16;
}

export function AccessSettings({
  studentId,
  dob,
  hasIndependentAccess,
  studentAccessCode,
  shareBalanceWithStudent,
}: Props) {
  const [error, grantAction, pending] = useActionState(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
    async (_prevState: string | undefined, _formData: FormData) => grantIndependentAccessAction(studentId),
    undefined
  );

  const eligible = calculateAgeEligible(dob);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-neutral-900">Independent student access</p>
      <p className="mt-1 text-xs text-neutral-500">
        Additive to the guardian&apos;s own access, never a replacement — the guardian always sees
        everything the student can. Only available once the student turns 16.
      </p>

      {!hasIndependentAccess ? (
        <div className="mt-3">
          {!dob ? (
            <p className="text-sm text-amber-700">Add a date of birth first to check eligibility.</p>
          ) : !eligible ? (
            <p className="text-sm text-amber-700">Not eligible yet — under 16.</p>
          ) : (
            <form action={grantAction}>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
              >
                {pending ? "Granting…" : "Grant independent access"}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base tracking-widest text-neutral-900">
              {studentAccessCode}
            </span>
            <form action={regenerateStudentAccessCodeAction.bind(null, studentId)}>
              <button type="submit" className="text-xs text-neutral-500 underline hover:text-neutral-900">
                Regenerate
              </button>
            </form>
            <form action={revokeIndependentAccessAction.bind(null, studentId)}>
              <button type="submit" className="text-xs text-red-600 underline hover:text-red-800">
                Revoke access
              </button>
            </form>
          </div>

          <form action={toggleShareBalanceAction.bind(null, studentId, !shareBalanceWithStudent)}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
            >
              <span
                className={`inline-block h-4 w-4 rounded border ${
                  shareBalanceWithStudent ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                }`}
              />
              Share financial ledger/balance with the student
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
