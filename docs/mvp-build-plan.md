# TeachBase — Smooth-Invoicing MVP Build Plan

**Goal:** take TeachBase from trial-readiness 42/100 to a coherent, trustworthy two-week trial for self-employed teachers, instructors and coaches, centred on the one promise the product is named for: turn teaching weeks × session price × session count into a transparent smooth monthly payment, review it, and produce durable invoices.

**Guiding principle:** the codebase is already broad. This plan does not add breadth. It completes the central billing spine, hardens the account/permission foundation beneath it, and hides everything that isn't core so a non-developer teacher can finish the journey without getting lost.

**Definition of done for the MVP:** a teacher can register on the trial database, enter business/invoice details, set teaching weeks, add a payer and a pupil, run a transparent smooth-payment calculation, approve it, generate a numbered invoice that never silently changes, download it, record a payment, and see what's outstanding — with only core features visible and a way to give feedback.

---

## Phases and critical path

The work splits into four phases. Phase 0 unblocks everything; Phases 1–2 build and simplify the core; Phase 3 makes the trial trustworthy and measurable.

| Phase | Theme | Items | Outcome |
|---|---|---|---|
| **Phase 0 — Foundation** | Make the trial environment real and safe | 1, 7 | Accounts work on the real trial DB; core routes are tenant-safe. |
| **Phase 1 — Billing spine** | Build the missing central workflow | 2, 3, 4 | Transparent calculator → reviewed result → durable numbered invoice. |
| **Phase 2 — Make it usable** | Reduce to the MVP surface | 5, 6 | Only core features visible; invoices carry real sender details. |
| **Phase 3 — Trust the trial** | Prove it and learn from it | 8, 9, 10 | E2E journey verified; feedback captured; demo/real data separated. |

**Critical path:** 1 → 2 → 3 → 4 → 8. Items 5, 6, 7, 9, 10 run in parallel branches once their dependency clears. Nothing in Phase 1 should begin against a database that hasn't cleared Item 1.

```
Item 1 (auth migration) ─┬─> Item 2 (billing model) ─> Item 3 (calculator UI) ─┬─> Item 8 (E2E test)
                         │                            └─> Item 4 (invoices) ────┤
                         ├─> Item 7 (permissions)                               │
                         └─> Item 10 (demo/data separation)                     │
                                                     Item 4 ─> Item 6 (invoice settings)
                                     Items 2–4 ─> Item 5 (simplify nav) ─> Item 9 (feedback)
```

---

## Phase 0 — Foundation

### Item 1 — Apply and verify auth migrations on the trial database
**Priority 1 · Complexity: Small · Depends on: nothing · Blocks: everything**

The audit found tests pass only against a disposable migrated schema (`teachbase_verify_20260716171747`); a plain run against the default configured database fails because the latest Better Auth tables are missing. No trial can start on a database where login is unproven.

Scope:
- Run `prisma migrate deploy` against the actual trial database and confirm all migrations in `prisma/migrations` apply cleanly.
- Manually exercise register → login → logout on that database, not just contract tests.
- Confirm the Better Auth handler (`/api/auth/[...all]`) issues real sessions and that expired/revoked sessions return `null` as the bridge contract expects.
- Decide and document the state of the legacy `/api/auth/[...nextauth]` route (retire or keep) so there is one auth path in the trial.

Acceptance criteria:
- `prisma migrate deploy` succeeds on the trial DB with no pending migrations.
- A brand-new teacher can register, log in, log out and log back in on the trial DB.
- `npm test` passes against the trial DB (not only the disposable schema).
- Password-reset / email-verification expectations are either working or explicitly out of scope and hidden.

Evidence anchor: `prisma/migrations`, `src/auth.ts`, `src/app/api/auth/[...all]/route.ts`, `__tests__/auth-migration.test.ts`, `__tests__/auth-bridge-contract.test.ts`.

### Item 7 — Harden core permissions
**Priority 7 · Complexity: Medium · Depends on: Item 1 · Runs parallel to Phase 1**

