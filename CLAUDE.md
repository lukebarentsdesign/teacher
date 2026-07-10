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
2. [ ] Teacher/School/Student/Subscription CRUD + auth
3. [ ] Ledger engine (sanity-check hardest — running balance + cancellation payout + make-up credits)
4. [ ] Timetable generator (fixed/fluid, protected blocks, lesson-history ghost overlay)
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

## Conventions

- Server components by default; `'use client'` only for interactivity.
- Money fields are `Decimal` (`@db.Decimal(10,2)`), never `Float`.
- Ledger entries are append-only — never edit/delete a `LedgerEntry`; corrections are new `MANUAL_CORRECTION` entries.
- `Lesson.hoursCounted` must be `false` for cover/make-up lessons so they don't double-bill.
- Availability/protectedBlocks/openHours are stored as `Json` arrays of plain objects (no separate join tables) — see schema comments for shape.

---

## Environment Variables

See [.env.example](.env.example). Key ones: `DATABASE_URL` (Supabase direct connection, port 5432 — not the pooled one, for migrations), `AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
