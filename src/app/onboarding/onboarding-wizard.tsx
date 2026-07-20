"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  submitArchetypeAction,
  createFirstLessonTypeAction,
  createFirstLocationAction,
  completeOnboardingAction,
  submitOutOfScopeAction,
} from "./actions";
import { createStudentWithRelationshipsAction } from "@/app/dashboard/students/actions";

type Step = "archetype" | "outOfScope" | "outOfScopeDone" | "lessonType" | "location" | "student" | "done";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700 disabled:opacity-50"
    />
  );
}

function SkipLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 block w-full text-center text-sm text-neutral-500 hover:text-neutral-800">
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white p-6 shadow-sm">{children}</div>;
}

export function OnboardingWizard({
  initialTeachesGroups,
  initialControlsOwnSchedule,
}: {
  initialTeachesGroups: boolean | null;
  initialControlsOwnSchedule: boolean | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(
    initialTeachesGroups != null && initialControlsOwnSchedule != null ? "lessonType" : "archetype"
  );
  const [archetype, setArchetype] = useState<"SOLO" | "GROUP_INDEPENDENT" | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function goToDashboard() {
    await completeOnboardingAction();
    router.push("/dashboard");
  }

  if (step === "archetype") {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-neutral-900">A couple of quick questions</h1>
        <p className="mt-1 mb-6 text-sm text-neutral-500">This decides what you&apos;ll see next — takes a few seconds.</p>
        <ArchetypeQuestions
          onSubmit={async (teachesGroups, controlsOwnSchedule) => {
            setPending(true);
            setError(undefined);
            const result = await submitArchetypeAction(teachesGroups, controlsOwnSchedule);
            setPending(false);
            if ("error" in result) return setError(result.error);
            if (result.outOfScope) return setStep("outOfScope");
            setArchetype(result.archetype);
            setStep("lessonType");
          }}
          pending={pending}
          error={error}
        />
      </Card>
    );
  }

  if (step === "outOfScope") {
    return (
      <Card>
        <OutOfScopeForm onDone={() => setStep("outOfScopeDone")} />
      </Card>
    );
  }

  if (step === "outOfScopeDone") {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-neutral-900">Thanks for the honesty check</h1>
        <p className="mt-2 text-sm text-neutral-600">
          TeachBase isn&apos;t built for a venue-controlled group teaching setup yet, but we&apos;ve
          noted what you told us — it genuinely helps decide what to build next.
        </p>
        <div className="mt-6">
          <PrimaryButton onClick={goToDashboard}>Take a look around anyway</PrimaryButton>
        </div>
      </Card>
    );
  }

  if (step === "lessonType") {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-neutral-900">
          What do you {archetype === "GROUP_INDEPENDENT" ? "run" : "teach"}?
        </h1>
        <p className="mt-1 mb-6 text-sm text-neutral-500">You can add more later — this just gets you started.</p>
        <LessonTypeForm
          groupMode={archetype === "GROUP_INDEPENDENT"}
          onDone={() => setStep("location")}
          onSkip={() => setStep("location")}
        />
      </Card>
    );
  }

  if (step === "location") {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-neutral-900">Where do you teach?</h1>
        <p className="mt-1 mb-6 text-sm text-neutral-500">You can add more locations later.</p>
        <LocationPicker groupMode={archetype === "GROUP_INDEPENDENT"} onDone={() => setStep("student")} onSkip={() => setStep("student")} />
      </Card>
    );
  }

  if (step === "student") {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-neutral-900">
          Add your first {archetype === "GROUP_INDEPENDENT" ? "class member" : "student"}
        </h1>
        <p className="mt-1 mb-6 text-sm text-neutral-500">Optional — you can always add people later.</p>
        <FirstStudentForm onDone={goToDashboard} />
        <SkipLink onClick={goToDashboard}>I&apos;ll do this later</SkipLink>
      </Card>
    );
  }

  return null;
}

function ArchetypeQuestions({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (teachesGroups: boolean, controlsOwnSchedule: boolean) => void;
  pending: boolean;
  error?: string;
}) {
  const [teachesGroups, setTeachesGroups] = useState<boolean | null>(null);
  const [controlsOwnSchedule, setControlsOwnSchedule] = useState<boolean | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Do you mainly teach one-to-one, or groups/classes?</p>
        <div className="flex gap-2">
          <ChoiceButton selected={teachesGroups === false} onClick={() => setTeachesGroups(false)}>
            One-to-one
          </ChoiceButton>
          <ChoiceButton selected={teachesGroups === true} onClick={() => setTeachesGroups(true)}>
            Groups/classes
          </ChoiceButton>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">
          Do you set your own schedule, or does a venue (gym, studio, school) control when your sessions run?
        </p>
        <div className="flex gap-2">
          <ChoiceButton selected={controlsOwnSchedule === true} onClick={() => setControlsOwnSchedule(true)}>
            I control it
          </ChoiceButton>
          <ChoiceButton selected={controlsOwnSchedule === false} onClick={() => setControlsOwnSchedule(false)}>
            The venue does
          </ChoiceButton>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <PrimaryButton
        disabled={teachesGroups === null || controlsOwnSchedule === null || pending}
        onClick={() => onSubmit(teachesGroups!, controlsOwnSchedule!)}
      >
        {pending ? "Saving…" : "Continue"}
      </PrimaryButton>
    </div>
  );
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
        selected ? "border-brand-600 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}

