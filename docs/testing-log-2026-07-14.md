# TeachBase Testing Log - 2026-07-14

## Scope

Testing was run against the seeded `teacher@example.com` account after expanding `prisma/seed.ts` into a fuller demo dataset for dashboard, billing, scheduling, parent, and operations flows.

## Database setup used

- Supabase Shared Pooler connection string in local `.env`
- All Prisma migrations applied successfully
- Seed run completed successfully

## Automated checks completed

### Unit tests

Command run:

```powershell
npm.cmd test -- --runInBand
```

Result:

- 17 test suites passed
- 117 tests passed

### Production build

Command run:

```powershell
npm.cmd run build
```

Result:

- Build passed
- Prisma migrate deploy reported no pending migrations
- Prisma generate passed
- Next.js built all app routes successfully

### Route availability checks

Verified successfully:

- `/login`
- `/register`
- `/parent/login`

Each returned HTTP 200 locally.

## Browser smoke testing

Playwright was installed for smoke-test work and smoke scripts were added under `smoke/`.

Current status:

- Browser launch succeeded
- End-to-end teacher automation is not yet reliable

Known blocker:

- Headless teacher login did not complete reliably through the credentials flow
- Programmatic NextAuth login exploration also showed `/api/auth/csrf` returning HTTP 500 from the local app during automation attempts

Because of that blocker, browser-driven coverage is partial and this test log should be read as:

- strong unit and build coverage
- seeded demo-data validation
- incomplete full end-to-end browser coverage

## Seeded data summary

The seeded teacher account now includes:

- multiple teaching locations and rooms
- lesson types and subjects
- active, pending-review, and declined students
- payers, split billing, self-pay, and emergency-contact-only records
- subscriptions, ledger entries, payments, and package data
- lessons, check-ins, no-show and make-up data
- group classes and bookings
- curriculum, assignments, resources, loans, maintenance, certifications, incidents
- gift cards, promo codes, embeds, courses, mileage, travel times, waitlist, and organisation data

## Follow-up recommended

- Fix the local auth/browser automation path so the smoke runner can complete teacher and parent flows end to end
- Once that is stable, rerun the smoke scripts and append the results here
