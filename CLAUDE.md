# Learnio — Peripatetic Teacher App

This file is the source of truth for any AI assistant working on this codebase. Read this before making decisions.

> **Full build spec:** [docs/spec.md](docs/spec.md) — read it before writing any code. It defines every entity, business rule, and the required build order.

---

## What This Product Is

A standalone platform for self-employed peripatetic instructors (music teachers, yoga instructors, personal trainers) working across multiple locations — home visits, private students, and contracted work across several schools/venues that change term to term.

Core jobs to be done: track schools/students/payers, generate timetables (fixed/fluid), run subscription billing with a running-balance ledger, handle group classes/room bookings/gradings/equipment loans, take Stripe payments, generate contracts, forecast teacher income.

**Deferred to v2+:** full IG Card account linking, WhatsApp messaging, multi-currency, multi-teacher commission splitting, Google Calendar/Drive sync. **Explicitly excluded, do not revisit:** Google Classroom (see spec section 4 for why).

**In scope for v1:** card-based sign-in/out for attendance (`CheckIn` model) — reuses IG Card wallet-pass infra, not full account linking. Built: [src/lib/checkin.ts](src/lib/checkin.ts) + [src/app/dashboard/checkin/](src/app/dashboard/checkin/) (scan by `Student.igCardId`, set via the student detail page's "Check-in" section). Signing in to a lesson auto-fires `LESSON_DELIVERED` and replaces manual attendance marking; group-class check-ins are attendance-only (no dated instance to bill).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database | PostgreSQL via Supabase, Prisma ORM 7.x (driver adapter: `@prisma/adapter-pg`) |
| Auth | NextAuth v5 (Credentials provider, JWT session — no OAuth adapter tables) |
| Payments | Stripe (platform billing + Connect Express, see below) |
| Email | Teacher's own Gmail, via a separate OAuth grant ([src/lib/gmail.ts](src/lib/gmail.ts)) — see below. `Resend` is listed in `package.json`/`.env.example` but has no wrapper or call site anywhere; not actually wired up. |
| Styling | Tailwind CSS |
| Calendar UI | FullCalendar (`@fullcalendar/react`) — MIT, see docs/spec.md section 3a |
| Timetable solver | Google OR-Tools CP-SAT, separate Python service at [timetable-service/](timetable-service/) — now optionally wired in, see "Timetable Service Decisions" below |
| Hosting | TBD (not yet deployed — local dev only) |
| Offline (view-only) | `@serwist/next` service worker ([src/app/sw.ts](src/app/sw.ts)), scoped to just `/dashboard/today` — see below |

**Multi-tenant, not single-teacher:** originally scoped as one solo teacher's private tool, but
Stripe requiring per-teacher payment collection (parents pay the teacher directly, not Learnio)
made this a real multi-tenant SaaS product instead — any teacher can register (`/register`) and
gets isolated data. `Student.teacherId` and `Payer.teacherId` are the tenancy boundary;
`TeachingLocation` is shared reference data, scoped per-teacher via `TeacherLocationLink`. Every
list/detail query and server action must filter by `session.user.id` — see the retrofit commit for
the full pattern.

**`School` was renamed to `TeachingLocation` (spec Part 4.3)** — and `TeacherSchoolLink` →
`TeacherLocationLink`, `schoolId` → `locationId` everywhere, route `/dashboard/schools` →
`/dashboard/teaching-locations`. It generalizes beyond schools (home visits, hired halls, the
teacher's own base) via a `locationType` enum. Anywhere this file still says "School"/"school" in
prose, read "TeachingLocation"/"location" unless it's the `InvoicingTarget.SCHOOL` enum value (which
kept its name). See "Onboarding & Timetabling additions" below and
[docs/onboarding-timetabling-progress.md](docs/onboarding-timetabling-progress.md).

**Next.js 15 / React 19, not 14/18:** started on Next 14 + React 18 (matching YourBarber), but
`useActionState` (used in every form) is a React 19 API — Next 14.2's internally vendored React
runtime doesn't have it even if you bump the `react` package yourself, so the mismatch only
surfaces at build/static-generation time, not typecheck time. Upgraded both together rather than
downgrading the forms to the old `useFormState` API.

**`src/auth.config.ts` vs `src/auth.ts`:** middleware runs on the Edge runtime, which can't load
`bcryptjs` (Node-only). `auth.config.ts` holds the edge-safe callbacks/pages config with no
providers, used directly by `middleware.ts`; `auth.ts` adds the Credentials provider (which needs
bcrypt) on top, used by API routes and server actions. Don't merge these back into one file.

Prisma 7 note: connection config lives in `prisma.config.ts`, not in `schema.prisma`'s `datasource` block. Runtime `PrismaClient` requires a driver adapter — see [src/lib/db.ts](src/lib/db.ts).

---

## Build Order (from spec section 6 — follow in sequence)

1. [x] Prisma schema for all entities — [prisma/schema.prisma](prisma/schema.prisma)
2. [x] Teacher/School/Student/Subscription CRUD + auth
3. [x] Ledger engine (sanity-check hardest — running balance + cancellation payout + make-up credits) — [src/lib/ledger.ts](src/lib/ledger.ts), unit-tested in [__tests__/ledger.test.ts](__tests__/ledger.test.ts)
4. [x] Timetable generator (fixed/fluid, protected blocks) — [src/lib/scheduling.ts](src/lib/scheduling.ts) (pure, unit-tested) + [src/lib/timetable.ts](src/lib/timetable.ts) (Prisma/room-aware conflict detection). Ghost-overlay calendar (past lesson slots ghosted onto the current week) built on the timetable preview page; a general teacher dashboard calendar also exists ([src/app/dashboard/teacher-calendar.tsx](src/app/dashboard/teacher-calendar.tsx)).
5. [x] Stripe integration + webhook → LedgerEntry — split into three pieces once "teachers pay Learnio" and "parents pay teachers" turned out to need different Stripe products: platform billing ([src/lib/billing.ts](src/lib/billing.ts)), Connect Express onboarding ([src/lib/connect.ts](src/lib/connect.ts)), and parent payment links ([src/lib/payments.ts](src/lib/payments.ts)), all landing in one webhook ([src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts)). No parent microsite/login yet, so payment links are teacher-generated and shared manually — see below.
6. [x] Contract generation — **in-app clickwrap acceptance, not PDF/e-signature** (spec updated; see docs/spec.md and "Contract Acceptance Decisions" below). PDF is now only an optional post-acceptance download.
7. [x] Parent/student microsite — 6-digit code login (guardian and 16+ student, same namespace), student-picker (`/parent`) for guardians with multiple students, and per-student pages under `/parent/students/[studentId]/`: overview, FullCalendar-based calendar, ledger (gated by `shareBalanceWithStudent` for student viewers), resources, assignments, maintenance reminders (for items on active loan), lesson notes. Access control centralized in `src/lib/microsite-access.ts`.
8. [x] Room booking, GroupClass, Assessment, LoanableItem/Loan modules — full CRUD, mostly nested under School/Student detail pages; Loans has its own top-level nav entry. Add-on (spec section 2) was schema-only until later — see "Add-on Decisions" below.
9. [x] Teacher income forecasting dashboard + expense tracking — [src/app/dashboard/forecast/](src/app/dashboard/forecast/), new `Expense` model, hand-built SVG chart (no new chart dependency).

**Beyond the original v1 spec, also built:** School/Teacher branding on calendars; Setup vs Operations nav split; a private-tuition-request flow (with a non-solicitation legal-caution gate) letting a school-sourced student request going private; no-show tracking + make-up-lesson workflow + next-period billing credit ([src/app/dashboard/absences/](src/app/dashboard/absences/)); a real sidebar/dropdown-menu UI redesign; and bidirectional Payer↔Student↔School cross-referencing + a guided new-student wizard + global cross-entity search (see "Conventions" below for the wizard's validation rules).

---

## Core Business Rules (see spec section 3 for full detail)

- **Income smoothing:** `Subscription.annualFee ÷ 12`, billed monthly regardless of term breaks.
- **Running balance:** `Σ(CREDIT ledger entries) − Σ(DEBIT ledger entries)` per Subscription. Must be computed and shown to the parent *before* they confirm a cancellation.
- **Invoicing target** is inherited from the Lesson's School (`invoicingTarget`), never set per-lesson.
- **Tax handling** is per `TeacherSchoolLink`, not global on Teacher.
- **Unavailability workflow is core, not optional:** creating one scans affected Lessons/GroupClasses, shows an itemised list, and on confirm auto-cancels + emails every affected guardian + posts ledger credits. Do not build a version that relies on the teacher remembering to notify people.
- **Make-up credits:** attendance marking must support both "Present (posts LESSON_DELIVERED)" and "Absent, make-up owed (posts MAKE_UP_CREDIT_ISSUED, no cash impact)".

---

## Ledger Engine Decisions (worth knowing before touching [src/lib/ledger.ts](src/lib/ledger.ts))

- **Cash balance excludes make-up credits.** `MAKE_UP_CREDIT_ISSUED`/`MAKE_UP_CREDIT_REDEEMED` entries live in the same `LedgerEntry` table but are filtered out of `calculateCashBalance` — per spec they must never touch the cash figure. They're counted separately via `calculateMakeUpCreditsOwed` (issued − redeemed = lessons currently owed).
- **Cancellation does not auto-post a balancing ledger entry.** `previewCancellationPayout` computes what's owed to whom (for the pre-confirmation display the spec requires) but `cancelSubscription` only flips `status` to `CANCELLED`. The actual refund (via Stripe) or invoice for the amount owed is a real-world action posted as its own ledger entry when it happens — this avoids inventing money-movement automation the spec didn't ask for.
- **Resolved: `deriveLessonValue(subscriptionId, { durationMins, schoolId })`** (`src/lib/ledger.ts`) computes `lessonValue` per `billingModel` rather than requiring the caller to guess it — `postLessonDelivered` itself still just takes a plain number, so every call site (manual "Mark present": `src/app/dashboard/lessons/[id]/actions.ts`; CheckIn sign-in: `src/lib/checkin.ts`) calls `deriveLessonValue` first. `PER_LESSON`/`HOURLY` are direct from `annualFee`; `TERMLY`/`SMOOTHED_SUBSCRIPTION` divide `annualFee` by a `countHeldLessonsInRange` count (term dates or a rolling year), falling back to the raw rate if that count is ever zero (e.g. no lessons scheduled yet) rather than dividing by zero.

## Scheduling Decisions (worth knowing before touching [src/lib/scheduling.ts](src/lib/scheduling.ts) / [src/lib/timetable.ts](src/lib/timetable.ts))

- **TeacherSchoolLink CRUD lives under a school's detail page** ([src/app/dashboard/schools/[id]/page.tsx](src/app/dashboard/schools/[id]/page.tsx)), added alongside the generator since it's the generator's direct input (availability + protected blocks). It wasn't in the original CRUD pass because the spec's build order didn't call it out separately.
- **School now has termStart/termEnd fields on the create form** — required for the generator to know how many weeks to schedule. An edit form now exists too ([src/app/dashboard/schools/[id]/edit/](src/app/dashboard/schools/[id]/edit/)), gated on the teacher having a `TeacherSchoolLink` to that school (`School` has no `teacherId` of its own — it's shared reference data, see the "Multi-tenant" note above) rather than being blocked behind a direct DB edit.
- **FLUID mode algorithm:** round-robins one lesson per term-week through the teacher's chosen candidate slots (`slot[weekIndex % N]`). This guarantees each slot is used `floor(weeks/N)` or `ceil(weeks/N)` times — off by at most one lesson — which is how "equal total teaching time" is satisfied. It's a defensible interpretation of a deliberately loose spec requirement, not the only possible one; revisit if it doesn't match what a real term looks like in practice.
- **Conflict detection compares exact `scheduledAt` timestamps** for the same teacher, not overlapping time ranges — fine while lesson durations are short and slots are hand-picked from already-protected-block-filtered availability, but revisit if two different-length lessons could overlap without sharing a start time.
- The ghost-overlay calendar visual and Room-aware conflict checking are both now built (see build step 4 above) — this line previously said otherwise; it was stale.

## Stripe Decisions

- **No platform fee on parent payments** — destination charges (`payment_intent_data.transfer_data.destination`) send the full amount to the teacher's connected account minus Stripe's own processing fees. Revisit `src/lib/payments.ts` if a take-rate gets added later (`application_fee_amount` on the same call).
- **Payment links are teacher-generated, not emailed automatically.** There's no parent login yet (that's build step 7, the microsite), so a teacher clicks "Create payment link" on a Subscription and copies/sends the URL themselves. `/pay/[subscriptionId]` is a public, unauthenticated, deliberately generic confirmation page — it must never render any ledger/balance data since it has no auth check.
- **Stripe client is a lazy Proxy** ([src/lib/stripe.ts](src/lib/stripe.ts)) — the SDK throws in its constructor on an empty API key, which broke `next build` before real keys existed. Don't change this back to a plain `new Stripe(...)` export.
- **One webhook endpoint for three concerns**: platform billing events, Connect `account.updated`, and parent-payment `checkout.session.completed` all land in [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts), dispatched by `session.mode` / event type. Payment webhook handling is idempotent via `stripePaymentId` uniqueness (checked before creating a `Payment` row) since Stripe retries webhooks.
- **Still needs real Stripe test keys to actually verify end-to-end** — everything here is typechecked/built but never hit a live Stripe account.

## Gmail Connection Decisions

- **Not a NextAuth login provider.** Teacher login stays Credentials-only (deliberate — see Auth row above). Connecting Gmail is a separate OAuth grant stored on the already-authenticated `Teacher` record, architecturally mirroring Stripe Connect (`src/lib/connect.ts`): connect → external consent → callback stores a credential → later actions gate on a "connected" flag (`payments.ts`'s `stripeConnectOnboarded` check ↔ `gmail.ts`'s `GmailNotConnectedError`).
- **`gmailRefreshTokenEncrypted` is encrypted at rest** ([src/lib/encryption.ts](src/lib/encryption.ts), AES-256-GCM, keyed by `ENCRYPTION_KEY`) — unlike the Stripe fields on `Teacher`, which are non-secret account IDs (the real Stripe key lives only in `.env`), a Gmail refresh token is directly usable on its own. Don't store it plain.
- **Plain `fetch` against Google's REST endpoints, no `googleapis` dependency** — consistent with this project's dependency-light style. `src/lib/gmail.ts` hand-builds the OAuth URL, token exchange/refresh, and a base64url MIME message for `gmail.send`.
- **Access tokens are never cached** — `getValidAccessToken` always exchanges the stored refresh token for a fresh access token at send-time rather than tracking expiry. Simpler, and Gmail sends aren't frequent enough for the extra round-trip to matter.
- **`gmail.send` is a sensitive OAuth scope.** In Google's default "Testing" publishing status, only up to 100 test-user emails (added under Audience in Google Cloud Console) can connect — fine for development/a single teacher, but production use by arbitrary teachers needs Google's app-verification review first.
- **First real usage is the Payer card's "Send an email"** ([src/app/dashboard/payers/[id]/send-email-form.tsx](src/app/dashboard/payers/[id]/send-email-form.tsx)) — deliberately generic (subject + body), not tied to any specific trigger. There is otherwise **no email infrastructure in this app at all** — Resend was never wired up. The **Unavailability workflow is now built** ([src/lib/unavailability.ts](src/lib/unavailability.ts) + `src/app/dashboard/unavailability/` new→preview→confirm flow) and correctly routes its guardian-cancellation emails through `sendEmailAsTeacher` (best-effort, post-transaction) — the second send path was avoided as intended.
- **Still needs a real Google OAuth Client ID/Secret to verify end-to-end** — same category as Stripe/Resend: typechecked/built, never hit a live Google account.

## Contract Acceptance Decisions

- **Contract is per-teacher, not per-subscription.** Originally modeled as `Contract.subscriptionId`; redesigned to `Contract.teacherId` + incrementing `version` because gating is phrased as "the payer has accepted the *current* contract version" — a single evolving document per teacher, not a copy per subscription. No DB migration existed yet when this changed, so the schema was edited directly rather than migrated.
- **`ContractAcceptance.contractSnapshot` is a real independent copy of the text**, not just a foreign key to `Contract.content` — deliberate, so a later edit to the live contract can never retroactively change what a past acceptance recorded. Don't "simplify" this into a join later.
- **`contractVersion` is denormalized onto the acceptance row** specifically so `hasAcceptedCurrentContract` (`src/lib/contracts.ts`) is a direct equality check against the payer's own acceptance, not a join-and-compare.
- **Re-acceptance on a new version is not a separate flagged/reminder flow** — it falls out naturally: `getCurrentContract` always returns the highest version, and `hasAcceptedCurrentContract` checks the acceptance table for that specific version. A stale acceptance (matching an old version) simply doesn't match, so gating blocks by itself.
- **Gating covers lesson booking (timetable confirm) and parent Checkout links, not manual "record a payment."** The teacher's own bookkeeping correction isn't blocked, but the subscription page always shows acceptance status so they're not blind to it. Checked both client-visibly (preview page disables the submit button) and server-side (confirm actions re-check — defense in depth against a replayed/modified request).
- **If a teacher hasn't set up a contract at all, nothing is gated** (`getCurrentContract` returns null → `hasAcceptedCurrentContract` returns `true`). Don't change this without considering existing teachers who haven't configured one yet.
- **Parent auth (`src/lib/parent-session.ts`) is a separate, lightweight signed-cookie session** — not NextAuth, not shared with the Teacher login. Reuses `AUTH_SECRET` to sign rather than adding a second secret. This was originally only the login piece ahead of the full microsite (build step 7) — that step is now done (see build order above), including the calendar/ledger views.
- **PDF download (`src/lib/contract-pdf.ts`, `pdf-lib`) is unsigned and optional**, generated only after a `ContractAcceptance` exists, rendering that row's `contractSnapshot` — it has zero bearing on whether the acceptance is legally valid.

## Add-on Decisions

- **`AddOn` needed a `teacherId` added via migration** ([prisma/migrations/20260712044719_addon_teacher_scope](prisma/migrations/20260712044719_addon_teacher_scope)) — the original schema had no tenancy field on it at all, which would have leaked add-ons across teachers. Also added `archivedAt` (soft-delete, since `AddOnBooking` rows reference an `AddOn` and must survive it being retired from the picker).
- **Deliberately does not post to the ledger.** The spec frames Add-on explicitly as a way to attach extras "without cluttering the core Subscription/billing model" — `AddOnBooking.priceAtTime` snapshots the price at booking time (same pattern as `ContractAcceptance.contractSnapshot`: a later price edit must never retroactively change an already-booked charge), but collecting payment for it is a manual, out-of-band teacher action, same as `Loan`/`MaintenanceReminder` don't touch the ledger either.
- **Only attachable from the Lesson detail page, not GroupClass**, even though the schema supports both (`AddOnBooking.groupClassId`). `GroupClass` has no dedicated detail page — it's managed inline on the School detail page — so wiring booking UI there would mean building a whole new route for a spec feature ("visibility: PUBLIC | PRIVATE") that has no consumer yet anyway. Revisit if/when GroupClass gets its own detail page.
- **`visibility` (PUBLIC/PRIVATE) is now read** — a new microsite tab, [src/app/parent/students/[studentId]/extras/](src/app/parent/students/[studentId]/extras/) ("Extras"), lists a student's booked add-ons, filtered to `visibility: PUBLIC` only. This is the one and only place the field is read; `PRIVATE` add-ons (teacher-use-only extras) never reach a guardian/student view. Not gated behind `canSeeLedger` like the Ledger tab is — it's what was booked, not balance/payment data.

## Timetable Service Decisions

- **Now optionally wired in** ([src/lib/timetable-service-client.ts](src/lib/timetable-service-client.ts)) — `previewFluidTimetable` (`src/lib/timetable.ts`) tries the OR-Tools service first when `TIMETABLE_SERVICE_URL` is set, falling back to the existing round-robin (`generateFluidSchedule` in `scheduling.ts`) on any failure: unset URL, network error, timeout, non-2xx, or a non-OPTIMAL/FEASIBLE solver status. The service is purely additive — nothing breaks or behaves differently for a teacher who never deploys it.
- **Single-student calls, not the joint multi-student solve the service is designed for.** The existing FLUID-mode UX previews and confirms one student at a time (`/dashboard/timetable/preview`), so the client sends a `students` array of length 1. The service's real value — solving every student jointly so slot contention gets resolved optimally in one pass — isn't realized this way; a batch "generate for every unscheduled student at once" flow would be needed for that, which is a bigger UX change than this pass made. What this integration *does* deliver even for one student: the service's own fairness objective (even usage across candidate slots, anti-repeat penalty) via real CP-SAT optimization instead of the naive `slot[weekIndex % N]` modulo rotation.
- **Existing teacher/room double-booking conflict detection (`splitConflicts` in `timetable.ts`) still runs afterward regardless of which path produced the lessons** — the solver only knows about the one student's own hard constraints (no self-overlap, candidate-slot-only placement); it has no visibility into other students' already-created `Lesson` rows, so the post-hoc DB conflict check remains required either way.
- **Still not deployed anywhere** — the "Status: not yet wired into the main app" line in the service's own README no longer describes the code (fixed there too), but the "Deployment — needs a decision" section is still accurate: this only activates once `TIMETABLE_SERVICE_URL` points at a real running instance.

## Subject Decisions (beyond the original v1 spec)

- **`Subject` is new, teacher-defined, many-to-many with `Student`** ([prisma/migrations/20260712045620_add_subjects](prisma/migrations/20260712045620_add_subjects)) — a teacher builds their own list (Flute, Sax, Piano / Yoga, Gymnastics) under [src/app/dashboard/subjects/](src/app/dashboard/subjects/), then tags each student with as many as apply from the student detail page's "Subjects taught" section.
- **Additive to `Student.discipline`, not a replacement.** The original free-text `discipline` field is single-valued and used throughout the app (student wizard validation, `Today`/microsite display, private-tuition-request payload, GroupClass's own separate free-text `discipline`) — replacing it would have meant touching every one of those call sites for a feature that only asked for multi-subject tagging. `Subject` is a second, optional, multi-valued layer on top.
- **Grouping lives on the Students list** ([src/app/dashboard/students/page.tsx](src/app/dashboard/students/page.tsx)): default view groups all students by subject (a student with 2+ subjects appears in every group they belong to; untagged students get their own group), or a subject chip filters to just that one. This is where "group students — and by extension the lessons they need — by subject" is surfaced; there's no separate lesson-grouping view, since a lesson's subject is really its student's subject.
- **Now also wired into GroupClass** (`GroupClass.subjectId`, optional, `onDelete: SetNull`) — this line previously said GroupClass had no detail page to add a picker to, which was wrong; [src/app/dashboard/group-classes/[id]/page.tsx](src/app/dashboard/group-classes/[id]/page.tsx) already existed (reachable from a school's Group classes list, just not linked from the sidebar until now). `GroupClass.discipline` stays as its own free-text field for the same additive reasoning as `Student.discipline` above — a class's subject tag is optional and separate. Picked when creating the class ([src/app/dashboard/schools/[id]/new-group-class-form.tsx](src/app/dashboard/schools/[id]/new-group-class-form.tsx)) or later via [src/app/dashboard/group-classes/[id]/edit/](src/app/dashboard/group-classes/[id]/edit/). A new top-level [src/app/dashboard/group-classes/page.tsx](src/app/dashboard/group-classes/page.tsx) list (now in the sidebar) mirrors the Students page's grouped/filtered-by-subject view.

## Edit Forms (beyond the original v1 spec)

Create-only screens for several entities went unnoticed until asked for directly. Added, all
following the same pattern (a `use client` form + `useActionState`-bound update action, ownership
re-checked server-side, ends in `redirect` back to the detail/list page it edits):

- **School** ([src/app/dashboard/schools/[id]/edit/](src/app/dashboard/schools/[id]/edit/)) — gated
  on `TeacherSchoolLink`, not `teacherId` (School has none — shared reference data). Covers every
  field the create form does plus `logoUrl`/`secondaryColor`, which the create form never exposed.
- **Payer** ([src/app/dashboard/payers/[id]/edit/](src/app/dashboard/payers/[id]/edit/)) —
  deliberately scoped to `payerSchema`'s fields (name/email/phone/contactPref/notes) only.
  `isSelf`/`isEmergencyContactOnly` are structural flags the wizard sets with validation (e.g.
  `isSelf` implies the payer is an 18+ self-paying student) that don't belong on a freeform edit
  form — changing them needs the same judgment the wizard applies, not a raw toggle.
- **Room** ([src/app/dashboard/schools/[id]/rooms/[roomId]/](src/app/dashboard/schools/[id]/rooms/[roomId]/))
  — `OpenHoursEditor` was pulled out of `new-room-form.tsx` into a shared
  [open-hours-editor.tsx](src/app/dashboard/schools/[id]/open-hours-editor.tsx) so create and edit
  don't duplicate it.
- **GroupClass** ([src/app/dashboard/group-classes/[id]/edit/](src/app/dashboard/group-classes/[id]/edit/))
  — same fields as create, including the `Subject` picker.
- **LoanableItem** ([src/app/dashboard/loans/[itemId]/edit/](src/app/dashboard/loans/[itemId]/edit/)).
- **Student** ([src/app/dashboard/students/[id]/edit/](src/app/dashboard/students/[id]/edit/)) —
  scoped to the student's own core fields (name/dob/discipline/source/schoolId). Payer
  relationships, subject tags, and IG Card ID already had their own dedicated management UI
  elsewhere on the detail page and weren't duplicated here.

## Onboarding & Timetabling additions (spec doc "Relational Model, Onboarding & Timetabling", Part 4)

Full stage-by-stage record in [docs/onboarding-timetabling-progress.md](docs/onboarding-timetabling-progress.md). Key decisions worth knowing before touching these:

- **`School` → `TeachingLocation` (4.3)** — see the tenancy note near the top. `locationType` enum (SCHOOL/STUDENT_HOME/TEACHER_BASE/HIRED_VENUE/OTHER); `accessNotes` free-text is teacher-only (shown on the location detail card + edit form, **never** in any `/parent` view — keep it that way).
- **`LessonType` (4.1)** is the teacher's "menu" ([src/app/dashboard/lesson-types/](src/app/dashboard/lesson-types/)). Its `locations` m2m: **empty = offered everywhere**, non-empty = scoped to those venues. `LessonTypeLocationPricing` overrides `defaultFee` per location; the teacher sets it directly (nothing derives it from `VenueFeeArrangement`).
- **Self-serve onboarding (4.2)**: public `/onboard/[teacherId]` (outside the `/dashboard` middleware matcher). Always creates `Student.status = PENDING_REVIEW`; teacher approves/declines at [/dashboard/students/pending](src/app/dashboard/students/pending/). The Students list and location "enrolled" queries filter to `status: ACTIVE` — remember that filter when adding new student queries, or pending submissions leak into live views.
- **`VenueFeeArrangement` (4.4)** is the teacher's own cost, forecast-only by default (`ABSORBED_INTO_FEE`). Only `ITEMISED_TO_PAYER` posts a ledger line — `postVenueFeeIfItemised` in [src/lib/ledger.ts](src/lib/ledger.ts), called after `postLessonDelivered` in both the manual attendance action and CheckIn sign-in. `PERIOD_RENTAL` is excluded from itemisation (not a per-lesson cost). New `LedgerReason.VENUE_FEE_ITEMISED`.
- **`TermCalendar` (4.5)** is teacher-owned, reusable, holds `TermPeriod` + `HolidayPeriod` rows. Assigned to a location via `TeachingLocation.termCalendarId` — "override" is modeled as **assigning a different calendar**, not a diff-on-top of a base (merge semantics would be ambiguous). The legacy `TeachingLocation.termStart/termEnd` scalars remain as a fallback when no calendar is assigned; the bulk generator prefers the calendar's TermPeriods and excludes its holidays.
- **Bulk timetable generation (4.6)**: pure planner in [src/lib/bulk-timetable.ts](src/lib/bulk-timetable.ts) (unit-tested, `__tests__/bulk-timetable.test.ts`), driven from [/dashboard/timetable/bulk](src/app/dashboard/timetable/bulk/). Greedy fair packing (fewest-first, one-lesson-per-day-per-student, each concrete slot used once so the teacher is never double-booked, existing HELD lessons avoided), flags anyone who can't reach the target rather than under-booking. **Student ↔ LessonType has no durable enrollment link** — bulk matches ACTIVE students by `locationId`, defaults selection by `requestedLessonTypeId`, and lets the teacher deselect; LessonType only drives duration/fee. The confirm action recomputes the plan server-side (never trusts the client's preview).

## Curriculum Templates (roadmap v2 Part 5)

- **`CurriculumTemplate`/`CurriculumSection`** are the teacher's reusable syllabus library ([src/app/dashboard/curriculum-templates/](src/app/dashboard/curriculum-templates/)) — optionally linked to a `LessonType` so the right template is suggested when a teacher is working with that lesson type, but nothing enforces the link.
- **`StudentCurriculum`/`StudentCurriculumSection` are an independent snapshot copy taken at import time**, not a live reference to the template — same principle as `ContractAcceptance.contractSnapshot`. Editing the master template later never retroactively changes a student already partway through. Import, "save a student's own plan as a template," and "duplicate one student's plan onto another" (all in [src/app/dashboard/students/[id]/curriculum-actions.ts](src/app/dashboard/students/[id]/curriculum-actions.ts)) are all copy operations for this reason — none of them create a live FK back to the source.
- **A plan can also be built from scratch directly on a student** (`createBlankCurriculumAction`, `templateId: null`) — the spec explicitly asks for this alongside template import, so `StudentCurriculum.templateId` is nullable and purely informational (which template it came from, if any), not a required parent.
- **`LessonNote.studentCurriculumSectionId` is optional** — lets a per-lesson note reference "which section this lesson worked on" without requiring a curriculum to exist at all; no UI wiring for setting it from the lesson-note form yet (schema-ready, not surfaced).
- **Not built**: Part 5a (sellable `Course`/`CourseItem`/`CoursePurchase` content) from the same roadmap doc — deliberately scoped out of this pass, revisit separately since it touches the ledger/microsite, unlike the template CRUD above which touches neither.

## Session Plans (roadmap v2 Part 6a)

- **`SessionPlan` is distinct from `LessonNote`** — a note is a private per-lesson record; a plan is what's happening in *this specific session*, shared with everyone attending and (optionally) shown on a public venue display. Both can exist on the same `Lesson` independently.
- **Exactly one of `SessionPlan.lessonId`/`groupClassId` is set, enforced only in application code** (both server actions and the two dedicated panel components), not a DB constraint — Prisma has no native "exactly one of N nullable FKs" check.
- **`Lesson` → `SessionPlan` is 1:1** (`Lesson.sessionPlan`, unique FK) — a dated lesson has at most one plan, edited in place. **`GroupClass` → `SessionPlan` is 1:many** ([src/app/dashboard/session-plans/group-class-session-plan-panel.tsx](src/app/dashboard/session-plans/group-class-session-plan-panel.tsx)) because `GroupClass` has no dated per-occurrence row at all (see the existing CheckIn note: "group-class check-ins are attendance-only, no dated instance to bill") — each week's session gets its own new `SessionPlan` row, and the most-recently-created one is treated as "current" everywhere (student-facing panel, public display).
- **`SessionPlanTemplate` is a plain title/content pair**, copied (not referenced) into a new `SessionPlan` on "save as template" / "start from template" — same snapshot-not-live-link principle as `ContractAcceptance`/`CurriculumTemplate`.
- **Only `publishedAt`-set plans reach the public display** — a teacher can draft/edit a plan freely without it appearing on a venue screen; publishing is an explicit toggle ([src/app/dashboard/session-plans/actions.ts](src/app/dashboard/session-plans/actions.ts) `togglePublishSessionPlanAction`).
- **Public "Now/Next" display (`/display/[token]`)** is outside the `/dashboard` middleware matcher, gated only by an unguessable `TeachingLocation.displayToken` (generated on demand from the location detail page, not present by default — same "generate a link, teacher shares it manually" pattern as the self-serve onboarding link and Stripe payment links). No login, no session — deliberately as low-friction as a venue TV/tablet needs. `export const dynamic = "force-dynamic"` because it must reflect real time, not be statically cached.
- **Now/Next resolution is a pure, unit-tested function** ([src/lib/session-plan-display.ts](src/lib/session-plan-display.ts), `__tests__/session-plan-display.test.ts`) — takes `now: Date` as an explicit parameter rather than reading the clock internally, so it's deterministic to test. Combines today's dated `Lesson`s with any `GroupClass` whose `dayOfWeek` matches today, sorts by start time, and picks the in-progress one ("now") and the soonest upcoming one ("next").

## Group Class Capacity & Waitlist (roadmap v2 Part 6b)

- **Checked `CheckIn` first, per the roadmap doc's own instruction** — it already covers card-based attendance sign-in/out and is attendance-only by design (no dated instance to bill for group classes). A separate `PRESENT`/`ABSENT`/`LATE`/`EXCUSED` status model was judged to duplicate that, so it was **not built**. Capacity/waitlist is a genuinely different concern (self-service booking into a slot before the session happens) and got its own model.
- **`GroupSessionBooking` is distinct from `GroupClassMember`** — membership is standing (no date), a booking is for one specific dated occurrence of a recurring class (`sessionDate`). `GroupClass.capacity` is null = unlimited and only governs per-date booking overflow, not the class's overall roster size.
- **Waitlist promotion logic is a pure, unit-tested pair of functions** ([src/lib/group-booking.ts](src/lib/group-booking.ts), `__tests__/group-booking.test.ts`): `resolveBookingStatus` (CONFIRMED vs WAITLISTED at booking time) and `pickPromotionCandidate` (earliest-booked waitlisted entry promoted when a CONFIRMED booking is cancelled) — kept separate from the Prisma-touching server action ([src/app/dashboard/group-classes/[id]/booking-actions.ts](src/app/dashboard/group-classes/[id]/booking-actions.ts)) for the same testability reason as `bulk-timetable.ts`.
- **Booking UI is teacher-facing only for now**, on the GroupClass detail page — the roadmap doc frames this as eventual "self-service" (implying a parent/student-facing microsite widget), but that's a larger addition (needs a booking view scoped to a student's own enrolled classes) and was deliberately scoped out of this pass, same reasoning as Part 5a.

## Compliance & Safety (roadmap v2 Part 6c)

- **`InstructorCertification`** ([src/app/dashboard/certifications/](src/app/dashboard/certifications/)) is scoped to the teacher even pre-multi-instructor — useful standalone as a renewal-date tracker (first aid, safeguarding, DBS, instrument-specific qualifications). `expiryBadge()` in the page itself flags "Expired" or "Expires in Nd" once within `reminderDaysBefore` of the expiry date; no background job/email reminder yet, it's a page-view-time computation only.
- **`StudentMedicalNote` is deliberately never surfaced outside `/dashboard`** — same treatment as `TeachingLocation.accessNotes`: a labeled amber "Teacher-only" banner on the Student detail panel, no field/route reachable from any `/parent` microsite page. Modeled as its own table (not a `Student` column) specifically so future multi-instructor visibility scoping (Part 6e, not yet built) has somewhere to attach without a schema change.
- **`IncidentLog` is separate from `LessonNote`** — a safeguarding/liability record (what happened, action taken, who it was reported to), not teaching content. Optionally linked to a `Student` and/or `Lesson` (both nullable, `onDelete: SetNull` so deleting a lesson never silently deletes the incident record) but works standalone too — the "log an incident" form at `/dashboard/incidents` doesn't require either.

## Configurable Cancellation Policy (roadmap v2 Part 6d)

- **No policy configured = the original always-free behavior, unchanged** — `resolveCancellationOutcome` (`src/lib/cancellation-policy.ts`) returns `CREDIT` when `policy` is `null`, so every existing teacher who never sets one up keeps exactly the pre-6d "Absent, make-up owed" behavior described in the Ledger Engine Decisions above. This was a deliberate compatibility constraint, not an oversight.
- **Notice is computed from a new "Informed" timestamp on the existing attendance form** ([src/app/dashboard/lessons/[id]/attendance-buttons.tsx](src/app/dashboard/lessons/[id]/attendance-buttons.tsx)), not from when the teacher happens to click the button — there was previously no record of *when* a guardian actually cancelled, only *that* they didn't show up. Leaving it blank defaults to "now," which reads as a same-time no-show (correct default for the common case of marking attendance after the lesson happened).
- **Three-way split, not two**: sufficient notice (always `CREDIT`, no exceptions) vs. late-but-informed-in-advance (`lateCancelAction`) vs. informed at/after the scheduled time (`noShowAction`) — a genuine no-show and a "called an hour before" late cancellation are different situations a teacher may reasonably want to treat differently, so they're two separate configurable actions rather than one.
- **Resolution prefers a location-scoped `CancellationPolicy` over the teacher's bare default** (`resolveApplicablePolicy` in `src/app/dashboard/lessons/[id]/actions.ts`) — same "assignment, not merge" pattern as `TeachingLocation.termCalendarId`. `CancellationPolicy.locationId` is `@unique` (at most one override per location) but the teacher-wide default (`locationId: null`) isn't DB-enforced to be singular — the upsert action finds-or-creates instead, same pattern used elsewhere for "at most one" relationships without a partial unique index.
- **`FULL_CHARGE`/`PARTIAL_CHARGE` post a new `LATE_CANCELLATION_CHARGE` ledger reason** (`postLateCancellationCharge` in `src/lib/ledger.ts`), added to `CASH_BALANCE_REASONS` since — unlike `MAKE_UP_CREDIT_ISSUED` — it's a real charge, not a banked lesson. `FORFEIT` posts nothing at all (the student simply loses the slot); `CREDIT` is the original `postMakeUpCreditIssued` + `MakeUpLesson` row, unchanged.
- **The "already marked" double-submit guard now also checks `Lesson.noShowConfirmed`**, not only a tagged ledger entry — `FORFEIT` posts no ledger row at all, so the pre-existing ledger-tag-only guard would have let a second submission through for that one outcome.

## Lesson Feedback (roadmap v2 Part 6f)

- **Guardian-only, not student-viewer** — `LessonFeedback.payerId` needs a real `Payer` row to attribute to, and a 16+ student's independent microsite login has no `Payer` record of its own (see the `isAtLeast16`/`isAtLeast18` distinction in Conventions above). `StudentViewContext` (`src/lib/microsite-access.ts`) gained a `payerId: string | null` field (set only for `viewerType: "guardian"`) specifically so the feedback form/query knows this; the notes page only renders the form when `viewerType === "guardian"`.
- **Submitted from the existing lesson-notes microsite page** ([src/app/parent/students/[studentId]/notes/page.tsx](src/app/parent/students/[studentId]/notes/page.tsx)), not a new route — a guardian is already looking at what happened in a specific lesson there, so that's the natural place to rate it, and it avoids building a second per-lesson browsing view.
- **Upsert on the `(lessonId, payerId)` unique constraint** (`submitLessonFeedbackAction` in `src/app/parent/students/[studentId]/actions.ts`) — re-submitting updates the guardian's own existing feedback rather than erroring or duplicating; the form pre-fills from any existing row so it visibly reads as "Update" not "Submit" on a second visit.
- **Teacher side is two views, not one**: per-lesson feedback (stars + comment + which payer) on the Lesson detail page, and a lightweight average-rating/count aggregate (`prisma.lessonFeedback.aggregate`) shown inline in the Student detail header — no separate feedback dashboard/report page was built, since both existing pages were the natural place to surface this without adding new navigation.

## Commerce Add-ons (roadmap v2 Part 7)

- **`GiftCard` redemption reuses `postPayment`, not a new ledger reason** — a gift card is just a different funding source for an ordinary payment (cash-equivalent, credited to whichever subscription the teacher applies it to at redemption time); it isn't tied to a specific student/subscription until then. `remainingBalance` decrements per redemption rather than the card being single-use, so a card can be spent across several redemptions.
- **`PromoCode` posts through the existing `postManualCorrection`**, tagged `promo:<code>` — a discount is exactly a manual credit correction, not a new ledger reason. `discountType`/`value` resolution (`computeDiscountAmount`) and validity checking (`isPromoCodeValid` — expiry window + usage limit) are pure, unit-tested functions in `src/lib/promo-code.ts`, kept separate from the Prisma-touching action, same pattern as `bulk-timetable.ts`/`group-booking.ts`. `PromoCode.lessonTypeId` is informational scoping only — `LessonType` has no billing hook of its own to actually gate against, pricing lives on `Subscription`.
- **`AccountingExport` is on-demand only, no scheduled/emailed version** — same category of decision as skipping a QR-code library for the self-serve onboarding link: there's no cron/email-send infra in this app to build a reliable scheduled export. `GET /api/accounting-export` (optional `?from=&to=` query params) streams a CSV; the actual row-formatting (signed amount: CREDIT positive, DEBIT negative — a standard transaction-ledger convention QuickBooks/Xero both import) is a pure, unit-tested function (`formatLedgerEntriesAsCsv` in `src/lib/accounting-export.ts`).

## Embeddable Onboarding Widget (roadmap v2 Part 4 tail)

- **Reuses `OnboardingForm` and `submitSelfServeOnboardingAction` unchanged** — `/onboard/embed/[token]` ([src/app/onboard/embed/[token]/page.tsx](src/app/onboard/embed/[token]/page.tsx)) resolves an `EmbedConfig` into the same `teacherId`/`locationId`/`lessonTypes` props `/onboard/[teacherId]` already builds, then renders the identical form component. A submission through either route lands in the exact same `PENDING_REVIEW` queue — there was never a second onboarding pipeline to keep in sync.
- **`EmbedConfig.allowedLessonTypes` (m2m) narrows further than location scoping, it doesn't replace it** — the embed page filters lesson types by *both* the location-offered check (same logic as the plain link's `?location=` param) *and* the allowlist (empty allowlist = no extra narrowing). A teacher scopes by location, by lesson type, by both, or by neither.
- **One config generates two outputs from the same data** — a plain shareable link and an `<iframe>` copy-paste snippet ([src/app/dashboard/embeds/embed-share-card.tsx](src/app/dashboard/embeds/embed-share-card.tsx)) — so a teacher doesn't need to choose between "for my own website" and "for a bio link" when creating one; they get both immediately.
- **`brandColor` is the only styling override** — applied inline to the page heading only, not a full re-skin. Keeps the embed visually distinct without needing a themable component system for what's a single-purpose form.

## Online Lessons (roadmap v2 Part 1b/1c)

- **`LocationType` gained `ONLINE`**, added to the enum after the fact (this line previously said the enum was `SCHOOL`/`STUDENT_HOME`/`TEACHER_BASE`/`HIRED_VENUE`/`OTHER` — that was accurate when written but is now stale; `ONLINE` exists). `TeachingLocation.address` was already nullable from the original schema, so no change was needed there for "not meaningful for ONLINE."
- **`Lesson.meetingUrl` is a teacher-supplied link, not an API-created meeting** — deliberately skips Zoom/Meet/Teams API integration for the MVP (no OAuth/API setup overhead until there's real usage to justify it, same reasoning as Gmail/Stripe's "still needs real credentials to verify end-to-end" caveats). Edited per-lesson on the Lesson detail page ([src/app/dashboard/lessons/[id]/meeting-url-form.tsx](src/app/dashboard/lessons/[id]/meeting-url-form.tsx)), not set at bulk-creation time — the bulk timetable generator and fixed/fluid generators don't ask for it, since only a subset of lessons need one.
- **`.ics` export is one-off and one-way** (`src/lib/ics.ts`, pure/unit-tested; served via `GET /api/lessons/[id]/ics`) — an "add to calendar" convenience, never a two-way sync. The in-app calendar remains the single source of truth, consistent with the existing Google Calendar/Drive sync deferral. The endpoint checks either owning-teacher auth or microsite (guardian/student) access to the lesson's student — same dual-audience pattern as everywhere else a lesson is visible from both sides.
- **Safeguarding guidance is policy text, not an enforced control** — a callout on the Lesson detail page for `ONLINE`-location lessons (waiting room, "host must be present," recording-with-retention recommendations), explicitly framed as guidance Learnio can't control given the MVP uses the teacher's own meeting link rather than a platform-created one. Revisit once (if) Zoom/Meet API integration is built — a platform-created meeting under the platform's own account would make these actually enforceable rather than just displayed.

## Sellable Course Content (roadmap v2 Part 5a)

- **Deliberately deviates from the roadmap doc's own suggestion of posting `CoursePurchase` to the ledger** — `LedgerEntry.subscriptionId` is required non-null, but a payer buying a standalone course may have no `Subscription` at all to attach it to. Follows the established `AddOn`/`AddOnBooking` precedent instead (see "Add-on Decisions" above): `CoursePurchase.amountPaid` is a snapshot at purchase time, and collecting the money is a manual, out-of-band teacher action (`recordCoursePurchaseAction`), not automated. This was scoped out twice earlier in this session specifically because of the ledger tension — resolved once the `AddOn` precedent was identified as the right pattern to follow instead of the doc's literal wording.
- **`CourseItem.courseId` is nullable** — a `null` course means free-standing library content (optionally linked to a `LessonType`), not part of any priced `Course`. This mirrors the doc's own "Free vs paid" framing, though the CurriculumSection-linking half of that framing wasn't built (see below).
- **Not built from the original spec wording**: `CourseItem` linking to a `CurriculumSection`/`StudentCurriculumSection` (auto-visible reference material for a student actively on that curriculum path) — only the `LessonType` link was built. Revisit if curriculum-linked auto-visibility becomes a real need; the `lessonTypeId` link alone already covers "suggest the right course for this lesson type."
- **Microsite "Courses" tab is guardian-only** — `CoursePurchase.payerId` needs a real `Payer` row, same reasoning as `LessonFeedback`'s guardian-only gating: a 16+ student's independent login has no `Payer` row to look purchases up against.

## Multi-Instructor Support (roadmap v2 Part 6e)

- **User-confirmed design decision** (via AskUserQuestion): `Organisation` is a new tenancy layer *above* `Teacher`, not a `role`/`reportsToId` field bolted directly onto `Teacher`. `Teacher.organisationId` is nullable and defaults to unset — every existing teacher is unaffected, exactly today's behavior.
- **Deliberately conservative scope — read this before extending it.** Grouping `Teacher` accounts under one `Organisation` does **NOT** change the existing per-`Teacher` tenancy boundary on `Student`/`Payer`/`Subscription`/etc. — those still belong to exactly one `teacherId`, unchanged everywhere in the app. A full shared-roster model (any instructor in the org sees all org students) would touch dozens of `teacherId`-scoped queries across the codebase and is a much bigger change than this pass makes. What `Organisation` actually adds: (1) account grouping/membership, and (2) `CoverAssignment` — a record of one instructor covering another's lesson, with **no ownership transfer** of the `Lesson`/`Student`/`Subscription` records involved.
- **Consent-based join, same pattern as embed/onboarding links elsewhere** ([src/app/dashboard/organisation/actions.ts](src/app/dashboard/organisation/actions.ts)) — an OWNER generates a shareable invite link (`OrganisationInvite.token`), the invitee accepts it themselves while authenticated as their own `Teacher` account. An OWNER can never unilaterally attach another account. Only works while the invitee has no `organisationId` yet (no poaching from an existing org, no double-membership).
- **Starting an org auto-makes the creator its `OWNER`** — `role` only means anything once `organisationId` is set; `OWNER` is the default so there's no separate promotion step. Only an `OWNER` can generate invites; any member (`OWNER` or `INSTRUCTOR`) can leave via self-removal (`leaveOrganisationAction`), which resets them to a standalone `OWNER` of nobody — exactly the pre-Organisation state.
- **`CoverAssignment` UI only appears on the Lesson detail page once the lesson's teacher has org members to assign** — `originalInstructorId` is always the lesson's real `teacherId` (ownership never moves), `coveringInstructorId` must be validated as a member of the *same* organisation before the assignment is created.

## Freelancer Safety Net (roadmap v2 Part 9b)

- **Batch-cancel today is a thin link, not new backend** — `cancelTodayHref()` on the Today page ([src/app/dashboard/today/today-view.tsx](src/app/dashboard/today/today-view.tsx)) just pre-fills `start`/`end`/`reason` query params and sends the teacher to the *existing* `/dashboard/unavailability/preview` flow, which already accepts those via query string. No duplicate cancellation/notification logic was written — the existing `Unavailability` workflow (confirm → cancel → credit → email) does the entire job unchanged.
- **`LoneWorkerCheckIn` is scoped to `STUDENT_HOME` lessons only**, not other location types — the safety concern is specifically a teacher travelling alone to a stranger's home. Check-in/check-out buttons only render on the Lesson detail page when `location.locationType === "STUDENT_HOME"`.
- **The overdue-checkout alert is a lazy, request-triggered sweep, not a real scheduled job** — `checkAndSendLoneWorkerAlerts` (`src/lib/lone-worker.ts`, pure `isOverdue` unit-tested separately) runs on every `GET /api/today` call, i.e. whenever a teacher has the Today page open (the page they'd realistically have open while out teaching). This is a best-effort heuristic, explicitly not a guaranteed real-time alert — same honest "no cron infra in this app" framing as `AccountingExport` and the certification-expiry badges. If a teacher never reopens the app after a lesson, no alert fires; documented as the known limitation rather than glossed over.
- **`Teacher.emergencyContact*` is a separate contact from anything guardian-facing** — edited under Billing settings, never surfaced to a `/parent` view. The alert email reuses `sendEmailAsTeacher` (the same Gmail-send infra as everything else), so it silently no-ops if Gmail isn't connected or no emergency email is set — the Lesson detail page surfaces a warning callout in that case rather than failing silently with no explanation.

## Dev Server / Tailwind cwd Bug (fixed, but know why)

The harness that runs this project's dev server preview can't invoke bare `npm`/`next` via PATH
lookup — see the earlier `node.exe` + direct-bin-script workaround. That workaround runs Next
with an explicit project-directory *argument*, but the process's actual `cwd` stayed whatever the
harness's own default is (a *different* directory entirely) — Next.js itself doesn't care, but
**Tailwind's PostCSS plugin does its own config auto-discovery relative to `cwd`**, silently fell
back to an empty config (`content: []`) when it couldn't find `tailwind.config.ts` there, and
produced zero utility classes. Base/reset styles still rendered fine, which made this look like
"some Tailwind classes are missing" rather than "Tailwind found none of my files" — everything
was actually just unstyled black-text-on-white the whole time this was broken.

Fixed two ways, both worth keeping:
1. **`scripts/run-next-dev.js`** — a wrapper that `chdir()`s to the project root before requiring
   Next's CLI, so `.claude/launch.json` runs `node scripts/run-next-dev.js` instead of `node
   .../next/dist/bin/next dev <dir>`. Fixes `cwd` for *every* cwd-dependent tool, not just Tailwind.
2. **`postcss.config.mjs`** explicitly passes an absolute `config` path to the `tailwindcss`
   plugin, and **`tailwind.config.ts`**'s own `content` globs are anchored to `__dirname` rather
   than relative paths — belt-and-suspenders in case cwd breaks again some other way.

If styling ever silently disappears again (blank/unstyled pages that otherwise render and
function correctly), check the compiled CSS for utility classes before assuming a code bug —
`fetch('/_next/static/css/app/layout.css').then(r=>r.text())` in the browser console, looking for
`.rounded-lg` or similar. If it's missing, this cwd issue is the first suspect.

## Conventions

- Server components by default; `'use client'` only for interactivity.
- Money fields are `Decimal` (`@db.Decimal(10,2)`), never `Float`.
- Ledger entries are append-only — never edit/delete a `LedgerEntry`; corrections are new `MANUAL_CORRECTION` entries.
- `Lesson.hoursCounted` must be `false` for cover/make-up lessons so they don't double-bill.
- Availability/protectedBlocks/openHours are stored as `Json` arrays of plain objects (no separate join tables) — see schema comments for shape.
- **Two distinct age thresholds, don't conflate them** ([src/lib/age.ts](src/lib/age.ts)): `isAtLeast16` gates a 16+ student's own microsite login; `isAtLeast18` gates the new-student wizard's "student pays themself" option (a legal adult can be the billing party). A 16-year-old can view their schedule but cannot self-pay. `ageInYears` is the shared primitive.
- **`StudentPayerLink` is the single source of truth for family/billing relationships** — a coincidental name match between a Payer and a Student never implies a link. Global search ([src/app/api/search/route.ts](src/app/api/search/route.ts)) returns name matches as separate typed groups, never merged.
- **Payer flags** ([prisma/schema.prisma](prisma/schema.prisma) `Payer`): `isSelf` = the adult student paying for themselves; `isEmergencyContactOnly` = a safeguarding contact for an under-18 whose *school* is billed (never carries a Subscription, never `isPrimary`); `contactPref` (WHATSAPP/SMS/EMAIL) + `notes` (also holds address — no dedicated column). Set by the wizard.
- **New students are created via the multi-step wizard** ([src/app/dashboard/students/new/student-wizard.tsx](src/app/dashboard/students/new/student-wizard.tsx)), NOT the old flat form (removed). All state is client-side; one transactional save (`createStudentWithRelationshipsAction` in [src/app/dashboard/students/actions.ts](src/app/dashboard/students/actions.ts)) creates payer(s) + student + links atomically, so there are no orphan/partial records. The action is server-authoritative on the validation rules (≥1 billing payer OR school-invoiced; under-18 needs ≥1 contact; search-before-create dedupes payers on name+phone/email). The old `createStudentAction` no longer exists in `actions.ts` — this line previously said it was "orphaned but left in place," which was stale; it's since been removed. A `updateStudentAction` now exists alongside it for editing a student's own core fields post-creation (see "Edit Forms" above), separate from the wizard's creation path.
- **Cross-entity linking is bidirectional and read-live**: Payer detail (`payers/[id]`) → Pupils; Student detail → Payer(s) (shows `splitPercent`/primary/contact-only); School detail → Enrolled students (by `Student.schoolId`). Deep-link anchors: `#pupils`, `#payers`, `#enrolled` (used by global-search result selection).
- **Offline is view-only and scoped to one page** ([src/app/dashboard/today/](src/app/dashboard/today/), backed by `GET /api/today`) — no offline attendance/notes/billing, on purpose. Mechanically: a service worker intercepts navigation *before* it reaches the server, which means it also bypasses the Edge middleware session check — so the offline page can never rely on server-side auth at load time, only on data cached client-side (IndexedDB, [src/lib/offline-cache.ts](src/lib/offline-cache.ts)) during an earlier real online session. The service worker's `NetworkFirst` runtime caching ([src/app/sw.ts](src/app/sw.ts)) serves a cached response as an ordinary *successful* fetch — it does not throw — so the page's own offline-detection logic checks `navigator.onLine`, not fetch failure, to decide whether to show the "showing cached data as of..." banner. The offline cache is cleared on sign-out. `@serwist/next` is disabled in `next dev` (see `next.config.mjs`) — testing it requires `next build && next start`. `authConfig.trustHost: true` ([src/auth.config.ts](src/auth.config.ts)) was added because Auth.js otherwise rejects the callback host under `next start`/most non-Vercel hosts even when it matches `NEXTAUTH_URL`.

---

## Environment Variables

See [.env.example](.env.example). Key ones: `DATABASE_URL` (Supabase direct connection, port 5432 — not the pooled one, for migrations), `AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
