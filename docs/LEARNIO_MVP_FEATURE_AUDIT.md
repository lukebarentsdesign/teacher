# Learnio MVP Feature Audit

## Executive summary

Learnio is a large Next.js application with many teacher, parent, timetable, billing, learning-resource and organisation features already represented in code. The repository is much broader than the original MVP promise: helping a self-employed music teacher organise pupils, lessons and smooth monthly invoicing.

The strongest built areas are pupil and payer records, lesson/timetable data, ledger-based balances, manual payment recording, PDF invoice download from ledger entries, teacher dashboard pages, parent microsite access codes, and a good set of unit/integration tests around calculations and access boundaries.

The weakest area is also the central MVP promise: the product does not yet guide a teacher through a transparent smooth-monthly-payment calculation such as `30 lessons x £32 = £960 / 12 = £80`, review the result, create durable invoice records, and preserve historical invoice accuracy. The data model stores a `Subscription.annualFee` and `billingModel`, and backend code can derive lesson value in some cases, but the workflow is not a complete user-facing calculator or invoicing system.

The application is not ready for a genuine two-week trial with real pupil and parent data without narrowing the visible scope. It can be trialled as an early prototype if incomplete areas are hidden and the trial is framed around pupil/payer setup, simple subscription records, PDF invoice download, manual payment recording, and feedback on planned features.

## What Learnio can genuinely do today

- Let a teacher register, log in, and reach a dashboard.
- Add and edit payers with contact details and parent access codes.
- Add pupils with payer relationships, source/status, location, date of birth, subject tags, and access settings.
- Create teaching locations, rooms, term calendars, lesson types, subjects, group classes and lessons.
- Create a simple subscription record for a pupil and payer with a billing model and fee.
- Record manual payments as ledger entries.
- Generate a PDF invoice-style document from existing ledger entries.
- Show dashboard summaries, income forecasts, route checks, today views, calendars and many operational panels.
- Provide a parent microsite with code-based access to selected student information, ledger, notes, resources, calendar and extras.
- Run a Jest suite covering calculations, route boundaries, auth migration contracts, tenant boundaries and utility logic.

## What prevents the smooth-invoicing MVP from being trialled

1. Smooth monthly tuition is not a guided end-to-end workflow. The current subscription form asks for an `annualFee`; it does not calculate from lesson count, price, months, start/end boundaries, trial lessons or adjustments.
2. There is no durable `Invoice` model or invoice numbering. The PDF endpoint renders a document directly from ledger entries.
3. Historical invoice accuracy is not guaranteed because invoice snapshots and line items are not stored.
4. The default configured database schema has not applied the latest auth migration; tests pass only against a disposable migrated schema.
5. The visible navigation exposes many advanced or partially implemented features that could distract or confuse a two-week teacher trial.

## Recommended MVP scope

For the first trial, focus on:

- teacher login/register;
- basic teacher profile and billing settings;
- payers and pupils;
- teaching locations;
- simple lesson types;
- term calendar setup only if needed;
- manual subscription amount entry with transparent notes;
- ledger balance;
- PDF invoice download;
- manual payment recording;
- simple income dashboard;
- feedback prompts for coming-soon features.

Hide or label as coming soon: multi-teacher organisations, group courses, add-ons, gift cards, advanced timetable generation, school/venue display screens, resource library, equipment loans, Stripe payments, Gmail sending, parent portal breadth, certifications, incidents, lone-worker safety and maintenance tracking.

## Recommended Coming Soon features

1. Parent portal for invoices and lesson notes.
2. Automatic Stripe payment links.
3. Google/Outlook calendar sync.
4. Automated payment reminders.
5. Lesson notes and shared resources.
6. School timetable tools.
7. Shared/group lessons.
8. Equipment loans.

## Trial readiness score

**42 / 100**

This score reflects a strong codebase with many useful foundations, but a central MVP workflow that is not yet coherent enough for non-developer teachers to complete without guidance.

---

# Part 1: Application and architecture summary

## Framework and stack

- Next.js App Router with React and TypeScript.
- Prisma 7 with PostgreSQL, using `@prisma/adapter-pg`.
- Better Auth is being introduced, with a legacy callable `auth()` compatibility bridge.
- Jest with `ts-jest` for unit and integration tests.
- Stripe, Resend/Gmail-related code, PDF generation via `pdf-lib`, and calendar/ICS helpers.
- Styling is Tailwind-style utility classes.

Evidence:

- `package.json`
- `src/app`
- `src/auth.ts`
- `src/lib/db.ts`
- `prisma/schema.prisma`
- `jest.config.ts`

## Main application areas

- Public landing page: `/`
- Teacher auth: `/register`, `/login`
- Teacher onboarding: `/onboarding`
- Teacher dashboard: `/dashboard`
- Pupil, payer and subscription management under `/dashboard/students`, `/dashboard/payers`, `/dashboard/subscriptions`
- Timetable, lessons, term calendars, teaching locations and route planning
- Billing, payments, forecasts, accounting export and tax pack
- Parent microsite: `/parent`
- Self-serve student onboarding: `/onboard/[teacherId]`, `/onboard/embed/[token]`
- Public display screen: `/display/[token]`
- Payment return page: `/pay/[subscriptionId]`

## Current user types

- Teacher: primary dashboard user.
- Parent/guardian/payer: code-based microsite user.
- Student: optional independent microsite user if aged 16+.
- Organisation owner/instructor: represented in the model and UI but not yet central to the MVP.
- Platform administrator: represented by Better Auth admin plugin fields, but not a full visible product area.

## Authentication and organisation membership

Teacher authentication is in transition from legacy auth assumptions to Better Auth. `src/auth.ts` exports a callable `auth()` wrapper so old `await auth()` call sites keep working. The exact return shape is Better Auth `api.getSession`: authenticated requests return session/user data; unauthenticated, expired and revoked sessions return `null`.

Organisation membership exists in two layers:

- Product-level `Organisation`, `OrganisationInvite`, `Teacher.organisationId`, `Teacher.role`.
- Better Auth organisation plugin models: `AuthOrganization`, `AuthMember`, `AuthInvitation`, plus `Session.activeOrganizationId`.

The app still mostly authorises by `teacherId`, not by organisation-wide shared rosters.

Evidence:

- `src/auth.ts`
- `src/lib/auth-helpers.ts`
- `src/lib/permission-helpers.ts`
- `prisma/schema.prisma`
- `__tests__/auth-bridge-contract.test.ts`
- `__tests__/tenant-isolation.test.ts`
- `__tests__/domain-boundaries.test.ts`

## Principal domain relationships

Plain-English model:

