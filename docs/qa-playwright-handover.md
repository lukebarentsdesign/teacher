# QA Handover — TeachBase (formerly Learnio), for Playwright testing

Written 2026-07-22, after a module-separation/paywall build-and-audit pass. This doc is for
another AI agent picking this codebase up cold to run Playwright against it. Read this before
touching anything — it tells you what's real, what's fragile, and what to actually point tests at.

**Source of truth for everything else:** [CLAUDE.md](../CLAUDE.md) at the repo root. It's long but
current — architecture, every feature built, every non-obvious design decision. This doc doesn't
repeat that; it's the delta you need to actually run tests.

---

## 1. Running it locally

```
npm install
node scripts/run-next-dev.js     # NOT `npm run dev` directly — see why below
```

- **Don't launch via a bare `next dev`/`npm run dev` invocation from a wrapper that changes cwd.**
  `scripts/run-next-dev.js` exists specifically to fix Tailwind CSS silently producing zero
  utility classes when the dev server's cwd doesn't match the project root. If you ever see an
  unstyled black-text-on-white page that otherwise works, this is the first suspect — check
  `.next/static/css/app/layout.css` for `.rounded-lg` or similar before assuming a real bug.
- Server runs on `http://localhost:3000` (or the next free port — check the terminal output, it
  auto-increments if 3000 is taken by a stale process).
- **If the dev server crashes on first page load with `ReferenceError: __dirname is not defined`
  pointing at `tailwind.config.ts`:** this was hit and fixed today (commit `66fe21a`) — Node 24's
  `require(esm)` interop path sometimes loads that config as a real ES module. If it recurs, `rm
  -rf .next` and restart; if that doesn't fix it, the fix pattern is in `tailwind.config.ts` and
  mirrors `postcss.config.mjs` (use `import.meta.url`, not `__dirname`).
- **Multiple stale dev-server processes on different ports is a real trap** — if you restart
  without killing the old one, Next auto-picks the next free port (3001, 3002...) and you'll test
  against the wrong instance silently. On Windows: `netstat -ano | grep LISTENING | grep ":300"`
  then `taskkill //PID <pid> //F`.

## 2. Environment

`.env` should already exist locally with a working `DATABASE_URL` (Supabase). Copy from
`.env.example` if not. Two things worth knowing:

- **`PAYWALL_ENFORCED`** — leave unset/empty. This is the module-paywall kill switch (see §4). If
  it's set to `"true"`, every teacher account created after 2026-07-20T13:43 UTC with
  `isPaidTier: false` gets locked out of all 8 optional modules, which will break most flows
  Playwright would otherwise exercise. Confirm it's not set before running any test suite:
  `grep PAYWALL_ENFORCED .env` should return nothing or an empty value.
- No Stripe/Gmail/Google credentials are required for the flows described below — those
  integrations degrade gracefully (see CLAUDE.md's Stripe/Gmail sections) and aren't gated by
  anything Playwright-relevant.

## 3. Test accounts

**Do not look for credentials on the `/login` page — they used to be displayed there in plain
text and pre-filled into the form; that was deliberately removed today (commit `f2a3a2c`) because
it's a page anyone can reach.** Use these instead:

| Account | Email | Password | Notes |
|---|---|---|---|
| Main seeded teacher | `teacher@example.com` | `changeme123` | Full realistic dataset: students, payers, lessons, curriculum, term calendars, group classes, gift cards, etc. Already a member of an Organisation ("Learnio Collective" — name predates the rebrand, cosmetic only). |
| Cover teacher | `cover.teacher@example.com` | `cover12345` | Second seeded account, exists for testing Organisation cover-assignment flows against the main teacher. |
| Guardian/parent microsite | 6-digit code `410001` | — | Rachel Bennett, guardian of student Ava Bennett (`cmrs8n2di001az8cv3zwg101e`). Log in at `/parent/login`. Ava has real curriculum data (`StudentCurriculum` with 2 sections, one completed, one in-progress) — use this account to test the `/parent/students/[id]/progress` page. |

Both teacher accounts pre-date the paywall's grandfather cutoff in spirit, but **be aware**:
`prisma/seed.ts` doesn't set `createdAt` explicitly, so every `npm run db:seed` run resets it to
"now." If someone reseeds after `PAYWALL_ENFORCED=true` is ever set for real, these accounts could
silently lose grandfathered status. Not a Playwright concern today since the paywall is bypassed,
but flag it if you're asked to test the paywall itself later.

To create a fresh, disposable teacher account for a test run:
```
POST http://localhost:3000/api/auth/sign-up/email
Content-Type: application/json
{"email":"<anything>@example.com","password":"<8+ chars>","name":"Whatever"}
```
This is Better Auth's own endpoint (not NextAuth, despite what older docs say — see CLAUDE.md's
note on this). Returns a session cookie directly; no email verification required to use the app.

## 4. What was just built: the module-separation system

The app is split into a **Foundation** (Student, Payer, StudentPayerLink, TeachingLocation,
LessonType, Contract, Quick Invoice/billing core, the whole parent microsite) that is **never**
gated, plus **8 optional modules**: `ORGANISATION`, `TERM_CALENDARS`, `SCHEDULING`, `CURRICULUM`,
`COMPLIANCE`, `EMBEDS`, `COMMERCE`, `GROUP_TEACHING`. Single source of truth:
[src/lib/modules.ts](../src/lib/modules.ts) — `MODULE_REGISTRY` documents exactly what each module
covers and why, `hasModule()`/`requireModule()`/`getEnabledModules()` are the only sanctioned way
to check access.