The audit counts 232 raw `await auth()` call sites and inconsistent helper adoption. Real pupil and parent data can't go into a trial where tenant boundaries are enforced ad hoc. This does not need to be a full migration — only the core MVP surface must be provably safe.

Scope:
- Migrate the core routes/actions — pupils, payers, subscriptions, the new billing/calculator, invoices, payments — from raw `await auth()` to the explicit session and permission helpers.
- Extend `domain-boundaries` / `tenant-isolation` style tests to cover each core route added or changed in Phase 1.
- Leave non-MVP routes (organisations, courses, loans, etc.) as-is since Item 5 hides them.

Acceptance criteria:
- Every core pupil / payer / subscription / invoice / payment route resolves identity through the helpers, not raw `await auth()`.
- Tenant-isolation tests assert a teacher cannot read or write another teacher's pupils, payers, subscriptions or invoices.
- No core route trusts a client-supplied `teacherId`.

Evidence anchor: `src/lib/auth-helpers.ts`, `src/lib/permission-helpers.ts`, `__tests__/domain-boundaries.test.ts`, `__tests__/tenant-isolation.test.ts`.

---

## Phase 1 — Billing spine (the central missing workflow)

This is the heart of the plan. Today the app stores `Subscription.annualFee` and can sometimes derive lesson value, but there is no user-facing calculator, no review step and no durable invoice. Build these three items as one coherent spine.

### Item 2 — Define the core billing calculation model
**Priority 2 · Complexity: Large · Depends on: Item 1 · Blocks: Items 3, 4, 5**

Establish one source of truth for how a smooth monthly amount is derived, so the UI (Item 3) and invoices (Item 4) read the same numbers.

Scope — data model (`prisma/schema.prisma`) plus a new `src/lib/billing` module:
- Capture the calculation inputs on a reviewable object: teaching-weeks / lesson count, lesson price, duration, number of months to spread across, start (and optional end) boundary, and any adjustment/credit.
- Implement a pure calculation function: `lessonCount × price = annual total`, `annual total ÷ months = monthly amount`, with explicit, tested rounding so the twelve monthly amounts sum exactly to the annual total (penny reconciliation on the final month).
- Model first/final partial months and mid-year / mid-term starts as proration inputs, even if the first UI release only surfaces the simple whole-year case.
- Store a **reviewed snapshot**: once a teacher approves, freeze the inputs and outputs so later edits create a new version rather than rewriting history.
- Keep `LedgerEntry` as the running financial truth; the billing model feeds it, it does not replace it.

Acceptance criteria:
- Given lesson count, price and months, the module returns the annual total, the monthly amount, and the exact monthly schedule that sums back to the total (verified by unit tests, including a rounding/pennies case).
- A worked example — `30 lessons × £32 = £960 ÷ 12 = £80/month` — is reproduced exactly by the function and covered by a test.
- Approving a calculation writes an immutable snapshot; changing inputs afterward produces a new version and leaves the prior one intact.

Evidence anchor: `Subscription`, `LedgerEntry`, `src/lib/ledger.ts`, `src/app/dashboard/students/[id]/actions.ts`, `__tests__/ledger.test.ts`.

### Item 3 — Build the transparent smooth-payment calculator UI
**Priority 3 · Complexity: Large · Depends on: Item 2 · Blocks: Item 8**

Give the teacher a screen that shows the maths, not just a box to type an annual fee into. This is the feature that makes the product legible.

Scope (student / subscription pages):
- Replace the "enter annualFee" form with a calculator: teacher enters lesson count (or picks teaching weeks × frequency), lesson price and number of months.
- Show the working live: `count × price = total`, `total ÷ months = £X/month`, and the month-by-month schedule.
- Add an explicit **review & approve** step that persists the reviewed snapshot from Item 2 onto the subscription.
- Handle the common edges visibly: a partial first/final month, and a mid-year start, with plain-language explanation of the resulting figure.

Acceptance criteria:
- A teacher can enter count, price and months and see the total and monthly amount update transparently, then approve it.
- The approved figure is what appears on the subscription, the ledger and the invoice — no divergent numbers.
- Empty and partial states explain the next action.

