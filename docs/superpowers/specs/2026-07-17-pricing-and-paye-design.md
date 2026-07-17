# Pricing complexity: duration-aware rates, location pay-rates, and PAYE hours-tracking

**Status:** design, awaiting approval
**Date:** 2026-07-17
**Origin:** live walkthrough feedback — the subscription "Payment Calculator" only takes a flat
lesson count × per-lesson price, with no concept of lesson duration, per-location pricing, venue
fees, or (most significantly) the case where a school pays the teacher directly (PAYE) rather than
the teacher invoicing a parent.

## The core distinction this design is built around

Two genuinely different income relationships exist and the app currently only models one of them:

- **Self-employed at this location** (private students, hired venues, most home visits): the
  teacher bills the parent/payer. This is everything Learnio already does — `Subscription`,
  `LedgerEntry`, `Invoice`, the payment calculator.
- **PAYE via the school**: the school pays the teacher a wage for hours taught, like payroll. There
  is **no parent invoice** — the parent's arrangement (if any) is the school's business, not the
  teacher's. What the teacher needs here is an accurate record of hours taught at that school, not a
  Subscription/ledger/invoice.

`TeacherLocationLink.taxHandling` (`SELF_EMPLOYED` | `PAYE_VIA_SCHOOL`) already exists in the schema
but **is read nowhere in the codebase** — it's a stub someone anticipated and never wired up. This
design finally uses it as the switch between the two flows, confirmed with the user: decided per
location link, not per-student or per-subscription.

## Scope