function OutOfScopeForm({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setPending(true);
        const err = await submitOutOfScopeAction(undefined, formData);
        setPending(false);
        if (err) return setError(err);
        onDone();
      }}
    >
      <h1 className="text-lg font-semibold text-neutral-900">This one&apos;s not quite built for you yet</h1>
      <p className="mt-2 text-sm text-neutral-600">
        TeachBase is built for teachers who control their own schedule — a venue-run group class
        setup (a gym, studio, or school controlling the timetable) isn&apos;t what this fits today.
        Tell us a bit about what you&apos;d actually want, and we&apos;ll keep it in mind.
      </p>
      <textarea
        name="freeTextAnswer"
        rows={3}
        placeholder="e.g. just tracking my own private clients on the side, or my hours/pay..."
        className={inputClass + " mt-4"}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function LessonTypeForm({
  groupMode,
  onDone,
  onSkip,
}: {
  groupMode: boolean;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [fee, setFee] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700">{groupMode ? "Class name" : "Name"}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={groupMode ? "e.g. Beginner Yoga" : "e.g. Flute"}
          className={inputClass}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">{groupMode ? "Typical length (min)" : "Default length (min)"}</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" className={inputClass} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Price (£)</label>
          <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" step="0.01" className={inputClass} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <PrimaryButton
        disabled={pending}
        onClick={async () => {
          if (!name.trim() || !fee.trim()) return setError("Fill in a name and price to continue, or skip for now.");
          setPending(true);
          const result = await createFirstLessonTypeAction({ name, defaultDurationMinutes: duration, defaultFee: fee });
          setPending(false);
          if (result.error) return setError(result.error);
          onDone();
        }}
      >
        {pending ? "Saving…" : "Continue"}
      </PrimaryButton>
      <SkipLink onClick={onSkip}>I&apos;ll do this later</SkipLink>
    </div>
  );
}

const LOCATION_CHOICES: { label: string; locationType: "STUDENT_HOME" | "TEACHER_BASE" | "ONLINE" }[] = [
  { label: "My home", locationType: "TEACHER_BASE" },
  { label: "I travel to students", locationType: "STUDENT_HOME" },
  { label: "I teach online", locationType: "ONLINE" },
];

function LocationPicker({ groupMode, onDone, onSkip }: { groupMode: boolean; onDone: () => void; onSkip: () => void }) {
  const [venueName, setVenueName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function createLocation(name: string, locationType: string) {
    setPending(true);
    setError(undefined);
    const result = await createFirstLocationAction({ name, locationType });
    setPending(false);
    if (result.error) return setError(result.error);
    onDone();
  }

  if (groupMode) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Venue name</label>
          <input
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="e.g. Riverside Leisure Centre"
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <PrimaryButton
          disabled={pending}
          onClick={() => (venueName.trim() ? createLocation(venueName, "HIRED_VENUE") : setError("Enter a venue name to continue, or skip."))}
        >
          {pending ? "Saving…" : "Continue"}
        </PrimaryButton>
        <SkipLink onClick={onSkip}>I&apos;ll do this later</SkipLink>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {LOCATION_CHOICES.map((choice) => (
        <button
          key={choice.locationType}
          type="button"
          disabled={pending}
          onClick={() => createLocation(choice.label, choice.locationType)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-left text-sm font-medium text-neutral-800 transition-colors duration-150 hover:border-brand-600 hover:bg-brand-50 disabled:opacity-50"
        >
          {choice.label}
        </button>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SkipLink onClick={onSkip}>I&apos;ll do this later</SkipLink>
    </div>
  );
}

function FirstStudentForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Who&apos;s paying — name</label>
        <input value={payerName} onChange={(e) => setPayerName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Their email (optional)</label>
        <input value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} type="email" className={inputClass} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <PrimaryButton
        disabled={pending}
        onClick={async () => {
          if (!name.trim() || !payerName.trim()) return setError("Enter a name and who's paying, or skip for now.");
          setPending(true);
          const result = await createStudentWithRelationshipsAction({
            name,
            discipline: "General",
            source: "HOME",
            paymentResponsibility: "GUARDIAN",
            payers: [{ name: payerName, email: payerEmail || undefined }],
          });
          setPending(false);
          if (result.error) return setError(result.error);
          onDone();
        }}
      >
        {pending ? "Saving…" : "Continue"}
      </PrimaryButton>
    </div>
  );
}