Evidence anchor: `src/app/dashboard/students/[id]/new-subscription-form.tsx`, `src/app/dashboard/subscriptions/[id]`.

### Item 4 — Add durable invoice records and numbering
**Priority 4 · Complexity: Large · Depends on: Item 2 · Blocks: Item 6**

Today the PDF is rendered directly from ledger entries with no stored invoice, no number and no snapshot, so historical invoices are not guaranteed stable. Add real invoice records.

Scope (Prisma models + invoice routes/pages):
- New `Invoice` model with an immutable invoice number (per-teacher sequential prefix), issue date, due date, status (`draft` / `issued` / `paid` / `void`), payer, pupil/subscription link, and stored line items (a snapshot, not a live query).
- Regenerate the PDF from the stored snapshot rather than from current ledger state, so a downloaded invoice never changes after issue.
- Link invoices to payments so status moves to `paid` when the recorded payment covers it.
- If full invoicing can't ship in the window, the interim honest position is to label the current output "statement PDF" — but the plan's target is real invoices.

Acceptance criteria:
- Issuing an invoice stores a unique number, dates, and frozen line items; re-downloading later reproduces the identical document.
- Editing a subscription after an invoice is issued does not alter that issued invoice.
- Invoice status reflects recorded payments.

Evidence anchor: `src/app/api/subscriptions/[id]/invoice/route.ts`, `src/lib/invoice-pdf.ts`, `LedgerEntry`, `Payment`.

---

## Phase 2 — Make it usable for a real teacher

### Item 5 — Simplify trial navigation
**Priority 5 · Complexity: Medium · Depends on: Items 2–4 (design decisions) · Blocks: Item 9**

The audit's biggest usability risk: navigation exposes courses, gift cards, add-ons, incidents, certifications, equipment loans, check-in, organisations, group classes, resources, curriculum templates and advanced timetable tools — none core to a smooth-invoicing trial.

Scope (`src/app/dashboard/sidebar.tsx`):
- Show only core + supporting MVP: dashboard, payers, pupils, teaching locations (simple), term/teaching-weeks, lesson types (simple), subscriptions/calculator, invoices, payments, income forecast, business/invoice settings.
- Move the "show-and-rate" items (parent portal, Stripe payments, calendar sync, lesson notes/resources) into a clearly separated **Coming soon** area for feedback.
- Hide entirely: organisations, group classes, equipment loans, incidents/certifications/lone-worker, gift cards/promo codes/add-ons/courses, check-in scanner, public display.

Acceptance criteria:
- Only core/supporting links appear in primary navigation.
- Coming-soon features are visibly separated and labelled, not mixed into the working workflow.
- No hidden feature obstructs the core journey.

Evidence anchor: `src/app/dashboard/sidebar.tsx`, Part 2 route inventory, Part 6 coming-soon list.

### Item 6 — Create business / invoice settings
**Priority 6 · Complexity: Medium · Depends on: Item 4**

Invoices need real sender details. Branding fields exist, but invoice details, payment instructions and numbering prefix are incomplete.

Scope (billing/profile pages, `Teacher` model):
- A small "business & invoice details" form: business name, address, payment/bank instructions, invoice number prefix, and optional VAT/tax note.
- Feed these into the Item 4 invoice snapshot so every issued invoice carries correct sender details.

Acceptance criteria:
- A teacher can enter business name, address, payment instructions and invoice prefix, and see them appear on a generated invoice.
- No unbacked claims about "professional invoice configuration" remain if a field isn't implemented.

Evidence anchor: `Teacher` model, `src/app/dashboard/billing/page.tsx`, `src/app/dashboard/billing/brand-settings-form.tsx`.

---

## Phase 3 — Trust the trial

### Item 8 — Add a browser-level trial journey test
**Priority 8 · Complexity: Medium · Depends on: Item 3 (and 4)**

Prove a normal teacher can complete the MVP end to end. The audit notes no Playwright/browser-level coverage exists.

Scope (Playwright / e2e setup):
- One journey test: register → login → add payer → add pupil → run and approve the smooth-payment calculation → issue/download invoice → record payment → see outstanding balance.
- Run it against the trial DB configuration from Item 1.