1. Duration-aware pricing in the calculator (rate/hour × duration → per-lesson price).
2. Location-aware pre-fill: a `TeacherLocationLink.payRate` (the location's own set rate) and/or
   `LessonTypeLocationPricing` pre-fill the calculator when creating a subscription for a student at
   that location.
3. Venue fee shown as a separate, honest line (never folded into the headline price) when the
   location has a `VenueFeeArrangement` — reusing the existing model, not inventing a new one.
4. **New:** for `PAYE_VIA_SCHOOL` locations, replace the parent-billing calculator entirely with an
   hours-tracking view — no Subscription is created, the calendar/lesson records already collected
   are aggregated into "hours taught this period" plus the school's own rate, shown as expected pay.

## Non-goals

- Actually paying the teacher, or reconciling what the school actually paid against expected pay
  (no bank integration exists anywhere in this app — same "no live API" honesty as mileage/travel
  time). This is a *record and estimate*, not a payroll system.
- A timesheet **submission** flow to the school (the user confirmed: no invoice/document needed for
  PAYE — just accurate hours tracking the teacher can refer to).
- Per-student override of the location's PAYE/self-employed mode (user confirmed: location-level only).
- Retrofitting existing PAYE-flagged locations' historical lessons into the new hours view — it
  applies going forward; a "recompute from lesson history" pass is possible later but out of scope now.

---

## Part A — Duration-aware calculator pricing

### Data model
No new fields needed for the base case — `calculateSubscriptionSchedule` already takes a
per-lesson `lessonPrice`. Add a **pure derivation** ahead of it:

```ts
// src/lib/billing-calculations.ts
export type RateUnit = "HOUR" | "HALF_HOUR" | "LESSON";

export function derivePerLessonPrice(rate: number, unit: RateUnit, durationMins: number): number {
  if (unit === "LESSON") return rate;
  const unitMinutes = unit === "HOUR" ? 60 : 30;
  return Number(((rate / unitMinutes) * durationMins).toFixed(2));
}
```

Pure, unit-tested (e.g. £30/hr × 30 min = £15.00; £30/hr × 20 min = £10.00, rounded to the penny).
`calculateSubscriptionSchedule` itself is unchanged — it still takes a resolved `lessonPrice`.

### UI (`new-subscription-form.tsx`)
Replace the single "Price (£)" field with:
- **Rate** (number input)
- **Unit** (select: "per hour" / "per half hour" / "per lesson")
- **Duration** (select: 15/20/30/45/60 min, or "Custom" revealing a minutes input) — only shown/used
  when unit ≠ LESSON.

The calculator preview shows the derived per-lesson price live, then feeds the existing
`lessonCount × price` math unchanged. `calculationSnapshot` gains `rate`, `rateUnit`,
`durationMins` alongside the existing fields (informational; `lessonPrice`/`annualTotal` remain the
figures everything else reads, per the existing "one figure everywhere" principle).

---

## Part B — Location-aware pre-fill

### Schema: `TeacherLocationLink.payRate` (new, optional)
```prisma
model TeacherLocationLink {
  // ...existing fields...

  /// The location's own set rate for this teacher (e.g. "the school pays £28/hr"), distinct from
  /// LessonTypeLocationPricing (which is the teacher's own menu price at that venue). When set, it
  /// pre-fills the calculator's rate/unit for any subscription created for a student at this
  /// location — the location telling the teacher what it pays is more authoritative than the
  /// teacher's own general menu price, so it wins if both exist.
  payRateAmount Decimal?    @db.Decimal(10, 2)
  payRateUnit   RateUnit?
}

enum RateUnit {
  HOUR
  HALF_HOUR
  LESSON
}
```

Editable on the existing `TeacherLocationLink` create/edit UI (`new-link-form.tsx`, and the edit
surface alongside it) as an optional "This location's rate" field — blank by default, doesn't
disturb existing links.

### Pre-fill resolution (student's subscription page)
When a teacher opens the "create subscription" form for a student who has a `locationId`:
1. If the location's `TeacherLocationLink.payRateAmount` is set → pre-fill rate/unit from it.
2. Else if the student has a `requestedLessonTypeId` (or the teacher picks a LessonType in an
   optional picker on the form) with a `LessonTypeLocationPricing` for that location → pre-fill from
   that (fee ÷ implied duration, or `LessonType.defaultFee`/`defaultDurationMinutes` as a fallback).
3. Else → blank, teacher enters manually (today's behaviour, unchanged).

All pre-fills remain editable — this is a convenience, never a lock. A small caption states which
source pre-filled the number ("From ABC School's rate" / "From your Flute 1:1 menu price") so it's
never a silent, unexplained number.

---

## Part C — Venue fee, shown not baked in

Already modelled (`VenueFeeArrangement`, read at lesson-delivery time by
`postVenueFeeIfItemised`). The calculator adds a **read-only line** beneath the preview when the
student's location has a `VenueFeeArrangement`:

> Venue fee: −£X/lesson · {ABSORBED_INTO_FEE: "your own cost, already yours to cover" |
> ITEMISED_TO_PAYER: "itemised separately to the payer"}

Purely informational — does not alter `annualTotal`/`monthlyAmount`. This matches the existing
ledger behaviour exactly (the fee is posted as its own `VENUE_FEE_ITEMISED` line at lesson-delivery
time, never merged into the lesson charge), so the calculator preview and the eventual ledger entries
agree.

---

## Part D — PAYE hours-tracking (the significant new piece)

### Trigger
When a student's `locationId` resolves to a `TeacherLocationLink` with `taxHandling ==
PAYE_VIA_SCHOOL`:
- The student detail page's "Subscriptions" section is **replaced** with a notice + link to the
  location's hours view — no "Create subscription" form is shown for that student at all (per the
  user's "default state for that particular school" framing). If the student already has an
  existing Subscription (e.g. created before the location was marked PAYE, or a legitimate mixed
  case), it still displays read-only — this design doesn't retroactively hide history.

### New read model, not a new ledger
No new `LedgerEntry`/`Subscription` rows. Hours are **derived directly from `Lesson`** rows already
being created via the normal timetable/attendance flow — this is exactly why the user's framing
("the calendar will be very helpful") is right: the data already exists, it just isn't aggregated.

```ts
// src/lib/paye-hours.ts (pure, unit-tested)
export type PayeHoursSummary = {
  totalMinutes: number;
  totalHours: number; // totalMinutes / 60, for display
  lessonCount: number;
  expectedPay: number | null; // null if the location has no payRateAmount set
};

export function summarisePayeHours(
  lessons: { durationMins: number; status: "HELD" | "CANCELLED" /* ... */ }[],
  payRate: { amount: number; unit: RateUnit } | null
): PayeHoursSummary { /* sums durationMins for delivered/held lessons only, derives pay via
                          derivePerLessonPrice-style math per lesson duration */ }
```

### UI — `/dashboard/teaching-locations/[id]` (PAYE section)
For a `PAYE_VIA_SCHOOL` link, add a "Hours & pay" panel on the location detail page:
- A date-range picker (default: current month) — reuses the existing pattern from
  `/dashboard/tax-pack`/`accounting-export`'s range params.
- Table: lessons in range at this location (student, date, duration).
- Summary: total hours, total lessons, and — if `payRateAmount` is set — **expected pay** (clearly
  labelled "estimate, not a payslip").
- A CSV export button (same `formatLedgerEntriesAsCsv`-style pure-function pattern as
  `accounting-export`) so the teacher has something to keep for their own records — explicitly not
  framed as a document sent to the school, matching the user's "no invoice needed" answer.

### What does NOT change
- `deriveLessonValue`/`postLessonDelivered`/the ledger are completely untouched for
  `SELF_EMPLOYED` locations — Part D only activates for `PAYE_VIA_SCHOOL` links.
- Existing PAYE-flagged data (none currently, since the field was never read) is unaffected;
  turning this on doesn't rewrite any history.

---

## Testing

- `derivePerLessonPrice` — unit tests covering hour/half-hour/lesson units, rounding to the penny.
- `summarisePayeHours` — unit tests: sums only counted lessons, handles empty range, computes
  expected pay correctly per rate unit, returns `null` pay when no rate is set.
- Pre-fill resolution (§B) — unit test the three-tier fallback (location rate → LessonType location
  pricing → blank) as a pure function separate from the page component.
- Extend `billing-journey-runner.js` (or add a second scenario) is **not** required for this
  change — Item 8's existing journey already covers the SELF_EMPLOYED path end-to-end; a PAYE smoke
  pass can be added later once this ships, not blocking.
- `npm test` stays green throughout.

## Rollout / risk

- All new schema is additive and nullable (`payRateAmount`/`payRateUnit` on the link, `RateUnit`
  enum) — safe hand-written migration, no backfill needed.
- The PAYE branch only activates for links explicitly set to `PAYE_VIA_SCHOOL` — every existing
  teacher's data (all currently `SELF_EMPLOYED` by default, since the field was dormant) is
  completely unaffected until a teacher deliberately marks a location PAYE.
- Hiding the parent Subscription UI entirely for PAYE students was flagged as a judgement call and
  confirmed with the user: a private arrangement alongside a PAYE school relationship is unlikely
  enough that full replacement (not de-emphasis) is the right default. If an edge case surfaces later
  where a PAYE-school student genuinely needs a parent-billed subscription too, revisit then rather
  than building for it speculatively now.
