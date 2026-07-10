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
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database | PostgreSQL via Supabase, Prisma ORM 7.x (driver adapter: `@prisma/adapter-pg`) |
| Auth | NextAuth v5 (Credentials provider, JWT session — no OAuth adapter tables) |
| Payments | Stripe (platform billing + Connect Express, see below) |
| Email | Resend |
| Styling | Tailwind CSS |
| Calendar UI | FullCalendar (`@fullcalendar/react`) — MIT, see docs/spec.md section 3a |
| Timetable solver | Google OR-Tools CP-SAT, separate Python service at [timetable-service/](timetable-service/) — not yet wired into the app, see its README |
| Hosting | TBD (not yet deployed — local dev only) |

**Multi-tenant, not single-teacher:** originally scoped as one solo teacher's private tool, but
Stripe requiring per-teacher payment collection (parents pay the teacher directly, not Learnio)
made this a real multi-tenant SaaS product instead — any teacher can register (`/register`) and
gets isolated data. `Student.teacherId` and `Payer.teacherId` are the tenancy boundary; `School` is
shared reference data, scoped per-teacher via `TeacherSchoolLink`. Every list/detail query and
server action must filter by `session.user.id` — see the retrofit commit for the full pattern.

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
4. [x] Timetable generator (fixed/fluid, protected blocks) — [src/lib/scheduling.ts](src/lib/scheduling.ts) (pure, unit-tested) + [src/lib/timetable.ts](src/lib/timetable.ts) (Prisma/conflict-detection). **Not yet done: the lesson-history ghost overlay visual** (spec section 3) — the generator itself, conflict detection, and manual-confirm-before-creating flow are built; the calendar-view "ghost past slots onto this week" rendering is still open.
5. [x] Stripe integration + webhook → LedgerEntry — split into three pieces once "teachers pay Learnio" and "parents pay teachers" turned out to need different Stripe products: platform billing ([src/lib/billing.ts](src/lib/billing.ts)), Connect Express onboarding ([src/lib/connect.ts](src/lib/connect.ts)), and parent payment links ([src/lib/payments.ts](src/lib/payments.ts)), all landing in one webhook ([src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts)). No parent microsite/login yet, so payment links are teacher-generated and shared manually — see below.
6. [x] Contract generation — **in-app clickwrap acceptance, not PDF/e-signature** (spec updated; see docs/spec.md and "Contract Acceptance Decisions" below). PDF is now only an optional post-acceptance download.
7. [x] Parent/student microsite — 6-digit code login (guardian and 16+ student, same namespace), student-picker (`/parent`) for guardians with multiple students, and per-student pages under `/parent/students/[studentId]/`: overview, FullCalendar-based calendar, ledger (gated by `shareBalanceWithStudent` for student viewers), resources, assignments, maintenance reminders (for items on active loan), lesson notes. Access control centralized in `src/lib/microsite-access.ts`.
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

## Stripe Decisions

- **No platform fee on parent payments** — destination charges (`payment_intent_data.transfer_data.destination`) send the full amount to the teacher's connected account minus Stripe's own processing fees. Revisit `src/lib/payments.ts` if a take-rate gets added later (`application_fee_amount` on the same call).
- **Payment links are teacher-generated, not emailed automatically.** There's no parent login yet (that's build step 7, the microsite), so a teacher clicks "Create payment link" on a Subscription and copies/sends the URL themselves. `/pay/[subscriptionId]` is a public, unauthenticated, deliberately generic confirmation page — it must never render any ledger/balance data since it has no auth check.
- **Stripe client is a lazy Proxy** ([src/lib/stripe.ts](src/lib/stripe.ts)) — the SDK throws in its constructor on an empty API key, which broke `next build` before real keys existed. Don't change this back to a plain `new Stripe(...)` export.
- **One webhook endpoint for three concerns**: platform billing events, Connect `account.updated`, and parent-payment `checkout.session.completed` all land in [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts), dispatched by `session.mode` / event type. Payment webhook handling is idempotent via `stripePaymentId` uniqueness (checked before creating a `Payment` row) since Stripe retries webhooks.
- **Still needs real Stripe test keys to actually verify end-to-end** — everything here is typechecked/built but never hit a live Stripe account.

## Contract Acceptance Decisions

- **Contract is per-teacher, not per-subscription.** Originally modeled as `Contract.subscriptionId`; redesigned to `Contract.teacherId` + incrementing `version` because gating is phrased as "the payer has accepted the *current* contract version" — a single evolving document per teacher, not a copy per subscription. No DB migration existed yet when this changed, so the schema was edited directly rather than migrated.
- **`ContractAcceptance.contractSnapshot` is a real independent copy of the text**, not just a foreign key to `Contract.content` — deliberate, so a later edit to the live contract can never retroactively change what a past acceptance recorded. Don't "simplify" this into a join later.
- **`contractVersion` is denormalized onto the acceptance row** specifically so `hasAcceptedCurrentContract` (`src/lib/contracts.ts`) is a direct equality check against the payer's own acceptance, not a join-and-compare.
- **Re-acceptance on a new version is not a separate flagged/reminder flow** — it falls out naturally: `getCurrentContract` always returns the highest version, and `hasAcceptedCurrentContract` checks the acceptance table for that specific version. A stale acceptance (matching an old version) simply doesn't match, so gating blocks by itself.
- **Gating covers lesson booking (timetable confirm) and parent Checkout links, not manual "record a payment."** The teacher's own bookkeeping correction isn't blocked, but the subscription page always shows acceptance status so they're not blind to it. Checked both client-visibly (preview page disables the submit button) and server-side (confirm actions re-check — defense in depth against a replayed/modified request).
- **If a teacher hasn't set up a contract at all, nothing is gated** (`getCurrentContract` returns null → `hasAcceptedCurrentContract` returns `true`). Don't change this without considering existing teachers who haven't configured one yet.
- **Parent auth (`src/lib/parent-session.ts`) is a separate, lightweight signed-cookie session** — not NextAuth, not shared with the Teacher login. Reuses `AUTH_SECRET` to sign rather than adding a second secret. This is only the login piece of the full parent microsite (build step 7); there's no calendar/ledger view behind it yet, just the contract acceptance screen.
- **PDF download (`src/lib/contract-pdf.ts`, `pdf-lib`) is unsigned and optional**, generated only after a `ContractAcceptance` exists, rendering that row's `contractSnapshot` — it has zero bearing on whether the acceptance is legally valid.

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

---

## Environment Variables

See [.env.example](.env.example). Key ones: `DATABASE_URL` (Supabase direct connection, port 5432 — not the pooled one, for migrations), `AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
