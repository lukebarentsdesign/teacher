"use client";

import { useActionState, useMemo, useState } from "react";
import { submitSelfServeOnboardingAction, type SelfServeResult } from "./actions";

type LessonType = { id: string; name: string; description: string | null; defaultDurationMinutes: number };
type Location = { id: string; name: string };

function calculateAgeEligible(dob: string): boolean {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age >= 18;
}

export function OnboardingForm({
  teacherId,
  teacherName,
  lessonTypes,
  locations,
  presetLocationId,
}: {
  teacherId: string;
  teacherName: string;
  lessonTypes: LessonType[];
  locations: Location[];
  presetLocationId?: string;
}) {
  const initialState: SelfServeResult = {};
  const [state, formAction, pending] = useActionState(
    submitSelfServeOnboardingAction.bind(null, teacherId),
    initialState
  );

  const [dob, setDob] = useState("");
  const [paymentResponsibility, setPaymentResponsibility] = useState<"SELF" | "GUARDIAN" | "SCHOOL">("GUARDIAN");
  const isAdult = useMemo(() => calculateAgeEligible(dob), [dob]);

  if (state.success) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">Thanks — you&apos;re on the list</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {teacherName} will review this and be in touch to confirm.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="payers" id="payersJson" value="[]" />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Student details</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              Student name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-neutral-700">
              Date of birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lessonTypeId" className="block text-sm font-medium text-neutral-700">
              What are you interested in?
            </label>
            <select id="lessonTypeId" name="lessonTypeId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choose one…
              </option>
              {lessonTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.defaultDurationMinutes} min)
                </option>
              ))}
            </select>
          </div>
          {locations.length > 0 && (
            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-neutral-700">
                Where do lessons happen? (optional)
              </label>
              <select
                id="locationId"
                name="locationId"
                defaultValue={presetLocationId ?? ""}
                className={inputClass}
              >
                <option value="">Not sure / at home</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Who&apos;s responsible for payment?</h2>
        <div className="flex flex-wrap gap-2">
          {isAdult && (
            <RadioChip
              name="paymentResponsibility"
              value="SELF"
              checked={paymentResponsibility === "SELF"}
              onSelect={() => setPaymentResponsibility("SELF")}
              label="I'll pay myself"
            />
          )}
          <RadioChip
            name="paymentResponsibility"
            value="GUARDIAN"
            checked={paymentResponsibility === "GUARDIAN"}
            onSelect={() => setPaymentResponsibility("GUARDIAN")}
            label="Parent/guardian pays"
          />
          {locations.length > 0 && (
            <RadioChip
              name="paymentResponsibility"
              value="SCHOOL"
              checked={paymentResponsibility === "SCHOOL"}
              onSelect={() => setPaymentResponsibility("SCHOOL")}
              label="My school invoices"
            />
          )}
        </div>

        {paymentResponsibility === "SCHOOL" && (
          <div className="mt-4">
            <label htmlFor="invoicingSchoolId" className="block text-sm font-medium text-neutral-700">
              Which school?
            </label>
            <select id="invoicingSchoolId" name="invoicingSchoolId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choose…
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {!isAdult && (
              <p className="mt-3 text-xs text-neutral-500">
                We still need a parent/guardian contact below, even though the school is billed.
              </p>
            )}
          </div>
        )}

        {(paymentResponsibility !== "SELF" || !isAdult) && (
          <PayerFields
            required={paymentResponsibility !== "SCHOOL" || !isAdult}
            emergencyOnly={paymentResponsibility === "SCHOOL"}
          />
        )}

        {paymentResponsibility === "SELF" && isAdult && <SelfPayerFields />}
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          const form = (e.target as HTMLElement).closest("form")!;
          const payersInput = form.querySelector<HTMLInputElement>("#payersJson")!;
          payersInput.value = collectPayersFromForm(form, paymentResponsibility, isAdult);
        }}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

function RadioChip({
  name,
  value,
  checked,
  onSelect,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <label
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
        checked ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function PayerFields({ required, emergencyOnly }: { required: boolean; emergencyOnly: boolean }) {
  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
  return (
    <div className="mt-4 space-y-3" data-payer-block data-emergency-only={emergencyOnly ? "true" : "false"}>
      <p className="text-xs font-medium text-neutral-500">
        {emergencyOnly ? "Emergency/guardian contact" : "Parent/guardian contact"}
      </p>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Name</label>
        <input name="payerName" required={required} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Email</label>
          <input name="payerEmail" type="email" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Phone</label>
          <input name="payerPhone" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Preferred contact</label>
        <select name="payerContactPref" defaultValue="" className={inputClass}>
          <option value="">No preference</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>
    </div>
  );
}

function SelfPayerFields() {
  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
  return (
    <div className="mt-4 space-y-3" data-self-payer-block>
      <p className="text-xs font-medium text-neutral-500">Your contact details</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Email</label>
          <input name="selfEmail" type="email" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Phone</label>
          <input name="selfPhone" className={inputClass} />
        </div>
      </div>
    </div>
  );
}

function collectPayersFromForm(
  form: HTMLFormElement,
  paymentResponsibility: "SELF" | "GUARDIAN" | "SCHOOL",
  isAdult: boolean
): string {
  const payers: {
    name?: string;
    email?: string;
    phone?: string;
    contactPref?: string;
    isSelf?: boolean;
    isEmergencyContactOnly?: boolean;
  }[] = [];

  if (paymentResponsibility === "SELF" && isAdult) {
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value;
    const email = (form.querySelector('[name="selfEmail"]') as HTMLInputElement)?.value;
    const phone = (form.querySelector('[name="selfPhone"]') as HTMLInputElement)?.value;
    payers.push({ name, email: email || undefined, phone: phone || undefined, isSelf: true });
  }

  const payerBlock = form.querySelector<HTMLElement>("[data-payer-block]");
  if (payerBlock) {
    const name = (payerBlock.querySelector('[name="payerName"]') as HTMLInputElement)?.value;
    if (name?.trim()) {
      const email = (payerBlock.querySelector('[name="payerEmail"]') as HTMLInputElement)?.value;
      const phone = (payerBlock.querySelector('[name="payerPhone"]') as HTMLInputElement)?.value;
      const contactPref = (payerBlock.querySelector('[name="payerContactPref"]') as HTMLSelectElement)?.value;
      payers.push({
        name,
        email: email || undefined,
        phone: phone || undefined,
        contactPref: contactPref || undefined,
        isEmergencyContactOnly: payerBlock.dataset.emergencyOnly === "true",
      });
    }
  }

  return JSON.stringify(payers);
}