Acceptance criteria:
- The full journey passes headless in CI against the trial database.
- The test asserts the calculator's monthly figure equals the invoice figure equals the ledger figure.

Evidence anchor: Part 4 gap — "Browser-level Playwright flows" absent.

### Item 9 — Add feedback collection
**Priority 9 · Complexity: Small · Depends on: Item 5**

A trial that produces no learning is wasted. Landing-page vote components exist, but there's no in-app feedback workflow.

Scope (dashboard + coming-soon area):
- Let a teacher rate each coming-soon feature (Essential / Useful / Not important) and leave a comment, using the questions already drafted in Part 6.
- Store responses against the teacher for later review.

Acceptance criteria:
- A teacher can rate the eight coming-soon features and submit free-text feedback from inside the app.
- Responses are persisted and retrievable.

Evidence anchor: Part 6 coming-soon feature list and follow-up questions.

### Item 10 — Prepare seed/demo separation and privacy checklist
**Priority 10 · Complexity: Medium · Depends on: Item 1 · Runs parallel to Phase 1**

Real pupil and parent data needs trust. The audit flags demo/real data separation as "unclear" and delete/export as "not found."

Scope (seed scripts, data tooling, docs):
- Clearly label demo data and keep it out of real trial accounts.
- Document (or implement a minimal) data export and deletion path for a teacher's pupil/payer data.
- Write a short privacy checklist confirming the permission hardening from Item 7 covers the surfaces holding real data.

Acceptance criteria:
- Demo data is visibly distinguished from real data and never mixed into a trial account.
- A documented export/delete policy exists; ideally a basic export is available.
- The privacy checklist is signed off before real data is entered.

Evidence anchor: Part 7 checklist rows — demo separation, delete/export, privacy suitability.

---

## Sequenced backlog (single view)

| # | Objective | Phase | Complexity | Depends on | Key acceptance |
|---:|---|---|---|---|---|
| 1 | Apply & verify auth migrations on trial DB | 0 | Small | — | `migrate deploy` clean; login/logout proven; tests green on trial DB |
| 2 | Define core billing calculation model | 1 | Large | 1 | `30×£32=£960÷12=£80` reproduced; approval writes immutable snapshot |
| 3 | Build transparent calculator UI | 1 | Large | 2 | Teacher sees working, approves; one figure everywhere |
| 4 | Durable invoice records & numbering | 1 | Large | 2 | Unique number + frozen line items; re-download identical |
| 5 | Simplify trial navigation | 2 | Medium | 2–4 | Only core/supporting links visible; coming-soon separated |
| 6 | Business / invoice settings | 2 | Medium | 4 | Sender details appear on invoices |
| 7 | Harden core permissions | 0 | Medium | 1 | Core routes use helpers; tenant tests pass |
| 8 | Browser-level trial journey test | 3 | Medium | 3, 4 | Full journey passes; figures reconcile |
| 9 | Feedback collection | 3 | Small | 5 | Teacher rates 8 features + comment; stored |
| 10 | Seed/demo separation & privacy | 3 | Medium | 1 | Demo labelled; export/delete documented |

---

## What is explicitly out of scope for this MVP

Kept in the codebase but hidden or deferred, per the audit: multi-teacher organisations, group/shared lessons, add-ons, gift cards, promo codes, courses, advanced timetable generation, public display screens, resource library, curriculum templates, equipment loans, certifications, incidents, lone-worker safety, maintenance tracking, Stripe automation, Gmail sending, calendar sync, and the full-breadth parent portal. The parent portal, Stripe payments, calendar sync and lesson notes appear only in a labelled "Coming soon — rate this" area (Items 5 and 9).

## Trial exit criteria (how we know we moved off 42/100)

- A non-developer teacher completes register → invoice → payment unaided on the trial DB.
- The monthly figure a teacher sees is transparently derived and matches the invoice and ledger.
- An issued invoice is immutable and re-downloadable.
- Only core features are visible; coming-soon items are separated and rateable.
- Real pupil/parent data is protected by helper-based permissions with tenant tests, and demo data is separated.
