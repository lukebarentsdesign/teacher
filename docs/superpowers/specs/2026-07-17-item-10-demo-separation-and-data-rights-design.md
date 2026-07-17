# Item 10 — Demo/seed separation & trial data export/delete

**Status:** design, awaiting approval
**Date:** 2026-07-17
**Source:** [docs/mvp-build-plan.md](../../mvp-build-plan.md) Item 10 (Phase 3 — "Trust the trial")

## Goal

Before real pupil/parent data goes into the trial, make three things true:

1. **Demo data is visibly distinct** from real trial data and never mixed into a real account.
2. **A teacher can export** the data Learnio holds about their pupils/payers, and **delete** it.
3. **A short privacy checklist** documents that the surfaces holding real data are tenant-safe.

This adds no product breadth — it's a trust/safety layer on the existing data.

## Non-goals

- Full auth-account deletion (the Better Auth `user`/`account` rows). We delete a teacher's
  *tenant data*, not their login — they can start fresh. Account closure is out of scope for the trial.
- GDPR/DPA legal completeness. This is an engineering safety net, not legal sign-off.
- Per-row demo flags. All seeded demo data hangs off the demo teacher(s), so one flag on `Teacher`
  covers the whole demo dataset via the existing tenancy boundary.

---

## 1. Demo-data labelling — `Teacher.isDemo`

### Schema
Add to the `Teacher` model:

```prisma
/// True only for seeded demo/sample accounts (teacher@example.com, cover.teacher@example.com).
/// Real registrations are always false. Used to (a) badge the account in-app so demo data is never
/// mistaken for real trial data, and (b) let an operator identify/purge demo accounts. The whole
/// demo dataset hangs off these teachers via the teacherId tenancy boundary, so no per-row flag is
/// needed.
isDemo Boolean @default(false)
```

Hand-written migration `20260717160000_add_teacher_is_demo` (matching the project's hand-written
migration convention): `ALTER TABLE "Teacher" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;`

### Seed
`prisma/seed.ts` sets `isDemo: true` on both seeded teachers (in the `create`/`update` of each
upsert). The Better Auth signup hook (`src/auth.ts`) and real registration leave the default `false`.

### In-app badge
A small amber "Demo account" badge rendered in the dashboard chrome (sidebar footer or header) when
`teacher.isDemo` is true. Server-side check in the dashboard layout, which already loads the teacher.
No badge for real accounts — zero visual change for trial teachers.

---

## 2. Data export — `GET /api/account/export`

A read-only endpoint that returns everything Learnio holds under the authenticated teacher.

- **Auth:** same pattern as `/api/accounting-export` — resolves `session.user.id`, 401 if absent.
  Strictly tenant-scoped: every query filters by the teacher's own id.
- **Format:** a single JSON document (relational/nested data doesn't fit one CSV table cleanly).
  `Content-Disposition: attachment; filename="learnio-export-<date>.json"`.
- **Contents:** the teacher's own profile (non-secret fields only — never `passwordHash`, Stripe
  secrets, or the encrypted Gmail token), plus arrays of their payers, students, subscriptions,
  invoices, ledger entries, and lessons. This is the "here's everything about your pupils" dump the
  plan names.
- **No side effects.** Pure read.

The collection logic lives in a shared helper (see §4) so export and delete agree on exactly which
tables constitute "the teacher's data".

---

## 3. Data deletion — self-serve, on the billing/settings page

A server action `deleteMyTrialDataAction` plus a small confirmation UI on
`src/app/dashboard/billing/page.tsx` (the existing settings surface).

- **Scope:** removes the teacher's tenant-scoped rows (students, payers, subscriptions, invoices,
  ledger entries, lessons, and the other `teacherId`-owned records) — reusing the **same purge logic
  already proven** in `prisma/seed.ts` (`purgeTeacherData`), extracted to a shared module so there's
  one source of truth (see §4). Keeps the `Teacher` row and the auth account so the teacher can
  start over.
- **Guard 1 — confirmation:** the teacher must type a fixed phrase (e.g. `DELETE MY DATA`) into an
  input; the action re-validates it server-side. No one-click destruction.
- **Guard 2 — demo lock:** the action refuses to run when `teacher.isDemo` is true, so the shared
  demo account can never be wiped by a curious trial user. Returns a clear message instead.
- **Feedback:** on success, redirect back to settings with a confirmation; the now-empty lists across
  the dashboard reflect the deletion immediately.

This is destructive, so it is deliberately gated twice and never touches another teacher's data (the
purge is entirely `teacherId`-scoped).

---

## 4. Shared helper — `src/lib/teacher-data.ts`

Extract the "what rows belong to this teacher" knowledge into one module used by export, delete, and
the seed:

- `collectTeacherData(teacherId)` → the structured object the export serialises (read).
- `purgeTeacherData(teacherId)` → deletes those rows (moved out of `prisma/seed.ts`; the seed now
  imports it, so seed re-runs and the delete action share identical logic).

Keeping these together guarantees export and delete never drift out of sync about which tables count
as "the teacher's data" — a real risk if a future table is added and only one path is updated.

---

## 5. Privacy checklist — `docs/privacy-checklist.md`

A short, honest doc (not marketing) covering:

- **Tenant isolation:** every core query filters by `session.user.id`; `Student.teacherId` /
  `Payer.teacherId` are the boundary. (References the auth-id fix from Item 1 that made
  `session.user.id === Teacher.id` actually hold.)
- **What we hold:** the list of tables in the export.
- **Teacher-only surfaces** never exposed to parents/students: `StudentMedicalNote`,
  `TeachingLocation.accessNotes`, `IncidentLog`.
- **Export & delete:** where they live and what they cover.
- **Demo separation:** the `isDemo` guarantee.
- A checkbox-style sign-off line to tick before real data is entered.

---

## Testing

- **Unit test** for `src/lib/teacher-data.ts`: `collectTeacherData` returns only the target
  teacher's rows (seed two teachers, assert no cross-tenant leakage); `purgeTeacherData` removes the
  target teacher's rows and leaves the other teacher's intact.
- **Export endpoint:** a focused check (script or extension of the smoke runner) that the export for
  a freshly-seeded journey teacher contains their payer/student/subscription/invoice and no other
  teacher's rows.
- **Delete:** assert the demo-lock refuses on `isDemo`, and that a real teacher's data is gone after
  the action while their `Teacher`/auth row survives.
- Full `npm test` stays green.

## Rollout / risk

- The migration is purely additive (one nullable-with-default column) — safe on the trial DB via
  `migrate deploy`.
- Delete is the only destructive surface; double-guarded and tenant-scoped.
- No change to any existing teacher's experience unless they choose to export or delete.
