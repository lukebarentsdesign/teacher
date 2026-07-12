"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ScanLine, LogIn, LogOut } from "lucide-react";
import { scanCardAction, signInAction, signOutAction, type ScanState } from "./actions";

const initialState: ScanState = {};

export function CheckinScanner() {
  const [state, formAction] = useActionState(scanCardAction, initialState);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [state]);

  function handleScanKind(kind: "in" | "out", studentId: string, targetType: "lesson" | "groupClass", targetId: string) {
    startTransition(async () => {
      const result = kind === "in" ? await signInAction(studentId, targetType, targetId) : await signOutAction(studentId, targetType, targetId);
      setFeedback(result.error ?? result.message);
    });
  }

  return (
    <div className="space-y-6">
      <form
        action={(fd) => {
          setFeedback(undefined);
          formAction(fd);
        }}
        className="rounded-xl bg-white p-6 shadow-sm"
      >
        <label htmlFor="igCardId" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
          <ScanLine className="h-4 w-4 text-neutral-400" />
          Scan card
        </label>
        <input
          ref={inputRef}
          id="igCardId"
          name="igCardId"
          autoFocus
          autoComplete="off"
          placeholder="Scan the student's IG Card, or type its ID and press Enter"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          Most scanners act as a keyboard — just leave this field focused and scan.
        </p>
      </form>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {feedback && !state.error && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {feedback}
        </div>
      )}

      {state.result && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">{state.result.studentName}</h2>
          <ul className="space-y-2">
            {state.result.targets.map((target) => (
              <li
                key={`${target.type}-${target.id}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5"
              >
                <div className="text-sm">
                  <span className="font-medium text-neutral-800">{target.label}</span>
                  <span className="ml-2 text-neutral-500">{target.time}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleScanKind("in", state.result!.studentId, target.type, target.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleScanKind("out", state.result!.studentId, target.type, target.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