**Right now, with `PAYWALL_ENFORCED` unset, every teacher has every module enabled.** This is
intentional and safe for general Playwright coverage — you don't need to think about module
gating unless you're specifically testing it.

**Explicit safety carve-out, will never be gated, don't write a test expecting otherwise:**
instructor certifications (`/dashboard/certifications`), incident logs (`/dashboard/incidents`),
and student medical notes are permanently ungated by product decision, on every plan.

### If you're asked to test the gating itself

There's no UI for a teacher to lock/unlock their own modules yet (no billing/plan-selection flow
wired to `TeacherModuleAccess` — `/dashboard/upgrade` is a static pitch page, doesn't actually
transact). To simulate a locked module for a test account, insert directly:

```sql
INSERT INTO "TeacherModuleAccess" (id, "teacherId", "moduleKey", status, "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, '<teacherId>', 'ORGANISATION', 'LOCKED', now(), now())
ON CONFLICT ("teacherId", "moduleKey") DO UPDATE SET status = 'LOCKED';
```
(`teacherId` == the `id` on the `Teacher` row, same as the Better Auth `user.id` — there's a 1:1
bridge, see CLAUDE.md's Better Auth migration notes.) Run via a `pg` client against
`DATABASE_URL` — `prisma db execute` works for this but doesn't print `SELECT` results, so use raw
`pg` if you need to read anything back. Clean up test rows afterward:
`DELETE FROM "TeacherModuleAccess" WHERE "teacherId" = '<id>'`.

**Every module's primary "create new" entry point AND at least one secondary "add to an existing
record" action are correctly gated in the UI as of commits `9c42a42` and `403d035`** (locked
message replaces the form; server action independently refuses too). If Playwright finds one that
isn't, that's a real regression worth reporting, not a known gap — the known gaps were fixed.
The one deliberately-ungated category: actions that *use* something that already exists (redeem a
gift card, apply a promo code, book an existing add-on, enroll in/book an existing group class,
check out an existing loanable item, purchase an existing course) — these must stay clickable even
when the owning module is locked. Don't flag those as bugs.

## 5. Suggested Playwright coverage, roughly priority-ordered

1. **Auth**: register → onboarding wizard → dashboard; login/logout; parent 6-digit code login.
2. **Foundation CRUD**: create/edit a Student (via the multi-step wizard, not a flat form — it was
   removed), create/edit a Payer, create a TeachingLocation, create a LessonType, accept a
   Contract as a guardian.
3. **Core money flow**: Quick Invoice create → PDF download → mark paid; ledger balance updates
   correctly on the parent microsite.
4. **Each module's primary create flow** (with the seeded teacher, since paywall is bypassed):
   timetable generation (`/dashboard/timetable/new` and `/bulk`), term calendar + term/holiday
   periods, curriculum template + sections, cancellation policy, embed config, add-on/gift
   card/promo code, group class + session plan, Organisation invite generate-and-accept
   (needs the second cover-teacher account to actually accept).
5. **Parent microsite**: calendar, ledger, notes, Courses tab, **Progress tab** (new — verify it
   renders curriculum completion for Ava Bennett as described in §3), extras.
6. **Landing page** (`/`): confirm the `#modules` section renders all 8 module cards + Foundation
   card, and the `#pricing` section's three tiers.
7. **If explicitly asked to test the paywall**: use the LOCKED-row technique in §4 with a
   freshly-created (post-cutoff) throwaway teacher, not the seeded accounts — see the
   grandfathering caveat in §3.

## 6. Known non-issues (don't file these as bugs)

- Organisation's org name is "Learnio Collective" in seed data — cosmetic leftover from before the
  TeachBase rebrand, not a bug.
- `/dashboard/upgrade` doesn't actually charge anything or change `isPaidTier` — it's a static
  pitch page, no Stripe Checkout wired to it yet.
- `addCoverAssignmentAction` (on a Lesson, for logging teacher cover) has no module gate at all —
  confirmed intentional, it's "using an already-established org relationship," same bucket as
  redeeming a gift card.
- Dev-mode pages may show verbose RSC debug payloads (raw SQL text, internal component names) in
  page source when curl'd directly without a browser — this is normal Next.js dev-mode behavior,
  not a leak; production builds don't do this.

## 7. Recent commit log for context (newest first)

```
f2a3a2c chore: remove demo credentials from the login page
66fe21a feat: add pre-launch bypass for the module paywall, fix tailwind config crash
b9e5692 chore: commit pending local updates          (external — rebrand + isPaidTier paywall landed here)
343fe59 fix: trust alternate local auth origin
403d035 fix: gate organisation invite acceptance on the invitee's own module access
9c42a42 fix: reflect module-gating in UI for secondary create actions
0ff7fef feat: rebuild landing page around the real Foundation + Modules architecture
dcb82d7 feat: add Group Teaching as a gated module (final module)
```
Everything from `b821880` (module entitlement system) through `403d035` is the module-separation
build-and-fix arc referenced throughout this doc.
