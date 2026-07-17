"use client";

import { useActionState, useState, useEffect } from "react";
import type { Payer } from "@prisma/client";
import { createSubscriptionAction } from "./actions";
import { calculateSubscriptionSchedule, type BillingCalculationResult } from "@/lib/billing";

export function NewSubscriptionForm({ studentId, payers }: { studentId: string; payers: Payer[] }) {
  const [error, formAction, pending] = useActionState(createSubscriptionAction, undefined);
  
  const [billingModel, setBillingModel] = useState("SMOOTHED_SUBSCRIPTION");
  const [lessonCount, setLessonCount] = useState(30);
  const [lessonPrice, setLessonPrice] = useState(35);
  const [months, setMonths] = useState(12);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [manualAnnualFee, setManualAnnualFee] = useState(0);

  const [calcResult, setCalcResult] = useState<BillingCalculationResult | null>(null);

  useEffect(() => {
    if (billingModel === "SMOOTHED_SUBSCRIPTION" && lessonCount > 0 && lessonPrice > 0 && months > 0 && startDate) {
      try {
        const res = calculateSubscriptionSchedule(lessonCount, lessonPrice, months, new Date(startDate));
        setCalcResult(res);
      } catch (e) {
        setCalcResult(null);
      }
    } else {
      setCalcResult(null);
    }
  }, [billingModel, lessonCount, lessonPrice, months, startDate]);

  return (
    <form action={formAction} className="space-y-6 rounded-xl bg-white p-6 shadow-sm border border-neutral-100">
      <input type="hidden" name="studentId" value={studentId} />

      <div>
        <label htmlFor="payerId" className="block text-sm font-medium text-neutral-700">
          Payer
        </label>
        <select
          id="payerId"
          name="payerId"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none transition-colors duration-150"
        >
          {payers.map((payer) => (
            <option key={payer.id} value={payer.id}>
              {payer.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="billingModel" className="block text-sm font-medium text-neutral-700">
          Billing model
        </label>
        <select
          id="billingModel"
          name="billingModel"
          value={billingModel}
          onChange={(e) => setBillingModel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none transition-colors duration-150"
        >
          <option value="SMOOTHED_SUBSCRIPTION">Smoothed subscription (annual ÷ 12)</option>
          <option value="PER_LESSON">Per lesson</option>
          <option value="HOURLY">Hourly</option>
          <option value="TERMLY">Termly</option>
        </select>
      </div>

      {billingModel === "SMOOTHED_SUBSCRIPTION" ? (
        <div className="space-y-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Payment Calculator</p>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="lessonCount" className="block text-xs font-medium text-neutral-600">
                Lesson Count
              </label>
              <input
                id="lessonCount"
                name="lessonCount"
                type="number"
                min="1"
                value={lessonCount}
                onChange={(e) => setLessonCount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="lessonPrice" className="block text-xs font-medium text-neutral-600">
                Price (£)
              </label>
              <input
                id="lessonPrice"
                name="lessonPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={lessonPrice}
                onChange={(e) => setLessonPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="months" className="block text-xs font-medium text-neutral-600">
                Months
              </label>
              <input
                id="months"
                name="months"
                type="number"
                min="1"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {calcResult && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-neutral-100 space-y-3">
              <div className="flex justify-between text-xs border-b border-neutral-100 pb-2">
                <div>
                  <span className="text-neutral-500">Annual Total:</span>
                  <span className="ml-1 font-bold text-neutral-900">£{calcResult.annualTotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Monthly Amount:</span>
                  <span className="ml-1 font-bold text-brand-600">£{calcResult.monthlyAmount.toFixed(2)} / mo</span>
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Schedule Preview</p>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {calcResult.schedule.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-neutral-600">
                      <span>Month {idx + 1} ({new Date(item.date).toLocaleDateString("en-GB")})</span>
                      <span className={item.isLast ? "font-bold text-neutral-900" : ""}>
                        £{item.amount.toFixed(2)}
                        {item.isLast && <span className="text-2xs text-neutral-400 font-normal ml-1">(reconciled)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <input type="hidden" name="annualFee" value={calcResult?.annualTotal || 0} />
        </div>
      ) : (
        <div>
          <label htmlFor="annualFee" className="block text-sm font-medium text-neutral-700">
            {billingModel === "PER_LESSON"
              ? "Lesson rate (£)"
              : billingModel === "HOURLY"
              ? "Hourly rate (£)"
              : "Term fee (£)"}
          </label>
          <input
            id="annualFee"
            name="annualFee"
            type="number"
            step="0.01"
            min="0"
            required
            value={manualAnnualFee || ""}
            onChange={(e) => setManualAnnualFee(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none transition-colors duration-150"
          />
        </div>
      )}

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700">
          Start date
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none transition-colors duration-150"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-neutral-800 disabled:opacity-50 shadow-sm"
      >
        {pending ? "Saving…" : "Create subscription"}
      </button>
    </form>
  );
}