- A `Teacher` owns most operational data.
- A `Student` belongs to one teacher.
- A `Payer` belongs to one teacher.
- `StudentPayerLink` connects pupils and payers.
- A `Subscription` connects a student and payer and carries billing model/fee information.
- `LedgerEntry` records charges, payments, adjustments and lesson-related debits/credits.
- `Payment` records Stripe payment references, but manual payment recording mainly posts ledger entries.
- `Lesson` belongs to student, teacher and location.
- `LessonNote`, `Resource`, `Assignment`, `Assessment` and curriculum models hang off lessons/students.
- `TeachingLocation`, `Room`, `TermCalendar` and related models support scheduling.
- `Contract` and `ContractAcceptance` support parent terms.
- Better Auth models store users, sessions, accounts and organisation plugin state.

## Assumptions currently present

| Assumption | Current state |
|---|---|
| One self-employed teacher | Strongly supported; most data is scoped by `teacherId`. |
| Several teachers in one organisation | Partially represented; not ready as core MVP. |
| Schools | Represented as teaching locations and invoicing targets. |
| Venues | Represented through location types, rooms, venue fees and route/travel tools. |
| Parents and pupils | Strongly represented through payers, students and microsite sessions. |
| Platform administrators | Better Auth role fields exist; product UI is unclear/incomplete. |

## Important Prisma models

| Model | Purpose |
|---|---|
| `Teacher` | The main business owner/teacher profile and tenant boundary. |
| `Student` | A pupil taught by a teacher. |
| `Payer` | A parent, guardian, self-paying adult student or billing contact. |
| `StudentPayerLink` | Links pupils to one or more payers. |
| `Subscription` | Stores billing model, fee, payer, pupil, status and dates. |
| `LedgerEntry` | Append-only financial movements: lessons, payments, credits and adjustments. |
| `Payment` | Stripe payment record for checkout/webhook flows. |
| `TeachingLocation` | School, student home, teacher base, venue, online or other location. |
| `TermCalendar`, `TermPeriod`, `HolidayPeriod` | Term and holiday configuration. |
| `LessonType` | Teacher-defined lesson offer/pricing metadata. |
| `Lesson` | A scheduled lesson. |
| `LessonNote` | Per-lesson teaching notes. |
| `MakeUpLesson` | Tracks owed and redeemed make-up lessons. |
| `GroupClass` | Recurring group class configuration. |
| `Room` | Room inside a teaching location. |
| `Resource`, `Assignment` | Shared learning materials and homework. |
| `Contract`, `ContractAcceptance` | Parent contract text and accepted snapshot. |
| `Organisation`, `OrganisationInvite` | Product-level multi-teacher organisation support. |
| `User`, `Session`, `Account`, `Verification` | Better Auth core models. |
| `AuthOrganization`, `AuthMember`, `AuthInvitation` | Better Auth organisation plugin models. |

---

# Part 2: Route and navigation inventory

This table is based on repository inspection and automated tests. It is not a full browser QA pass for every screen.

