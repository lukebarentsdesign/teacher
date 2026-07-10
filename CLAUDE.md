# Learnio — Peripatetic Teacher App

This file is the source of truth for any AI assistant working on this codebase. Read this before making decisions.

> **Full build spec:** [docs/spec.md](docs/spec.md) — read it before writing any code. It defines every entity, business rule, and the required build order.

---

## What This Product Is

A standalone platform for self-employed peripatetic instructors (music teachers, yoga instructors, personal trainers) working across multiple locations — home visits, private students, and contracted work across several schools/venues that change term to term.

Core jobs to be done: track schools/students/payers, generate timetables (fixed/fluid), run subscription billing with a running-balance ledger, handle group classes/room bookings/gradings/equipment loans, take Stripe payments, generate contracts, forecast teacher income.

**Deferred to v2+:** full IG Card account linking, WhatsApp messaging, multi-currency, multi-teacher commission splitting, Google Calendar/Drive sync. **Explicitly excluded, do not revisit:** Google Classroom (see spec section 4 for why).

**In scope for v1:** card-based sign-in/out for attendance (`CheckIn` model) — reuses IG Card wallet-pass infra, not full account linking.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Database | PostgreSQL via Supabase, Prisma ORM 7.x (driver adapter: `@prisma/adapter-pg`) |
| Auth | NextAuth v5 (Credentials provider, JWT session — no OAuth adapter tables) |
| Payments | Stripe |
| Email | Resend |
| Styling | Tailwind CSS |
| Hosting | TBD (not yet deployed — local dev only) |

Prisma 7 note: connection config lives in `prisma.config.ts`, not in `schema.prisma`'s `datasource` block. Runtime `PrismaClient` requires a driver adapter — see [src/lib/db.ts](src/lib/db.ts).

---

## Build Order (from spec section 6 — follow in sequence)

1. [x] Prisma schema for all entities — [prisma/schema.prisma](prisma/schema.prisma)
2. [x] Teacher/School/Student/Subscription CRUD + auth
3. [x] Ledger engine (sanity-check hardest — running balance + cancellation payout + make-up credits) — [src/lib/ledger.ts](src/lib/ledger.ts), unit-tested in [__tests__/ledger.test.ts](__tests__/ledger.test.ts)
4. [x] Timetable generator (fixed/fluid, protected blocks) — [src/lib/scheduling.ts](src/lib/scheduling.ts) (pure, unit-tested) + [src/lib/timetable.ts](src/lib/timetable.ts) (Prisma/conflict-detection). **Not yet done: the lesson-history ghost overlay visual** (spec section 3) — the generator itself, conflict detection, and manual-confirm-before-creating flow are built; the calendar-view "ghost past slots onto this week" rendering is still open.
5. [ ] Stripe integration + webhook → LedgerEntry
6. [ ] Contract generation (uses the `document-generation-pdf` skill)
7. [ ] Parent microsite (6-digit per-family access code, read-only calendar + ledger)
8. [ ] Room booking, GroupClass, Assessment, LoanableItem/Loan modules
9. [ ] Teacher income forecasting dashboard + expense tracking

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
- **Open question, not yet resolved:** `postLessonDelivered(subscriptionId, lessonValue, ...)` takes `lessonValue` as a caller-supplied number rather than deriving it internally. There's no single obvious formula for "value of one lesson" across all four `billingModel`s (e.g. `SMOOTHED_SUBSCRIPTION` splits `annualFee` across a year of lessons whose count depends on the teacher's schedule, which doesn't exist yet). This gets resolved when the timetable generator (build step 4) makes lesson counts knowable — don't guess a formula before then.

## Scheduling Decisions (worth knowing before touching [src/lib/scheduling.ts](src/lib/scheduling.ts) / [src/lib/timetable.ts](src/lib/timetable.ts))

- **TeacherSchoolLink CRUD lives under a school's detail page** ([src/app/dashboard/schools/[id]/page.tsx](src/app/dashboard/schools/[id]/page.tsx)), added alongside the generator since it's the generator's direct input (availability + protected blocks). It wasn't in the original CRUD pass because the spec's build order didn't call it out separately.
- **School now has termStart/termEnd fields on the create form** — required for the generator to know how many weeks to schedule. Existing schools created before this will need them added via the (not yet built) edit form, or directly in the DB.
- **FLUID mode algorithm:** round-robins one lesson per term-week through the teacher's chosen candidate slots (`slot[weekIndex % N]`). This guarantees each slot is used `floor(weeks/N)` or `ceil(weeks/N)` times — off by at most one lesson — which is how "equal total teaching time" is satisfied. It's a defensible interpretation of a deliberately loose spec requirement, not the only possible one; revisit if it doesn't match what a real term looks like in practice.
- **Conflict detection compares exact `scheduledAt` timestamps** for the same teacher, not overlapping time ranges — fine while lesson durations are short and slots are hand-picked from already-protected-block-filtered availability, but revisit if two different-length lessons could overlap without sharing a start time.
- **Not yet built:** the lesson-history "ghost overlay" calendar visual, and Room-aware conflict checking (Room CRUD is deferred to build step 9 per the spec's own ordering).

## Conventions

- Server components by default; `'use client'` only for interactivity.
- Money fields are `Decimal` (`@db.Decimal(10,2)`), never `Float`.
- Ledger entries are append-only — never edit/delete a `LedgerEntry`; corrections are new `MANUAL_CORRECTION` entries.
- `Lesson.hoursCounted` must be `false` for cover/make-up lessons so they don't double-bill.
- Availability/protectedBlocks/openHours are stored as `Json` arrays of plain objects (no separate join tables) — see schema comments for shape.

---

## Environment Variables

See [.env.example](.env.example). Key ones: `DATABASE_URL` (Supabase direct connection, port 5432 — not the pooled one, for migrations), `AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
