# Roadmap v2 — Build Progress

Tracks implementation of **`learnio-roadmap-v2.md`** ("Learnio — Roadmap (v1 status + v2 build
spec)"), supplied 2026-07-12 as a follow-up to the completed onboarding/timetabling spec (see
[docs/onboarding-timetabling-progress.md](onboarding-timetabling-progress.md)). Parts 1–3 of that
roadmap doc (location generalization, lesson catalog, term calendars) and the questionnaire half
of Part 4 (self-serve onboarding) were already built in the prior spec pass — this doc picks up
from there.

A revised version of the doc (`learnio-roadmap-v2(1).md`) arrived later the same day, adding two
new parts on top of the original 7: **Part 8** (invoice PDFs + accounting export — the CSV export
half was already done as the original Part 7) and **Part 9** (freelancer-specific pain points: tax
pack, mileage, batch-cancel, lone-worker safety, waitlist, referral tracking, progress summaries,
route feasibility). Both revisions are tracked in the single table below.

Built in the roadmap doc's own recommended order, one part per commit, each verified with
`tsc --noEmit`, `eslint`, `next build`, and `jest` before committing.

---

## Status at a glance

| Part | What | Status | Commit |
|---|---|---|---|
| 1 | `TeachingLocation` generalization | ✅ pre-existing (prior spec) | `6c166e3` |
| 2 | `LessonType` catalog | ✅ pre-existing (prior spec) | `96751b1` |
| 1b/1c | Online lessons (`meetingUrl`, `.ics`) + safeguarding policy | ✅ **done** | `147a780` |
| 3 | `TermCalendar` templates | ✅ pre-existing (prior spec) | `d9d4d03` |
| 4 (questionnaire) | Self-serve onboarding | ✅ pre-existing (prior spec) | `75ad249` |
| 4 (widget) | Embeddable onboarding widget (`EmbedConfig`) | ✅ **done** | `25b3662` |
| 5 | Curriculum templates | ✅ **done** | `c75728e` |
| 5a | Sellable course content (`Course`/`CourseItem`/`CoursePurchase`) | ✅ **done** | `3cf7fc2` |
| 6a | Session plans + public Now/Next display | ✅ **done** | `010e9b9` |
| 6b | Group class capacity + waitlist | ✅ **done** | `63bf421` |
| 6c | Compliance & safety (certifications, medical notes, incidents) | ✅ **done** | `37d02d3` |
| 6d | Configurable cancellation policy | ✅ **done** | `4ebf4bd` |
| 6e | Multi-instructor support (`Organisation`) | ✅ **done** | `c8e93db` |
| 6f | Lesson feedback | ✅ **done** | `b8dd8d6` |
| 7 | Gift cards, promo codes, accounting export (CSV) | ✅ **done** | `d53bccd` |
| 8a | Invoice PDF generation | ✅ **done** | `7f91ca5` |
| 8b | Accounting export | ✅ **done** (= Part 7's CSV export) | `d53bccd` |
| 9a | Tax pack + mileage tracking | ✅ **done** | `ee4669c` |
| 9b | Batch-cancel + notify, lone-worker check-in | ✅ **done** | `e3e672e` |
| 9c | Waitlist, referral tracking, progress summaries | ✅ **done** | `59de3d7` |
| 9d | Multi-location route feasibility | ✅ **done** | `832ab79` |

**The entire roadmap doc (both revisions) is now built.** Part 6e was the last item from the
original 7-part doc, held back until the user
confirmed the design decision it explicitly called for (see below) — every other part had a clear,
safe design and was built without needing that kind of check-in first.

Every completed stage passes `tsc --noEmit`, `eslint src`, `jest` (106 tests across 15 suites as of
the last commit), and a full `next build`. All migrations are applied to the live Supabase DB.

---

## What's been built

### Curriculum templates (Part 5, `c75728e`)
Teacher-owned reusable syllabi (`CurriculumTemplate`/`CurriculumSection`), imported onto a student
as an independent snapshot (`StudentCurriculum`/`StudentCurriculumSection`) — editing the master
template later never changes a student already partway through. Supports building a plan from
scratch on a student, saving it back as a template, and duplicating one student's plan onto
another. `/dashboard/curriculum-templates`.

### Session plans + Now/Next display (Part 6a, `010e9b9`)
`SessionPlan` — what's happening in a specific session, distinct from the private `LessonNote`.
1:1 on `Lesson`, 1:many on `GroupClass` (no dated per-occurrence row exists there, so the most
recent plan is "current"). `SessionPlanTemplate` for save/start-from-template. Published plans
surface on a new public, no-login `/display/[token]` Now/Next screen for a venue TV/tablet, gated
by an unguessable `TeachingLocation.displayToken`.

### Group class capacity + waitlist (Part 6b, `63bf421`)
`GroupClass.capacity` (null = unlimited) governs per-date overflow via `GroupSessionBooking`,
distinct from `GroupClassMember`'s standing membership. Waitlist promotion-on-cancel is a pure,
unit-tested function pair (`src/lib/group-booking.ts`). Checked `CheckIn` first per the roadmap
doc's own instruction — it already covers attendance adequately, so no parallel status model was
built. Booking UI is teacher-facing only; genuine self-service (parent/student microsite) scoped
out.

### Compliance & safety (Part 6c, `37d02d3`)
`InstructorCertification` (renewal-date tracking, useful even pre-multi-instructor),
`StudentMedicalNote` (teacher-only, never reachable from any `/parent` view — same treatment as
`TeachingLocation.accessNotes`), `IncidentLog` (safeguarding/liability record, distinct from
`LessonNote`).

### Configurable cancellation policy (Part 6d, `4ebf4bd`)
`CancellationPolicy` (teacher-wide default or per-location override) decides what happens when a
lesson is marked absent, based on actual notice given — sufficient notice is always free; a late
cancellation applies `lateCancelAction`; a same-time/after no-show applies `noShowAction`. Each
maps to `FULL_CHARGE`/`PARTIAL_CHARGE`/`CREDIT`/`FORFEIT`. **No policy configured preserves the
exact original always-free behavior**, unchanged, for every existing teacher — a deliberate
compatibility constraint. Resolution logic is pure and unit-tested
(`src/lib/cancellation-policy.ts`).

### Lesson feedback (Part 6f, `b8dd8d6`)
`LessonFeedback` (rating + optional comment, one per lesson+payer), submitted from the existing
microsite lesson-notes page. Guardian-only — a 16+ student's independent login has no `Payer` row
to attribute feedback to. Teacher sees per-lesson feedback plus a lightweight average-rating
aggregate on the Student detail header.

### Commerce add-ons (Part 7, `d53bccd`)
`GiftCard` redemption reuses `postPayment` (a card is just an alternate funding source for an
ordinary payment). `PromoCode` posts through `postManualCorrection`, tagged `promo:<code>` —
validity checking and discount computation are pure, unit-tested functions
(`src/lib/promo-code.ts`). `AccountingExport` is **on-demand only**
(`GET /api/accounting-export?from=&to=`), no scheduled/emailed version — no cron/email
infrastructure in this app to build that reliably.

### Embeddable onboarding widget (Part 4 tail, `25b3662`)
`EmbedConfig` generates a named, shareable configuration of the existing self-serve onboarding
flow — pre-scoped to a location and/or lesson-type allowlist, lightly re-branded.
`/onboard/embed/[token]` reuses the exact same `OnboardingForm`/`submitSelfServeOnboardingAction`
as `/onboard/[teacherId]`, so there's only ever one onboarding pipeline. One config produces both
a plain shareable link and a copy-paste `<iframe>` snippet.

### Online lessons (Part 1b/1c, `147a780`)
`Lesson.meetingUrl` is a teacher-supplied link (MVP skips Zoom/Meet API integration — no OAuth/API
setup overhead until there's real usage to justify it). `LocationType` gained `ONLINE`.
`GET /api/lessons/[id]/ics` serves a one-off, one-way `.ics` export (pure/unit-tested generation in
`src/lib/ics.ts`), available to either the owning teacher or a guardian/student with microsite
access. Safeguarding guidance (waiting room, host-present, recording retention) is a policy
callout on the Lesson detail page for `ONLINE`-location lessons — explicitly not enforced, since
the platform doesn't control a teacher's own meeting link.

### Sellable course content (Part 5a, `3cf7fc2`)
`Course`/`CourseItem`/`CoursePurchase` — **deliberately deviates from the roadmap doc's own
suggestion** of posting `CoursePurchase` to the ledger. `LedgerEntry.subscriptionId` is required
non-null, but a payer buying a standalone course may have no `Subscription` to attach it to.
Follows the established `AddOn`/`AddOnBooking` precedent instead (see "Add-on Decisions" in
`CLAUDE.md`): `amountPaid` is a price snapshot, collection is a manual out-of-band teacher action
(`recordCoursePurchaseAction`), not automated. `CourseItem.courseId` is nullable — `null` means
free-standing library content, optionally linked to a `LessonType` (the `CurriculumSection` half
of the original "free vs paid" framing wasn't built). Microsite "Courses" tab is guardian-only,
same reasoning as `LessonFeedback`.

### Multi-instructor support (Part 6e, `c8e93db`)
The one part the roadmap doc itself flagged as needing "its own design pass" — the user was asked
directly (AskUserQuestion) and confirmed: `Organisation` as a new tenancy layer above `Teacher`
(not a `role`/`reportsToId` field bolted onto `Teacher` directly). `Teacher.organisationId` is
nullable, unset by default — every existing teacher is unaffected.

**Deliberately conservative scope**: grouping `Teacher` accounts under an `Organisation` does
**not** change the existing per-`Teacher` tenancy boundary on `Student`/`Payer`/`Subscription`/etc.
— those stay scoped to a single `teacherId` everywhere, unchanged. A full shared-roster model (any
instructor in the org sees all org students) would touch dozens of `teacherId`-scoped queries
across the codebase and was judged out of scope for this pass. What's actually built: account
grouping/membership, and `CoverAssignment` (a record of one instructor covering another's lesson,
no ownership transfer of the underlying `Lesson`/`Student`/`Subscription`).

Consent-based join via a shareable invite link (`OrganisationInvite.token`), same pattern as the
embed/onboarding links — an OWNER can't unilaterally attach another account; the invitee accepts
it themselves while authenticated as their own `Teacher`. `/dashboard/organisation`.

### Invoice PDF generation (Part 8a, `7f91ca5`)
`GET /api/subscriptions/[id]/invoice` renders a formatted document directly from `LedgerEntry`
data (optional `?from=&to=`) — no new billing entity, a document layer only. Available to either
the owning teacher (Subscription detail page) or the subscription's own payer on the microsite
ledger page. `src/lib/invoice-pdf.ts` uses `pdf-lib` like the existing `contract-pdf.ts` but
deliberately doesn't share code with it (different-enough layouts: tabular vs. flowing text).

### Tax pack + mileage tracking (Part 9a, `ee4669c`)
`MileageLog` is manually logged (no geocoding/distance-matrix API exists in this app — same honest
manual-entry pattern as `TermCalendar`). `calculateMileageAllowance` (pure, unit-tested,
`src/lib/mileage.ts`) applies HMRC's cumulative tiered rate correctly across a trip that straddles
the 10,000-mile threshold. `taxYearRange`/`taxYearForDate` (6 April–5 April) is shared by both the
`/dashboard/tax-pack` report view and its `GET /api/tax-pack` CSV export. The tax pack itself rolls
up data that already exists (`LedgerEntry` `PAYMENT`s, `Expense`, `MileageLog`) — a reporting view,
not new income/expense capture.

### Batch-cancel + lone-worker safety (Part 9b, `e3e672e`)
Batch-cancel-today is a thin link into the *existing* `Unavailability` preview/confirm flow with
`start`/`end`/`reason` pre-filled — no new cancellation logic was written. `LoneWorkerCheckIn` is
scoped to `STUDENT_HOME` lessons only; the overdue-checkout alert is a lazy sweep triggered from
`GET /api/today` (`checkAndSendLoneWorkerAlerts`) rather than a real scheduled job — no cron infra
exists in this app, so this is an honest best-effort heuristic, not a guaranteed real-time alert.
`Teacher.emergencyContact*` (Billing settings) is a separate contact from anything guardian-facing.

### Waitlist, referrals, progress summaries (Part 9c, `59de3d7`)
`TimetableWaitlist` is a manual pipeline (WAITING/CONTACTED/CONVERTED/CANCELLED) against an
optional `LessonType`/`TeachingLocation` — no automatic slot-matching, that's real scheduling-engine
work left for later. `Student.referredBy` is deliberately free text, not FK'd to `Payer` (the
referrer is often not a billing party at all). The termly progress summary
(`/dashboard/students/[id]/progress-summary`) is generated fresh on every page load from
`StudentCurriculumSection` completions, `Assessment`s, and `LessonNote`s already in range — nothing
new is persisted; "Send to guardian(s)" reuses the existing Gmail-send infra.

### Multi-location route feasibility (Part 9d, `832ab79`)
`LocationTravelTime` is manually entered (directional minutes between two locations) — same
no-live-API honesty as `MileageLog`. `checkDayFeasibility` (pure, unit-tested,
`src/lib/route-check.ts`) flags a scheduled gap shorter than the known travel time between two
consecutive same-day bookings — distinct from the existing `splitConflicts` double-booking check,
a genuinely different failure mode. A location pair with no travel time entered simply isn't
checked, never guessed at.

---

## Conventions used throughout (match these when resuming)

- Server components by default; `'use client'` + `useActionState` for forms; ownership re-checked
  server-side via `session.user.id` (or a location/teacher join for shared data).
- New entities are additive; snapshot-not-live-reference for anything imported/copied
  (`ContractAcceptance.contractSnapshot`, `StudentCurriculum`, `SessionPlanTemplate` →
  `SessionPlan`, `CurriculumTemplate` → `StudentCurriculum`).
- Non-trivial decision logic (waitlist promotion, cancellation-policy resolution, promo-code
  validity, CSV row formatting) is a pure function in `src/lib/`, unit-tested, kept separate from
  the Prisma-touching server action — same pattern established by `bulk-timetable.ts` in the prior
  spec pass.
- Small scoped commits, each ending in `tsc --noEmit` + `eslint` + `jest` + `next build`
  verification, message tagged `(roadmap v2 Part N)`.
- Migrations generated via `prisma migrate diff --from-config-datasource ... --to-schema ...
  --script` and applied with `prisma migrate deploy` rather than `migrate dev`, since this
  environment is non-interactive and `migrate dev` prompts for confirmation on anything it flags
  as a warning (e.g. adding a unique constraint) — `migrate deploy` against a hand-reviewed SQL
  file sidesteps that without skipping the review step.
