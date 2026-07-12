"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createStudentWithRelationshipsAction } from "../actions";
import { ageInYears } from "@/lib/age";

type TeachingLocation = { id: string; name: string };

type PayerDraft = {
  payerId?: string; // set when an existing payer was picked
  name: string;
  email: string;
  phone: string;
  contactPref: "" | "WHATSAPP" | "SMS" | "EMAIL";
  notes: string;
  splitPercent?: string;
  isSelf?: boolean;
  isEmergencyContactOnly?: boolean;
};

const emptyPayer = (): PayerDraft => ({ name: "", email: "", phone: "", contactPref: "", notes: "" });

type Responsibility = "SELF" | "GUARDIAN" | "SCHOOL";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        Step {step} of {total}
      </p>
      <h2 className="mt-1 text-lg font-medium text-neutral-900">{title}</h2>
    </div>
  );
}

// --- Existing-payer typeahead (search-before-create) ---
function PayerTypeahead({ onPick }: { onPick: (p: { id: string; name: string; phone: string | null }) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; phone: string | null; pupils: string[] }[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?scope=payers&q=${encodeURIComponent(q)}`);
      if (res.ok) setResults((await res.json()).payers);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <label className={labelClass}>Search existing guardians / payers first</label>
      <p className="mb-1 text-xs text-neutral-500">
        Catches siblings already in the system under one household.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name, phone or email"
        className={inputClass}
      />
      {results.length > 0 && (
        <div className="mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onPick(r);
                setQ("");
                setResults([]);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
            >
              <span className="text-neutral-900">{r.name}</span>
              {r.phone && <span className="ml-2 text-neutral-400">{r.phone}</span>}
              {r.pupils.length > 0 && (
                <span className="ml-2 text-xs text-neutral-400">· {r.pupils.join(", ")}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PayerFields({
  payer,
  onChange,
  showSplit,
}: {
  payer: PayerDraft;
  onChange: (patch: Partial<PayerDraft>) => void;
  showSplit?: boolean;
}) {
  if (payer.payerId) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
        <span className="text-neutral-900">{payer.name} (existing)</span>
        <button type="button" onClick={() => onChange({ payerId: undefined, name: "" })} className="text-xs text-neutral-500 hover:text-red-600">
          Change
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Name</label>
        <input value={payer.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phone</label>
          <input value={payer.phone} onChange={(e) => onChange({ phone: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input value={payer.email} onChange={(e) => onChange({ email: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Preferred contact</label>
        <select
          value={payer.contactPref}
          onChange={(e) => onChange({ contactPref: e.target.value as PayerDraft["contactPref"] })}
          className={inputClass}
        >
          <option value="">No preference</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Notes / address</label>
        <textarea value={payer.notes} onChange={(e) => onChange({ notes: e.target.value })} rows={2} className={inputClass} />
      </div>
      {showSplit && (
        <div>
          <label className={labelClass}>Split % (optional)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={payer.splitPercent ?? ""}
            onChange={(e) => onChange({ splitPercent: e.target.value })}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}

export function StudentWizard({ locations }: { locations: TeachingLocation[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [source, setSource] = useState<"HOME" | "SCHOOL_INQUIRY" | "COLLEGE">("HOME");

  // Step 2
  const [responsibility, setResponsibility] = useState<Responsibility>();

  // Step 3 payers (billing or self)
  const [payers, setPayers] = useState<PayerDraft[]>([emptyPayer()]);
  // School-invoiced emergency contact (under-18)
  const [emergencyContact, setEmergencyContact] = useState<PayerDraft>(emptyPayer());
  const [invoicingSchoolId, setInvoicingSchoolId] = useState("");

  // Step 4
  const [locationId, setLocationId] = useState("");

  const isAdult = dob ? ageInYears(new Date(dob)) >= 18 : false;
  const total = 5;

  function updatePayer(i: number, patch: Partial<PayerDraft>) {
    setPayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function next() {
    setError(undefined);
    if (step === 1) {
      if (!name.trim() || !discipline.trim()) return setError("Name and discipline are required.");
    }
    if (step === 2 && !responsibility) return setError("Pick who is responsible for payment.");
    setStep((s) => Math.min(total, s + 1));
  }

  function back() {
    setError(undefined);
    setStep((s) => Math.max(1, s - 1));
  }

  // Assemble the payer list for save/confirmation based on the chosen branch.
  function resolvedPayers(): PayerDraft[] {
    if (responsibility === "SELF") {
      return [{ ...payers[0], isSelf: true }];
    }
    if (responsibility === "GUARDIAN") {
      return payers.filter((p) => p.payerId || p.name.trim());
    }
    if (responsibility === "SCHOOL" && !isAdult) {
      const c = emergencyContact;
      return c.payerId || c.name.trim() ? [{ ...c, isEmergencyContactOnly: true }] : [];
    }
    return [];
  }

  async function save() {
    setError(undefined);
    setSaving(true);
    const result = await createStudentWithRelationshipsAction({
      name,
      dob: dob || undefined,
      discipline,
      source,
      paymentResponsibility: responsibility,
      locationId: locationId || undefined,
      invoicingSchoolId: responsibility === "SCHOOL" ? invoicingSchoolId || undefined : undefined,
      payers: resolvedPayers().map((p) => ({
        payerId: p.payerId,
        name: p.name || undefined,
        email: p.email || undefined,
        phone: p.phone || undefined,
        contactPref: p.contactPref || undefined,
        notes: p.notes || undefined,
        splitPercent: p.splitPercent ? Number(p.splitPercent) : undefined,
        isSelf: p.isSelf,
        isEmergencyContactOnly: p.isEmergencyContactOnly,
      })),
    });
    setSaving(false);
    if (result.error) return setError(result.error);
    router.push(`/dashboard/students/${result.studentId}`);
  }

  const locationName = (sid: string) => locations.find((s) => s.id === sid)?.name ?? "—";

  return (
    <div className="max-w-lg rounded-xl bg-white p-6 shadow-sm">
      {step === 1 && (
        <>
          <StepHeader step={1} total={total} title="Student basics" />
          <div className="space-y-4">
            <div>
              <label htmlFor="wiz-name" className={labelClass}>Name</label>
              <input id="wiz-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="wiz-dob" className={labelClass}>Date of birth</label>
              <input id="wiz-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
              {dob && (
                <p className="mt-1 text-xs text-neutral-500">
                  Age {ageInYears(new Date(dob))} · {isAdult ? "adult (can self-pay)" : "under 18"}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="wiz-discipline" className={labelClass}>Instrument / class / discipline</label>
              <input id="wiz-discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className={inputClass}>
                <option value="HOME">Home</option>
                <option value="SCHOOL_INQUIRY">School inquiry</option>
                <option value="COLLEGE">College</option>
              </select>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader step={2} total={total} title="Who is responsible for payment?" />
          <div className="space-y-2">
            {isAdult && (
              <ChoiceButton
                active={responsibility === "SELF"}
                onClick={() => setResponsibility("SELF")}
                title="Student pays themself"
                sub="18+ only — creates a self-paying record from the student's own details."
              />
            )}
            <ChoiceButton
              active={responsibility === "GUARDIAN"}
              onClick={() => setResponsibility("GUARDIAN")}
              title="Parent / guardian pays"
              sub="Search for an existing household, or add a new payer."
            />
            <ChoiceButton
              active={responsibility === "SCHOOL"}
              onClick={() => setResponsibility("SCHOOL")}
              title="School invoices"
              sub={isAdult ? "The school is billed directly." : "The school is billed; an emergency contact is still required."}
            />
          </div>
        </>
      )}

      {step === 3 && responsibility === "SELF" && (
        <>
          <StepHeader step={3} total={total} title="Student's own contact details" />
          <PayerFields payer={payers[0]} onChange={(patch) => updatePayer(0, patch)} />
        </>
      )}

      {step === 3 && responsibility === "GUARDIAN" && (
        <>
          <StepHeader step={3} total={total} title="Parent / guardian" />
          <div className="space-y-5">
            {payers.map((payer, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-neutral-200 p-3">
                {i > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-neutral-700">Second payer</span>
                    <button type="button" onClick={() => setPayers((p) => p.filter((_, idx) => idx !== i))} className="text-xs text-neutral-500 hover:text-red-600">
                      Remove
                    </button>
                  </div>
                )}
                {!payer.payerId && (
                  <PayerTypeahead onPick={(p) => updatePayer(i, { payerId: p.id, name: p.name, phone: p.phone ?? "" })} />
                )}
                <PayerFields payer={payer} onChange={(patch) => updatePayer(i, patch)} showSplit={payers.length > 1} />
              </div>
            ))}
            {payers.length < 2 && (
              <button
                type="button"
                onClick={() => setPayers((p) => [...p, emptyPayer()])}
                className="text-sm text-brand-700 hover:underline"
              >
                + Add a second payer (split payment)
              </button>
            )}
          </div>
        </>
      )}

      {step === 3 && responsibility === "SCHOOL" && (
        <>
          <StepHeader step={3} total={total} title="Teaching location to invoice" />
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Teaching location</label>
              <select value={invoicingSchoolId} onChange={(e) => setInvoicingSchoolId(e.target.value)} className={inputClass}>
                <option value="">Select a teaching location</option>
                {locations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {!isAdult && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">
                  Emergency / guardian contact (required for under-18)
                </p>
                <p className="text-xs text-amber-800">
                  Stored as a contact only — not billed.
                </p>
                {!emergencyContact.payerId && (
                  <PayerTypeahead onPick={(p) => setEmergencyContact((c) => ({ ...c, payerId: p.id, name: p.name, phone: p.phone ?? "" }))} />
                )}
                <PayerFields payer={emergencyContact} onChange={(patch) => setEmergencyContact((c) => ({ ...c, ...patch }))} />
              </div>
            )}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <StepHeader step={4} total={total} title="Link to a teaching location (optional)" />
          <p className="mb-3 text-sm text-neutral-500">
            Where lessons happen — independent of who is invoiced. Leave blank for a home student.
          </p>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClass}>
            <option value="">No teaching location</option>
            {locations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </>
      )}

      {step === 5 && (
        <>
          <StepHeader step={5} total={total} title="Confirm" />
          <div className="space-y-3 rounded-lg bg-neutral-50 p-4 text-sm">
            <p className="font-medium text-neutral-900">{name || "(unnamed student)"}</p>
            <p className="text-neutral-600">
              {discipline} · {dob ? `age ${ageInYears(new Date(dob))}` : "no DOB"} · source {source}
            </p>
            <div className="border-t border-neutral-200 pt-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Billing</p>
              {responsibility === "SCHOOL" ? (
                <p className="text-neutral-900">Teaching location invoiced: {locationName(invoicingSchoolId)}</p>
              ) : (
                <p className="text-neutral-900">
                  {responsibility === "SELF" ? "Self-paying" : "Guardian(s)"}:{" "}
                  {resolvedPayers().map((p) => p.name || "(existing payer)").join(", ") || "—"}
                </p>
              )}
              {resolvedPayers().some((p) => p.isEmergencyContactOnly) && (
                <p className="text-neutral-500">Emergency contact captured (not billed).</p>
              )}
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Teaching location</p>
              <p className="text-neutral-900">{locationId ? locationName(locationId) : "Home student"}</p>
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-40"
        >
          Back
        </button>
        {step < total ? (
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save student"}
          </button>
        )}
      </div>
    </div>
  );
}

function ChoiceButton({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg border px-4 py-3 text-left transition-colors duration-150 ${
        active ? "border-brand-600 bg-brand-50" : "border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>
    </button>
  );
}