| Route | Intended user | Purpose | Reachable from UI? | Loads successfully? | Uses real data? | Auth protected? | Status |
|---|---|---:|---:|---:|---:|---:|---|
| `/` | Public | Landing page | Yes | Likely | Static/marketing | No | Working with limitations |
| `/register` | Teacher | Create teacher account | Yes | Likely | Real DB action | No | Working with limitations |
| `/login` | Teacher | Teacher login | Yes | Likely | Real auth | No | Working with limitations |
| `/onboarding` | Teacher | Teacher onboarding wizard | Redirected after auth | Likely | Real teacher data | Yes | Working with limitations |
| `/dashboard` | Teacher | Main dashboard | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/students` | Teacher | List pupils | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/students/new` | Teacher | Add pupil wizard | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/students/[id]` | Teacher | Pupil detail | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/students/[id]/edit` | Teacher | Edit pupil | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/students/pending` | Teacher | Review self-serve submissions | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/payers` | Teacher | List payers | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/payers/new` | Teacher | Add payer | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/payers/[id]` | Teacher | Payer detail | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/payers/[id]/edit` | Teacher | Edit payer | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/subscriptions/[id]` | Teacher | Subscription ledger/payment page | From pupil detail | Likely | Real data | Yes | Working with limitations |
| `/dashboard/subscriptions/[id]/cancel` | Teacher | Cancel subscription | From subscription | Likely | Real action | Yes | Working with limitations |
| `/api/subscriptions/[id]/invoice` | Teacher/parent | Download invoice PDF | From UI | Tested partly | Real ledger | Mixed | Working with limitations |
| `/dashboard/payments` | Teacher | Stripe Connect/payment setup | Yes | Likely | Real Stripe state | Yes | Partially implemented |
| `/pay/[subscriptionId]` | Parent/payer | Payment return | Link only | Likely | Minimal | No | Placeholder/partial |
| `/dashboard/billing` | Teacher | Stripe plan, Gmail, brand settings | Yes | Likely | Real teacher data | Yes | Working with limitations |
| `/dashboard/forecast` | Teacher | Income/expense forecast | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/accounting-export` | Teacher | Export accounting CSV | Not clearly in sidebar | Likely | Real data | Yes | Backend/UI partial |
| `/api/accounting-export` | Teacher | CSV export | From export page/API | Tested | Real ledger | Yes | Working with limitations |
| `/dashboard/tax-pack` | Teacher | Tax summary page | Yes | Likely | Real data | Yes | Working with limitations |
| `/api/tax-pack` | Teacher | Tax export | From page | Unclear | Real data | Yes | Working with limitations |
| `/dashboard/teaching-locations` | Teacher | Locations list | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/teaching-locations/new` | Teacher | Add location | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/teaching-locations/[id]` | Teacher | Location detail | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/teaching-locations/[id]/edit` | Teacher | Edit location | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/teaching-locations/[id]/rooms/[roomId]` | Teacher | Room detail/edit | From location | Likely | Real data | Yes | Working with limitations |
| `/dashboard/term-calendars` | Teacher | Term calendars | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/term-calendars/[id]` | Teacher | Term calendar detail | From list/location | Likely | Real action | Yes | Working with limitations |
| `/dashboard/lesson-types` | Teacher | Lesson type list | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/lesson-types/[id]` | Teacher | Lesson type/pricing detail | From list/location | Likely | Real data | Yes | Working with limitations |
| `/dashboard/subjects` | Teacher | Subject labels | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/lessons` | Teacher | Lessons list | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/lessons/[id]` | Teacher | Lesson detail/attendance/notes | From lessons/calendar | Likely | Real data | Yes | Working with limitations |
| `/api/lessons/[id]/ics` | Teacher/parent/student | Download lesson ICS | From lesson/portal | Tested | Real lesson | Mixed | Working with limitations |
| `/dashboard/timetable/new` | Teacher | Create timetable lesson | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/timetable/bulk` | Teacher | Bulk timetable generator | Yes | Tests exist | Real action | Yes | Working with limitations |
| `/dashboard/timetable/preview` | Teacher | Preview generated timetable | From bulk | Likely | Real temp/action | Yes | Working with limitations |
| `/dashboard/route-check` | Teacher | Route/travel feasibility | Yes | Tests exist | Real data | Yes | Working with limitations |
| `/dashboard/travel-times` | Teacher | Travel time rules | Linked from route check | Likely | Real action | Yes | Working with limitations |
| `/dashboard/unavailability` | Teacher | Teacher unavailable times | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/unavailability/new` | Teacher | Add unavailability | From page | Likely | Real action | Yes | Working with limitations |
| `/dashboard/unavailability/preview` | Teacher | Preview impact | From page | Likely | Real action | Yes | Working with limitations |
| `/dashboard/absences` | Teacher | Missed lessons/make-up credits | Yes | Tests around ledger | Real action | Yes | Working with limitations |
| `/dashboard/cancellation-policy` | Teacher | Cancellation rules | Yes | Tests exist | Real action | Yes | Working with limitations |
| `/dashboard/today` | Teacher | Today view | Yes | Likely | Real data | Yes | Working with limitations |
| `/api/today` | Teacher | Today data | Used by UI/API | Unclear | Real data | Yes | Working with limitations |
| `/dashboard/group-classes` | Teacher | Group class list | Yes | Tests exist | Real data | Yes | Working with limitations |
| `/dashboard/group-classes/[id]` | Teacher | Group class detail/bookings | From list/location | Likely | Real data | Yes | Working with limitations |
| `/dashboard/group-classes/[id]/edit` | Teacher | Edit group class | From detail | Likely | Real action | Yes | Working with limitations |
| `/dashboard/assignments` | Teacher | Homework list | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/assignments/new` | Teacher | New homework | From list | Likely | Real action | Yes | Working with limitations |
| `/dashboard/resources` | Teacher | Resource library | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/resources/new` | Teacher | Add resource | From resources | Likely | Real action | Yes | Working with limitations |
| `/dashboard/curriculum-templates` | Teacher | Curriculum templates | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/curriculum-templates/[id]` | Teacher | Template detail | From list | Likely | Real action | Yes | Working with limitations |
| `/dashboard/contract` | Teacher | Parent contract editor | Yes | Likely | Real action | Yes | Working with limitations |
| `/parent/login` | Parent/student | Access code login | Yes/linked | Likely | Real codes | No | Working with limitations |
| `/parent` | Parent/student | Portal landing/redirect | After login | Likely | Real session | Microsite | Working with limitations |
| `/parent/students/[studentId]` | Parent/student | Portal dashboard | After login | Likely | Real data | Microsite | Working with limitations |
| `/parent/students/[studentId]/ledger` | Parent | Balance/ledger | Portal nav | Likely | Real ledger | Microsite | Working with limitations |
| `/parent/students/[studentId]/calendar` | Parent/student | Student calendar | Portal nav | Likely | Real lessons | Microsite | Working with limitations |
| `/parent/students/[studentId]/notes` | Parent/student | Lesson notes | Portal nav | Likely | Real notes | Microsite | Working with limitations |
| `/parent/students/[studentId]/resources` | Parent/student | Shared resources | Portal nav | Likely | Real resources | Microsite | Working with limitations |
| `/parent/students/[studentId]/assignments` | Parent/student | Homework | Portal nav | Likely | Real assignments | Microsite | Working with limitations |
| `/parent/students/[studentId]/classes` | Parent/student | Group sessions | Portal nav | Likely | Real classes | Microsite | Working with limitations |
| `/parent/students/[studentId]/extras` | Parent/student | Add-ons/extras | Portal nav | Likely | Real data | Microsite | Partially implemented |
| `/parent/students/[studentId]/courses` | Parent/student | Courses | Portal nav | Likely | Real data/Stripe | Microsite | Partially implemented |
| `/parent/students/[studentId]/maintenance` | Parent/student | Maintenance reminders | Portal nav | Likely | Real data | Microsite | Working with limitations |
| `/parent/contract` | Parent | Accept contract | From payment/portal | Likely | Real contract | Microsite | Working with limitations |
| `/parent/contract/pdf` | Parent | Download contract PDF | From contract | Unclear | Real contract | Microsite | Working with limitations |
| `/onboard/[teacherId]` | Public parent/student | Self-serve enquiry | Share link | Likely | Real teacher config | No | Working with limitations |
| `/onboard/embed/[token]` | Public embedded | Embedded enquiry | Share/embed | Likely | Real embed config | No | Working with limitations |
| `/display/[token]` | Venue/public display | Now/next plan display | Share link | Likely | Real token | Token | Working with limitations |
| `/dashboard/embeds` | Teacher | Configure public enquiry embeds | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/waitlist` | Teacher | Timetable waitlist | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/referrals` | Teacher | Referral reporting | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/menu-choices` | Teacher | Custom dropdown options | Linked from location forms | Likely | Real action | Yes | Working with limitations |
| `/dashboard/organisation` | Teacher/org | Organisation setup/invites | Yes | Likely | Real action | Yes | Partially implemented |
| `/dashboard/organisation/join/[token]` | Teacher | Join organisation invite | Link only | Likely | Real action | Yes | Partially implemented |
| `/dashboard/checkin` | Teacher | IG card check-in scanner | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/loans` | Teacher | Equipment loans | Yes | Likely | Real data | Yes | Working with limitations |
| `/dashboard/loans/new` | Teacher | Add equipment | From loans | Likely | Real action | Yes | Working with limitations |
| `/dashboard/maintenance` | Teacher | Maintenance reminders | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/certifications` | Teacher | Certifications | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/incidents` | Teacher | Safeguarding/incident logs | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/gift-cards` | Teacher | Gift cards | Yes | Tests for promo not gift card | Real action | Yes | Partially implemented |
| `/dashboard/promo-codes` | Teacher | Promo codes | Yes | Tests exist | Real action | Yes | Working with limitations |
| `/dashboard/addons` | Teacher | Add-ons/extras | Yes | Likely | Real action | Yes | Working with limitations |
| `/dashboard/courses` | Teacher | Sellable course content | Yes | Likely | Real action/Stripe | Yes | Partially implemented |
| `/dashboard/courses/[id]` | Teacher | Course detail | From courses | Likely | Real action | Yes | Partially implemented |
| `/dashboard/mileage` | Teacher | Mileage log | Yes | Tests exist | Real action | Yes | Working with limitations |
| `/dashboard/out-of-scope-signups` | Teacher/internal | Out-of-scope lead list | Not clearly nav | Likely | Real data | Yes | Legacy/unclear |
| `/api/gmail/connect` | Teacher | Gmail OAuth start | Billing page | Unclear | External OAuth | Yes | Partially implemented |
| `/api/gmail/callback` | Teacher | Gmail OAuth callback | OAuth only | Unclear | External OAuth | Yes | Partially implemented |
| `/api/search` | Teacher | Global search | Header search | Unclear | Real data | Yes | Working with limitations |
| `/api/webhooks/stripe` | Stripe | Stripe webhook | No UI | Unclear | External webhook | Secret | Backend only |
| `/api/auth/[...all]` | Auth | Better Auth handler | Framework | Unclear | Real auth | No | Partially implemented |
| `/api/auth/[...nextauth]` | Auth | Legacy auth route | Framework | Unclear | Real auth | No | Legacy/unclear |

Routes that exist but are not clearly first-level navigation include accounting export, organisation join, onboarding/embed share links, display token, pay return, out-of-scope signups, webhook routes and several dynamic detail/edit pages.

Navigation currently exposes many features that are not central to a two-week smooth-invoicing trial: courses, gift cards, add-ons, incidents, certifications, equipment loans, check-in, organisation, group classes, resource centre, curriculum templates and advanced timetable tools.

---

# Part 3: Feature-by-feature audit

## Teacher account creation

**Current state:** Working with limitations

**What currently works:** Register and login pages exist with server actions. Better Auth migration bridge is documented and contract-tested.

**What does not work or is missing:** The auth system is in migration. Plain tests against the default configured database fail because the latest auth tables are not applied there. Password reset and email verification are not proven as user flows.

**Evidence:** `src/app/register`, `src/app/login`, `src/auth.ts`, `src/app/api/auth/[...all]/route.ts`, `__tests__/auth-bridge-contract.test.ts`, `__tests__/auth-migration.test.ts`.

**MVP recommendation:** Include now, but verify on the actual trial database.

**Work required before trial:** Apply migrations, create a clean trial account path, test logout and password recovery expectations.

## Teacher profile, business details and branding

**Current state:** Working with limitations

**What currently works:** Teacher has name/email, Stripe/platform status, branding fields and emergency contact fields. Billing page includes brand settings and Gmail/Stripe panels.

**What does not work or is missing:** Invoice details, bank payment instructions, VAT/tax settings and invoice numbering are not complete product concepts.

**Evidence:** `Teacher` model, `src/app/dashboard/billing/page.tsx`, `src/app/dashboard/billing/actions.ts`, `src/app/dashboard/billing/brand-settings-form.tsx`.

**MVP recommendation:** Simplify.

**Work required before trial:** Add a small “business/invoice details” form or hide claims about professional invoice configuration.

## Subscription or plan status

**Current state:** Partial

**What currently works:** `Teacher.platformStatus`, Stripe customer/subscription IDs and billing page states exist.

**What does not work or is missing:** Trial billing state is not central to teacher invoicing MVP and may distract testers.

**Evidence:** `Teacher.platformStatus`, `src/app/dashboard/billing/page.tsx`.

**MVP recommendation:** Internal only.

**Work required before trial:** Keep trial accounts manually provisioned or clearly label plan status as app subscription, not lesson subscription.

## Payers and families

**Current state:** Working with limitations

**What currently works:** Teachers can add/edit payers, store email/phone/contact preference/notes, generate/regenerate access codes, and link payers to pupils. Several pupils can link to one payer through `StudentPayerLink`.

**What does not work or is missing:** There is no explicit household model beyond payer links. Invoice-recipient selection exists as payer/subscription relationship rather than a polished family billing workflow.

**Evidence:** `Payer`, `StudentPayerLink`, `src/app/dashboard/payers`, `src/app/dashboard/students/[id]/link-payer-form.tsx`, `src/app/dashboard/payers/actions.ts`.

**MVP recommendation:** CORE MVP.

**Work required before trial:** Make primary payer and multi-pupil relationships clearer in the UI.

## Parent login or microsite access

**Current state:** Working with limitations

**What currently works:** Parent/student access code sessions exist, with signed cookies and portal pages.

**What does not work or is missing:** The portal is broad and may expose features not ready for trial. Permission coverage is improving but not complete for every page.

**Evidence:** `src/lib/microsite-session.ts`, `src/app/parent`, `__tests__/ics-route.test.ts`.

**MVP recommendation:** Coming soon or limited beta.

**Work required before trial:** Limit portal to invoices/ledger/calendar if exposed.

## Pupils and students

**Current state:** Working with limitations

**What currently works:** Teacher can create students, link/create payers, edit core fields, assign location, manage subjects, grant independent access and approve/decline pending submissions.

**What does not work or is missing:** No clear archive/delete pupil workflow was verified. Multi-teacher assignment is not mature.

**Evidence:** `Student`, `src/app/dashboard/students`, `src/app/dashboard/students/actions.ts`, `src/app/dashboard/students/[id]/actions.ts`.

**MVP recommendation:** CORE MVP.

**Work required before trial:** Add archive/delete clarity and simplify advanced panels.

## Teaching locations

**Current state:** Working with limitations

**What currently works:** Locations support school, student home, teacher base, hired venue, online and other. Address, term dates, term calendar, colours, access notes, rooms, links and venue fees exist.

**What does not work or is missing:** Travel and room features may be too advanced for first trial; location invoicing target exists but is not a polished invoice-recipient workflow.

**Evidence:** `TeachingLocation`, `Room`, `LocationTypeOption`, `src/app/dashboard/teaching-locations`, `src/app/dashboard/menu-choices`.

**MVP recommendation:** SUPPORTING MVP.

**Work required before trial:** Keep one simple location setup path; hide room/venue-fee complexity unless needed.

## Academic year and term setup

**Current state:** Working with limitations

**What currently works:** Term calendars, terms and holidays can be created. Teaching locations can link to term calendars.

**What does not work or is missing:** No academic-year abstraction, bank holiday import, copying terms into a new academic year, or strong link to smooth billing calculation.

**Evidence:** `TermCalendar`, `TermPeriod`, `HolidayPeriod`, `src/app/dashboard/term-calendars`.

**MVP recommendation:** SUPPORTING MVP, simplified.

**Work required before trial:** Provide a minimal “teaching weeks for this year” setup tied to calculation.

## Lesson types and prices

**Current state:** Working with limitations

**What currently works:** Lesson types, duration, lesson fee, active status, subject, online/location pricing and venue fee support exist.

**What does not work or is missing:** Shared lessons, trial lessons, price changes and per-pupil special pricing are not a coherent smooth-billing workflow.

**Evidence:** `LessonType`, `LessonTypeLocationPricing`, `VenueFeeArrangement`, `src/app/dashboard/lesson-types`.

**MVP recommendation:** CORE/SUPPORTING MVP.

**Work required before trial:** Keep one clear per-lesson price and duration flow.

## Recurring lesson arrangements

**Current state:** Working with limitations

**What currently works:** Lessons, bulk timetable generation, conflict tests, unavailability, route checks, make-up lessons and cancellation policies exist.

**What does not work or is missing:** The recurring arrangement is not yet the obvious source of truth for billing. Reschedule/cancel/missed-lesson effects exist in pieces but are not a simple MVP journey.

**Evidence:** `Lesson`, `MakeUpLesson`, `Unavailability`, `src/app/dashboard/timetable`, `src/lib/scheduling`, `__tests__/scheduling.test.ts`, `__tests__/bulk-timetable.test.ts`.

**MVP recommendation:** Simplify.

**Work required before trial:** Let teacher enter lesson count manually first; make timetable generation optional.

## Smooth monthly subscription calculation

**Current state:** Partial

**What currently works:**

- `Subscription` stores `annualFee`, `billingModel`, `startDate`, optional `endDate`, status and credit carry-forward.
- UI can create a subscription with `SMOOTHED_SUBSCRIPTION`, `PER_LESSON`, `HOURLY` or `TERMLY`.
- `deriveLessonValue` can divide stored fee over counted held lessons for smoothed/termly models, or treat fee as per-lesson/hourly rate.
- Ledger tests cover balances, payments, make-up credits and cancellation payout calculations.

**What does not work or is missing:**

- No UI that calculates `lesson count x price`.
- No UI that divides annual total over 12 months and explains the result.
- No selected-month count for term payment plans.
- No first/final month handling.
- No mid-year or mid-term proration workflow.
- No price-change history.
- No recalculation without rewriting historical invoices.
- No explicit rounding/penny-difference handling.
- No invoice snapshots.

**Evidence:** `Subscription`, `LedgerEntry`, `src/app/dashboard/students/[id]/new-subscription-form.tsx`, `src/app/dashboard/students/[id]/actions.ts`, `src/lib/ledger.ts`, `__tests__/ledger.test.ts`.

**MVP recommendation:** CORE MVP but not ready.

**Work required before trial:** Build a transparent calculator and persist its reviewed result.

Supported model assessment:

| Calculation | Current support |
|---|---|
| Lessons x price | Not implemented as user-facing calculator. |
| Annual total / 12 | Represented in label only; teacher enters annual fee manually. |
| Term total / selected months | Not implemented. |
| Fixed monthly payment | Not clearly modelled as monthly amount. |
| First/final payment months | Not implemented. |
| Mid-year starts | Start date stored, no clear proration. |
| Mid-term starts | Not implemented as calculation. |
| Price changes | Not implemented historically. |
| Added/removed lessons | Ledger can adjust manually; no automatic recalculation. |
| Credits/adjustments | Ledger supports manual corrections and credits. |
| Missed lessons | Make-up credit and cancellation logic exists. |
| Teacher/parent cancellations | Cancellation policy and payout logic exist, not fully invoicing-integrated. |
| Trial lessons | Not clear. |
| Shared lessons | Group classes exist, not subscription-calculation integrated. |
| Rounding/pennies | Not explicitly handled. |
| Leap years/time zones | Scheduling tests cover some date logic, not billing. |
| Pausing/ending | Subscription cancellation exists; pause enum exists but workflow unclear. |
| Carrying balances | Ledger balance and credit field exist. |
| Recalculate without rewriting history | Not implemented as invoice snapshots. |

Example using current behaviour: a teacher can manually enter `annualFee = 960` with `SMOOTHED_SUBSCRIPTION`, but the app does not prove that this came from `30 x £32`, does not calculate `£80/month`, and does not create 12 invoice records.

## Invoices

**Current state:** Partial

**What currently works:** A PDF can be generated from a subscription’s ledger entries and downloaded by the teacher or authorised payer.

**What does not work or is missing:** No `Invoice` model, invoice numbers, draft/issued/void states, stored line items, automatic monthly invoice generation, email sending, correction workflow or multi-pupil invoice grouping.

**Evidence:** `src/app/api/subscriptions/[id]/invoice/route.ts`, `src/lib/invoice-pdf.ts`, `LedgerEntry`.

**MVP recommendation:** CORE MVP but incomplete.

**Work required before trial:** Add invoice snapshots and numbering, or clearly call current feature “statement PDF”.

## Payments

**Current state:** Working with limitations

**What currently works:** Manual payment recording posts a ledger credit. Stripe Checkout payment links exist behind Stripe Connect and contract acceptance checks.

**What does not work or is missing:** Direct Debit, card reconciliation, reminders, overpayment allocation and robust paid/overdue invoice states are not complete.

**Evidence:** `src/app/dashboard/subscriptions/[id]/actions.ts`, `src/lib/payments.ts`, `src/app/api/webhooks/stripe/route.ts`, `Payment`, `LedgerEntry`.

**MVP recommendation:** CORE MVP for manual recording; Coming soon for Stripe automation.

**Work required before trial:** Keep manual payments; hide Stripe unless fully configured.

## Accounting and reporting

**Current state:** Working with limitations

**What currently works:** Forecast tests, accounting CSV export, tax-pack page, expenses and ledger reporting exist.

**What does not work or is missing:** Outstanding/overdue invoice reporting is limited by absence of real invoice records.

**Evidence:** `src/app/dashboard/forecast`, `src/app/api/accounting-export/route.ts`, `src/app/dashboard/tax-pack/page.tsx`, `__tests__/forecast.test.ts`, `__tests__/accounting-export.test.ts`.

**MVP recommendation:** SUPPORTING MVP.

**Work required before trial:** Tie reports to the simplified invoice/payment workflow.

## Calendar and timetable

**Current state:** Working with limitations

**What currently works:** Internal calendar components, timetable generation, lesson ICS download, term calendars and route/travel tools exist.

**What does not work or is missing:** Google connection is partial; Outlook not present; two-way sync and busy-time import are not complete.

**Evidence:** `src/app/dashboard/teacher-calendar.tsx`, `src/app/api/lessons/[id]/ics/route.ts`, `src/app/api/gmail/connect/route.ts`, `src/app/dashboard/timetable`, `__tests__/ics-route.test.ts`.

**MVP recommendation:** Coming soon for external sync; include basic internal calendar only if simple.

**Work required before trial:** Hide external sync claims.

## Communications

**Current state:** Partial

**What currently works:** Gmail connection paths and some send-email calls exist. Payer email form exists.

**What does not work or is missing:** General automatic reminders, payment reminders, templates, email history, SMS and WhatsApp are not complete.

**Evidence:** `src/lib/gmail.ts`, `src/app/api/gmail`, `src/app/dashboard/payers/[id]/send-email-form.tsx`.

**MVP recommendation:** Coming soon.

**Work required before trial:** Do not promise sending invoices or automatic reminders.

## Parent or pupil portal

**Current state:** Working with limitations

**What currently works:** Code-based login, student dashboard, ledger, calendar, notes, resources, assignments, classes, courses and maintenance pages exist.

**What does not work or is missing:** It is too broad for the first MVP and not fully proven end to end. Payment and rescheduling/cancellation are limited.

**Evidence:** `src/app/parent`, `src/lib/microsite-session.ts`.

**MVP recommendation:** Coming soon or restricted pilot.

**Work required before trial:** Reduce to invoice download and simple lesson overview.

## Lesson notes and learning tools

**Current state:** Working with limitations

**What currently works:** Lesson notes, attendance, assignments, resources, curriculum templates, progress summaries, loans and online meeting links exist.

**What does not work or is missing:** These are valuable but distract from invoicing MVP. Some sharing/permission flows need more coverage.

**Evidence:** `LessonNote`, `Assignment`, `Resource`, `CurriculumTemplate`, `LoanableItem`, `src/app/dashboard/lessons/[id]`, `src/app/dashboard/resources`.

**MVP recommendation:** Coming soon or hide most of it.

**Work required before trial:** Keep lesson notes only if trial teachers explicitly need them.

## Schools, venues and larger organisations

**Current state:** Partial

**What currently works:** Schools/venues are represented as teaching locations. Rooms, group classes, organisations, invites and cover assignments exist.

**What does not work or is missing:** Payroll, commission, school administrators, organisation switching and shared roster permissions are not trial-ready.

**Evidence:** `Organisation`, `OrganisationInvite`, `CoverAssignment`, `TeacherRole`, `Room`, `GroupClass`, `src/app/dashboard/organisation`.

**MVP recommendation:** Hide for now.

**Work required before trial:** Keep product positioned for self-employed teachers.

## Authentication and permissions

**Current state:** Working with limitations

**What currently works:** Login/register, Better Auth migration contract tests, helper tests, tenant boundary tests and route-specific ICS tests exist.

**What does not work or is missing:** 232 `await auth()` usages remain. Password reset, email verification, account suspension, assistant/school admin roles and full organisation-role enforcement are not mature.

**Evidence:** `src/auth.ts`, `src/lib/auth-helpers.ts`, `src/lib/permission-helpers.ts`, `__tests__/auth-bridge-contract.test.ts`, `__tests__/domain-boundaries.test.ts`.

**MVP recommendation:** Internal only, but must be reliable.

**Work required before trial:** Finish migration from raw `await auth()` to explicit session and permission helpers for core MVP routes.

---

# Part 4: Test and reliability audit

Jest configuration discovers `**/__tests__/**/*.test.ts`. The verified green run was against disposable migrated schema `learnio_verify_20260716171747`.

| Suite | Tests | Feature covered | Type | Real routes or mocked logic | Passing? | Does not prove |
|---|---:|---|---|---|---|---|
| `accounting-export.test.ts` | 3 | CSV formatting | Unit | Pure logic | Yes | Route auth or DB query correctness. |
| `age.test.ts` | 11 | Age checks | Unit | Pure logic | Yes | UI access flows. |
| `auth-bridge-contract.test.ts` | 9 | Better Auth bridge shape | Unit/contract | Mocked auth | Yes | Real Better Auth handler login. |
| `auth-helpers.test.ts` | 7 | Session/org/platform helpers | Unit | Mocked auth | Yes | Full app adoption. |
| `auth-migration.test.ts` | 3 | Better Auth migrated tables/passwords | Integration | Real DB via `pg` | Yes on migrated schema | Default DB readiness. |
| `bulk-timetable.test.ts` | 5 | Bulk generation | Unit/integration | Mostly logic | Yes | Full UI workflow. |
| `cancellation-policy.test.ts` | 5 | Cancellation policy | Unit | Logic | Yes | End-to-end billing outcomes. |
| `domain-boundaries.test.ts` | 29 | Cross-tenant predicates | Unit/contract | Helper logic | Yes | All routes using helpers. |
| `encryption.test.ts` | 4 | Encryption | Unit | Logic | Yes | Key rotation/ops. |
| `forecast.test.ts` | 7 | Forecast calculations | Unit | Logic | Yes | Dashboard correctness. |
| `group-booking.test.ts` | 7 | Group booking | Unit/integration | Logic | Yes | Parent UI completion. |
| `ics.test.ts` | 2 | ICS generation | Unit | Logic | Yes | Route permissions. |
| `ics-route.test.ts` | 6 | ICS route auth/privacy | Integration | Mocked DB/auth route | Yes | Real DB session setup. |
| `ledger.test.ts` | 14 | Ledger/balances/cancellations | Unit | Logic | Yes | Full invoice workflow. |
| `lone-worker.test.ts` | 5 | Lone-worker alerts | Unit | Logic | Yes | Production alert delivery. |
| `mileage.test.ts` | 7 | Mileage/tax year | Unit | Logic | Yes | Full tax pack. |
| `nav.test.ts` | 4 | Navigation logic | Unit | Logic | Yes | Browser navigation. |
| `onboarding.test.ts` | 7 | Onboarding cards/archetype | Unit | Logic | Yes | Full account setup. |
| `promo-code.test.ts` | 8 | Promo codes | Unit | Logic | Yes | Subscription/payment integration. |
| `route-check.test.ts` | 5 | Travel/route check | Unit | Logic | Yes | UI details. |
| `scheduling.test.ts` | 20 | Scheduling conflicts | Unit | Logic | Yes | Full timetable UX. |
| `session-plan-display.test.ts` | 3 | Display/session plan | Unit | Logic | Yes | Token page runtime. |
| `tenant-isolation.test.ts` | 3 | Accounting export boundary | Integration | Mocked auth/DB route | Yes | All tenant surfaces. |

Search results:

- `.skip`: none found under Jest tests.
- `xit`: none found.
- `xdescribe`: none found.
- `test.todo`: none found.
- Excluded paths: no explicit `testPathIgnorePatterns`; Jest only includes `__tests__/**/*.test.ts`.
- Tests not discovered by Jest: `smoke/smoke.spec.js`, `timetable-service/tests/test_solver.py`, `test_prisma.ts`, `test_prisma.mjs`, `test_script.mjs`.
- Test-only/demo credentials: `teacher@example.com` and `changeme123` appear in auth migration/testing context.
- Plain `npm test -- --runInBand` against the default configured database failed because the auth tables were missing there. Against the disposable migrated schema it passed: 23 suites, 174 tests.

Features with weak or no meaningful automated coverage:

- End-to-end smooth monthly calculation.
- Invoice numbering/snapshots because they are not built.
- Browser-level Playwright flows.
- Gmail OAuth and email sending.
- Stripe onboarding/payment success and webhook behaviour.
- Parent portal full journey.
- Organisation role switching and removed member access across all routes.

---

# Part 5: MVP classification

| Feature | Built? | UI complete? | Backend complete? | Tested? | Required for invoicing MVP? | Trial decision | Reason |
|---|---:|---:|---:|---:|---:|---|---|
| Teacher registration/login | Partial | Partial | Partial | Yes | Yes | CORE MVP | Must work before any trial. |
| Teacher business/invoice details | Partial | Partial | No | Low | Yes | CORE MVP | Needed for invoices. |
| Payers | Yes | Mostly | Mostly | Some | Yes | CORE MVP | Central to billing. |
| Pupils | Yes | Mostly | Mostly | Some | Yes | CORE MVP | Central to billing. |
| Teaching locations | Yes | Mostly | Mostly | Some | Helpful | SUPPORTING MVP | Useful but can be simple. |
| Term/teaching weeks | Partial | Partial | Partial | Some | Yes | CORE MVP | Needed for lesson counts. |
| Lesson types/prices | Yes | Partial | Partial | Some | Yes | CORE MVP | Needs simplification. |
| Smooth monthly calculator | No | No | Partial | Some utility | Yes | CORE MVP | Central promise not complete. |
| Subscription record | Yes | Partial | Partial | Some | Yes | CORE MVP | Stores fee/model but not explanation. |
| Invoice PDF | Partial | Partial | Partial | Limited | Yes | CORE MVP | No invoice records/numbering. |
| Manual payment recording | Yes | Partial | Mostly | Yes | Yes | CORE MVP | Works as ledger credit. |
| Outstanding balance | Partial | Partial | Partial | Yes | Yes | CORE MVP | Ledger exists; invoice states missing. |
| Income forecast | Yes | Partial | Partial | Yes | Helpful | SUPPORTING MVP | Useful once billing data is clear. |
| Parent portal | Partial | Partial | Partial | Limited | No | COMING SOON - SHOW AND RATE | Useful future feedback. |
| Stripe payments | Partial | Partial | Partial | Low | No | COMING SOON - SHOW AND RATE | Valuable but risky for trial. |
| Calendar sync | Partial | No | Partial | Some ICS | No | COMING SOON - SHOW AND RATE | External sync not ready. |
| Lesson notes/resources | Yes | Mostly | Mostly | Some | No | COMING SOON - SHOW AND RATE | Useful but not core invoicing. |
| Group classes | Partial | Partial | Partial | Some | No | HIDE FOR NOW | Too broad for first trial. |
| Organisations | Partial | Partial | Partial | Some | No | HIDE FOR NOW | Not self-employed MVP. |
| Equipment loans | Yes | Partial | Partial | Low | No | HIDE FOR NOW | Distracting. |
| Incidents/certifications/lone-worker | Partial | Partial | Partial | Some | No | HIDE FOR NOW | Too specialist for invoicing MVP. |
| Gift cards/promo codes/add-ons/courses | Partial | Partial | Partial | Some | No | HIDE FOR NOW | Commercial extras before core billing. |

Central MVP journey assessment:

| Step | Works today? | Where it stops |
|---|---|---|
| Teacher creates/accesses account | Partial | Needs trial DB migration/auth confirmation. |
| Enters business/invoicing details | Partial | Branding exists; invoice details, VAT, numbering incomplete. |
| Creates academic terms/weeks | Partial | Term calendars exist but not tied clearly to billing calculation. |
| Adds payer | Yes | Household/invoice recipient UX can improve. |
| Adds pupil | Yes | Many advanced fields may confuse. |
| Defines lesson price/duration/frequency | Partial | Lesson types exist; frequency/calculation connection unclear. |
| Learnio calculates smooth monthly payment | No | Teacher manually enters fee; no transparent calculator. |
| Teacher reviews/approves calculation | No | No review object or audit trail. |
| Learnio creates invoice | Partial | PDF statement generated from ledger; no invoice record. |
| Teacher downloads/sends invoice | Partial | Download exists; sending not proven. |
| Teacher records payment | Yes | Manual ledger credit works. |
| Teacher sees expected/received/outstanding | Partial | Ledger/forecast exists; invoice states missing. |

Core MVP feature counts used for summary:

- Working: 3
- Partially working: 7
- Missing: 2

---

# Part 6: Recommended Coming Soon features

## 1. Parent portal for invoices and lesson notes

**Description:** Give parents one secure place to view invoices, balances, lessons and notes.

**Why relevant:** Teachers regularly answer parent questions about payments and lesson details.

**Current implementation state:** Code-based portal exists but is broad and not fully trial-polished.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** What would parents most need to see first: invoices, calendar, or lesson notes?

## 2. Automatic Stripe payments

**Description:** Let parents pay online by card with money paid directly to the teacher.

**Why relevant:** Reduces manual chasing and reconciliation.

**Current implementation state:** Stripe Checkout and Connect code exists but should not be exposed unless configured end to end.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** Would you pay Stripe fees for easier parent payment collection?

## 3. Google and Outlook calendar sync

**Description:** Sync Learnio lessons with the calendar the teacher already uses.

**Why relevant:** Teachers live by calendars and need conflict awareness.

**Current implementation state:** Internal calendar and ICS download exist; Gmail connection is partial; Outlook is not built.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** Which calendar do you use most for teaching?

## 4. Automated payment reminders

**Description:** Automatically remind parents when payment is due or overdue.

**Why relevant:** Payment chasing is a common pain point.

**Current implementation state:** Not complete; email/Gmail code exists in pieces.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** How many reminder messages would feel helpful rather than pushy?

## 5. Lesson notes and shared resources

**Description:** Keep lesson notes and share practice materials with pupils and parents.

**Why relevant:** Music teachers often want continuity between lessons.

**Current implementation state:** Notes, resources and assignments exist.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** Would you write notes after every lesson or only when needed?

## 6. School timetable management

**Description:** Manage school terms, rooms, travel and pupil timetables.

**Why relevant:** Peripatetic teachers often work across multiple schools.

**Current implementation state:** Many models and pages exist, but too advanced for first MVP.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** Do you teach mainly at schools, homes, online, or your own studio?

## 7. Shared and group lessons

**Description:** Support small-group lessons and shared lesson billing.

**Why relevant:** Common for schools and ensembles.

**Current implementation state:** Group class models and UI exist, but billing integration is unclear.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** How often do you teach shared lessons?

## 8. Equipment tracking

**Description:** Track loaned instruments, books and due-back dates.

**Why relevant:** Teachers often lend music books or instruments.

**Current implementation state:** Loan and maintenance models/UI exist.

**Feedback choices:** Essential / Useful / Not important

**Follow-up question:** What equipment do you lend most often?

Do not show during the first trial: platform admin tools, multi-teacher organisation management, certifications, incidents, lone-worker safety, gift cards, courses, add-ons, promo codes, check-in scanner and public display screens.

---

# Part 7: Two-week trial readiness

| Checklist item | Assessment |
|---|---|
| New teacher can begin without developer assistance | Not yet proven; auth/database setup risk. |
| Onboarding can be completed in under 15 minutes | Likely, but not verified end to end. |
| Demonstration data separated from real data | Unclear. |
| Teacher can add five pupils without confusion | Likely, but wizard has many options. |
| Subscription calculations are transparent | No. |
| Teacher understands monthly amount | No, because calculator is missing. |
| Historical invoices cannot be rewritten | No durable invoice snapshots. |
| Generate usable invoice | Partial PDF statement. |
| Record payment | Yes, manually. |
| Identify outstanding amounts | Partial ledger balance, not invoice aging. |
| Errors understandable | Mixed. |
| Empty states explain next step | Mixed; many pages likely have basic empty states. |
| Incomplete features do not obstruct workflow | No; navigation is too broad. |
| User can submit feedback | Not found as core app workflow. |
| User can request feature | Landing feature vote components exist, but app workflow unclear. |
| Trial analytics | Not found. |
| Delete/export data | Not found as teacher-facing workflow. |
| Privacy suitable for real pupil/parent data | Improving, but permission migration incomplete. |

Readiness score: **42 / 100**

Five largest risks:

1. The smooth monthly calculation is not complete or transparent.
2. Invoices are PDF statements, not durable numbered invoices.
3. Too many non-MVP features are visible and may confuse trial teachers.
4. Authentication migration is not fully deployed to the default configured database.
5. Permissions rely on many remaining raw `await auth()` call sites and inconsistent helper adoption.

---

# Part 8: Landing-page evidence pack

## Verified claims we can make now

| Claim | Safer wording | Evidence |
|---|---|---|
| Keep pupils and payers organised. | Keep pupils, parents and payment contacts in one place. | `Student`, `Payer`, `StudentPayerLink`, `/dashboard/students`, `/dashboard/payers`, `__tests__/tenant-isolation.test.ts`. |
| Record payments. | Record manual payments against a pupil subscription. | `LedgerEntry`, `src/app/dashboard/subscriptions/[id]/actions.ts`, `__tests__/ledger.test.ts`. |
| Create invoice PDFs. | Download a PDF statement/invoice from ledger entries. | `src/app/api/subscriptions/[id]/invoice/route.ts`, `src/lib/invoice-pdf.ts`. |
| Manage teaching locations and terms. | Set up teaching locations, rooms and term calendars. | `TeachingLocation`, `TermCalendar`, `/dashboard/teaching-locations`, `/dashboard/term-calendars`. |
| Track missed lessons and credits. | Track make-up credits and cancellation outcomes. | `MakeUpLesson`, `LedgerEntry`, `src/lib/ledger.ts`, `__tests__/ledger.test.ts`, `__tests__/cancellation-policy.test.ts`. |
| Export accounting data. | Export ledger data as a CSV for accounting. | `src/app/api/accounting-export/route.ts`, `__tests__/accounting-export.test.ts`. |

## Claims that need qualification

| Risky claim | Safer alternative |
|---|---|
| “Automatically calculate monthly subscriptions.” | “Set up subscription billing and preview the smooth-payment calculator we are preparing for trial.” |
| “Send invoices.” | “Create and download invoice PDFs.” |
| “Take online payments.” | “Online payment links are planned; manual payment tracking is available now.” |
| “Sync your calendar.” | “Download individual lesson calendar files; full calendar sync is planned.” |
| “Complete parent portal.” | “Parent portal is in development and available for feedback.” |

## Claims we must not make yet

- Automatic invoice generation.
- HMRC-ready invoice numbering.
- Direct Debit.
- Fully automated payment reminders.
- Two-way Google/Outlook sync.
- School administrator workflows.
- Payroll or commission.
- Full organisation/team permissions.
- Complete parent self-service payments/rescheduling.

## Suitable screenshots

| Screen | Route | State required | Demonstrates | Hide dummy data? | Viewport |
|---|---|---|---|---|---|
| Dashboard overview | `/dashboard` | Seed teacher with pupils/lessons | Operational home base | Yes | Desktop |
| Pupil detail | `/dashboard/students/[id]` | Pupil with payer/subscription | Pupil record and relationships | Yes | Desktop |
| Subscription page | `/dashboard/subscriptions/[id]` | Subscription with ledger entries | Balance, invoice download, payment recording | Yes | Desktop |
| Payers list/detail | `/dashboard/payers` | Several payers | Parent/contact organisation | Yes | Desktop |
| Term/location setup | `/dashboard/teaching-locations` or `/dashboard/term-calendars` | One or two locations/terms | Teaching setup | Yes | Desktop |

## Missing visual demonstration

The key product promise cannot currently be demonstrated clearly in UI: a transparent calculation turning teaching weeks, lesson price and lesson count into a smooth monthly amount and then into a reviewed invoice/payment schedule.

---

# Recommended next development sequence

| Priority | Objective | Status | Files/areas affected | Reason it matters | Complexity | Dependency | Acceptance criteria |
|---:|---|---|---|---|---|---|---|
| 1 | Apply and verify auth migrations on the actual trial database. | **DONE** | `prisma/migrations`, deployment DB | Trial accounts must work reliably. | Small | None | `prisma migrate deploy` succeeds; login/register tested on trial DB. |
| 2 | Define the core billing calculation model. | Todo | `prisma/schema.prisma`, new billing lib | Central MVP promise needs one source of truth. | Large | 1 | Given lessons, price and months, app explains monthly amount and stores reviewed result. |
| 3 | Build a simple smooth-payment calculator UI. | Todo | Student/subscription pages | Teachers need transparency. | Large | 2 | Teacher can enter lesson count, price, months and see total/monthly amount. |
| 4 | Add durable invoice records and numbering. | Todo | Prisma models, invoice routes/pages | Historical invoices must not change. | Large | 2 | Issued invoice stores number, dates, line items and PDF can be regenerated from snapshot. |
| 5 | Simplify trial navigation. | Todo | `src/app/dashboard/sidebar.tsx` | Prevents confusion. | Medium | 2-4 decisions | Only core/supporting MVP links visible; coming-soon features clearly separated. |
| 6 | Create business/invoice settings. | Todo | Billing/profile pages, teacher model | Invoices need real sender details. | Medium | 4 | Teacher can enter business name, address, payment instructions and invoice prefix. |
| 7 | Harden core permissions. | Todo | Core dashboard routes/actions | Real pupil data requires tenant safety. | Medium | 1 | Core pupil, payer, subscription, invoice and payment routes use explicit helpers. |
| 8 | Add browser-level trial journey test. | Todo | Playwright/e2e setup | Proves a normal teacher can complete MVP. | Medium | 3-6 | Test covers register/login, add payer, add pupil, calculate subscription, invoice, payment. |
| 9 | Add feedback collection. | Todo | App dashboard/landing | Trial must produce learning. | Small | 5 | Teacher can rate coming-soon features and submit comments. |
| 10 | Prepare seed/demo separation and privacy checklist. | **IN PROGRESS** | Seed scripts, docs, data tools | Real trial data needs trust. | Medium | 1 | Demo data clearly labelled; export/delete policy documented or implemented. |

