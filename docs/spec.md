# Peripatetic Teacher App — Build Spec

**Status:** v1 build brief
**Stack:** Next.js, TypeScript, PostgreSQL, Prisma (same as YourBarber)
**Reference:** Data model patterns audited from ELVIS (github.com/ELVIS-SOFTWARE/elvis) — schema/logic reference only, no Rails code reused. Feature validation from competitor research: My Music Staff, Furlong Maestro/Maestro Teacher, SOCS Music, My Music Lessons (mymusiclessons.org.uk).
**Not in scope for v1:** Full The IG Card account-linking (ledger visible on the card, card-based parent portal) — deferred until product-market fit. **Exception:** card-based sign-in/out for attendance (below) is in scope for v1, since it reuses existing IG Card wallet-pass infrastructure rather than requiring new integration work.

---

## 1. Purpose

A standalone platform for self-employed peripatetic instructors (music teachers, yoga instructors, personal trainers, etc.) who work across multiple locations — home visits, private students found independently, and contracted work across several schools/venues that may change term to term.

Core jobs to be done:
- Track schools/venues, students, and who pays for what
- Generate timetables (fixed or fluid) from teacher availability + student list
- Run subscription billing with a running-balance ledger so mid-term cancellations are fair and transparent
- Handle group classes, room bookings, gradings, and equipment loans
- Take payments via Stripe, generate contracts, and forecast teacher income

---

## 2. Core Entities

### Teacher
- id, name, contact details
- `taxHandling`: enum `SELF_EMPLOYED` | `PAYE_VIA_SCHOOL` — set per TeacherSchoolLink, not globally, since it can vary by engagement

### School / Venue
- id, name, address, term dates (start/end per season)
- `invoicingTarget`: enum `SCHOOL` | `PARENT` — who gets billed for lessons at this location
- Doubles as "Venue" for hired halls — a Teacher can have a School/Venue record even if it's just a hired room, not an institution

### TeacherSchoolLink
- teacherId, schoolId
- `schedulingMode`: enum `FIXED` | `FLUID`
- Availability: array of {dayOfWeek, startTime, endTime}
- `taxHandling` (see above)
- `protectedBlocks`: array of {dayOfWeek, startTime, endTime, label} — periods lessons must never be scheduled (assembly, lunch, exams). Validated against Furlong Maestro's "protection rules."
- All TeacherSchoolLinks merge into **one unified calendar view** for the teacher (single login spanning all schools) — this is the core value proposition Maestro Teacher offers VMTs, and it should be the default dashboard view, not a per-school silo.

### Unavailability — solves the "teacher forgets to alert everyone" risk
- id, teacherId, schoolId (nullable — can span one school or all), startDatetime, endDatetime, reason
- On creation: system scans all Lessons/GroupClasses falling within the window and shows the teacher an itemised list of affected bookings before confirming
- On confirmation: auto-cancels affected bookings, marks the slot(s) unavailable, **auto-emails every affected student/guardian**, and posts the appropriate credit (cash or make-up) to each affected Subscription's ledger
- Validated against My Music Lessons — this was flagged early in scoping as the weak point of a card-only communication approach ("what if the teacher forgets to alert everyone"); this workflow removes reliance on the teacher remembering to notify people manually and should be treated as core, not optional

### Add-on
- id, name, price, `chargeUnit`: enum PER_BOOKING | PER_HOUR, `visibility`: enum PUBLIC | PRIVATE
- Attachable to a Lesson or GroupClass booking (e.g. instrument hire, sheet music, reeds) without cluttering the core Subscription/billing model

### Package
- id, studentId, teacherId
- prepaid block of N lessons at a discounted bundle rate, purchased upfront
- `lessonsRemaining` — decremented as lessons are delivered
- Distinct from Subscription: a Package is a fixed prepaid pool (no monthly smoothing, no running balance across the year), useful for students who want to buy a term's worth upfront rather than subscribe. Both billing models should be selectable per student, alongside the `billingModel` options already on Subscription.

### Room (optional, nested under School/Venue)
- id, schoolId, label, features (e.g. has piano, has mirrors, floor)
- Weekly open/closed days + time windows
- Used when a Lesson or GroupClass needs a specific bookable space

### Student
- id, name, DOB, instrument/class/discipline
- `source`: enum `HOME` | `SCHOOL_INQUIRY` | `COLLEGE`
- linked schoolId (nullable — null for home students)
- `igCardId` (nullable) — links to the student's or guardian's existing IG Card wallet pass, used for sign-in/out scanning rather than full account linking

### CheckIn — card-based sign-in/out, built on existing IG Card wallet pass infrastructure
- id, lessonId (or groupClassId), studentId
- `signedInAt` — timestamp when teacher scans the student's IG Card pass barcode/QR on arrival
- `signedOutAt` — timestamp when scanned again on departure
- Scanning on sign-in auto-fires the LESSON_DELIVERED LedgerEntry (replaces manual attendance marking)
- Serves a dual purpose: safeguarding-grade attendance record (useful at schools — proof of exactly when a student was with the teacher) and the billing trigger, in one scan
- This is a lightweight reuse of the IG Card pass's existing scannable identifier — not full account linking, so it doesn't conflict with the "standalone app first" decision

### Guardian/Payer
- id, name, contact details
- one or more per Student (supports split-payer families)
- StudentPayerLink: studentId, payerId, `isPrimary` flag, optional % split if more than one payer

### Subscription
- id, studentId, payerId
- `annualFee`, smoothed into 12 equal monthly amounts regardless of term breaks
- startDate, endDate, `status`: ACTIVE | CANCELLED | PAUSED
- billing cadence (monthly, tied to Stripe)
- `billingModel`: enum `SMOOTHED_SUBSCRIPTION` | `PER_LESSON` | `HOURLY` | `TERMLY` — validated against My Music Staff, where each student-teacher relationship can be billed differently. Home students may prefer pay-per-lesson while regulars use the smoothed subscription; both should be supported per-student, not forced into one model app-wide.

### Lesson
- id, studentId, teacherId, schoolId, roomId (nullable)
- scheduled datetime, duration
- `status`: HELD | CANCELLED_BY_STUDENT | CANCELLED_BY_TEACHER | RESCHEDULED
- `hoursCounted`: boolean — mirrors ELVIS's are_hours_counted, so a cover lesson or make-up doesn't double-bill

### GroupClass
- id, teacherId, schoolId, roomId (nullable)
- name, discipline/genre
- scheduled slot (recurs weekly)
- GroupClassMember: groupClassId, studentId, joinedAt, leftAt — each member still has their own independent Subscription/Ledger even though they share a timeslot

### LedgerEntry — the running balance engine
- id, subscriptionId
- `amount` (decimal)
- `operation`: `+` (payment received) | `-` (lesson consumed / refund / credit issued)
- `date`
- `reason`: enum PAYMENT | LESSON_DELIVERED | CANCELLATION_ADJUSTMENT | MANUAL_CORRECTION | MAKE_UP_CREDIT_ISSUED | MAKE_UP_CREDIT_REDEEMED
- Running balance = sum of all entries to date for that subscription. This is what powers the parent-facing "you're in credit / lessons owed" view and the teacher's cancellation payout calculation.
- **Make-up credits** (validated against My Music Staff): a missed lesson can resolve as a *lesson credit* (banked, redeemable against a future slot) rather than always resolving to a cash balance adjustment. Attendance marking should offer both paths — "Present ($)" auto-posts a LESSON_DELIVERED entry; "Absent, make-up owed" posts a MAKE_UP_CREDIT_ISSUED entry instead of touching cash balance.

### Payment
- id, subscriptionId, stripePaymentId
- amount, date, status (matches Stripe webhook status)
- Creates a corresponding `+` LedgerEntry on success

### Contract
- id, teacherId, version (int, incrementing per teacher), content, createdAt
- plain-terms document explaining the subscription/ledger model — one evolving document per teacher, not per subscription, since a teacher's standard terms apply across all their students
- versioned so changes to terms don't retroactively alter what a past acceptance recorded

### ContractAcceptance — the actual mechanism of agreement (replaces PDF/e-signature round-trip)
- id, payerId, contractId, contractVersion (denormalized), contractSnapshot, typedName, acceptedAt, ipAddress
- Acceptance happens on a single microsite screen: full contract text displayed, a text input for the parent's typed full name, a checkbox ("I have read and agree to these terms"), and an Accept button — no PDF download, no e-signature vendor, no email round-trip
- `contractSnapshot` stores the exact text shown at the moment of acceptance as an independent copy, not a reference to the (mutable) `Contract.content` — so a later edit to the live contract can never retroactively change what a past acceptance says was agreed to
- `contractVersion` is stored redundantly on the acceptance row (not just inferred via `contractId`) specifically so "has this payer accepted the *current* version" is a cheap direct comparison, not a join-and-compare
- **Gating:** a Subscription's lesson booking (timetable generation) and payment collection (parent Checkout links) are both blocked until the Subscription's designated payer (`Subscription.payerId`) has a `ContractAcceptance` row matching the teacher's current `Contract.version`. Manually recording a payment (the teacher's own bookkeeping correction tool) is not blocked, but the subscription view surfaces acceptance status so the teacher isn't blind to it.
- **Re-acceptance on contract update:** when a teacher edits their contract, a new `Contract.version` is created (never edits an existing version's `content` in place). Every payer's most recent acceptance now points at a stale version, so gating naturally requires re-acceptance before their next lesson booking or payment — no separate "needs re-acceptance" flag or reminder job needed, since it falls out of the version-comparison check.
- **PDF is optional and downstream of acceptance, never the mechanism of it.** After accepting, a parent can download a PDF copy of their `contractSnapshot` for their own records. This uses a simple in-app PDF renderer, not an e-signature service — it is not signed, not required, and generating or skipping it has no bearing on whether the acceptance is valid.

### Assessment
- id, studentId, teacherId
- `level`/grade achieved, date, `canContinue` flag
- optional linked `appointment` (datetime, roomId) when it's a formal sit-down evaluation rather than an informal note
- `examBoard` (e.g. Trinity, ABRSM, or discipline-equivalent) and `examFee` — for formal external assessments, validated against Furlong Maestro's exam fee management

### LoanableItem
- id, name, type (instrument/book/CD/etc.), condition, value
- owned by Teacher or School

### Loan
- id, itemId, studentId
- checkedOutDate, dueBackDate, returnedDate (nullable)
- conditionNotes on return

---

## 3. Core Business Rules

**Income smoothing:** Subscription.annualFee ÷ 12, billed monthly regardless of term breaks. Teacher gets steady income through summer even though no lessons are held.

**Running balance / cancellation payout:**
Balance = Σ(payments received) − Σ(lessons delivered × per-lesson value) at time of cancellation.
- If balance is positive (parent has paid more than consumed) → refund owed to parent.
- If balance is negative (parent has consumed more than paid, e.g. cancelling right after a summer top-up cycle) → amount owed to teacher.
- This calculation must run automatically the moment a cancellation is recorded, and be visible to the parent before they confirm cancellation (transparency requirement from spec discussion).

**Invoicing target logic:** Every Lesson's invoice destination is inherited from its School's `invoicingTarget`, not set per-lesson — avoids inconsistent billing within one school relationship.

**Tax handling:** Per TeacherSchoolLink, not global — the same teacher can be PAYE at School A and self-employed at School B in the same term.

**Scheduling toggle:** FIXED mode assigns each student the same weekly slot for the whole term. FLUID mode rotates slot assignment week to week (so no single day is always missed) while still guaranteeing equal total teaching time per student across the term.

**Lesson history overlay (UI requirement, validated against SOCS Music):** When scheduling a student in FLUID mode, the teacher's calendar view should ghost/overlay that student's past lesson slots from previous weeks onto the current week. This turns "avoid repeating the same missed lesson" from a backend-only calculation into something the teacher can see and manually confirm — important because fluid scheduling still needs a human sanity check, not just an algorithm.

**Role-based permissions (validated against SOCS Music):** v1 only needs Teacher (full access) and Guardian/Parent (read-only microsite view), but design the permission model so an Admin/Assistant role and a read-only "cover teacher" role can be added later without restructuring — relevant once THEIG scales this to multi-teacher studios.

---

## 4. Deferred / Out of Scope for v1
- The IG Card integration (card as lesson/status pointer) — build entities so a `cardId` foreign key can be added later without migration pain
- WhatsApp messaging — start with email; add WhatsApp Business API once core is stable
- Multi-currency (assume GBP throughout)
- Multi-teacher commission splitting (Stripe Connect-style, where a studio takes a cut per booking) — only relevant if THEIG scales this beyond solo teachers to studios/schools with several instructors; design Payment/School relationship so this can be added without restructuring

**Google Calendar + Google Drive (v2 candidate):** Sync the generated timetable to the teacher's own Google Calendar and use Google Drive for storing practice materials/backing tracks/PDFs, both via standard OAuth against the teacher's personal Google account. No Workspace/domain requirement — straightforward APIs, genuinely useful, worth building once core is stable.

**Google Classroom — explicitly excluded, do not revisit without re-reading this note:** Classroom requires a Google Workspace for Education domain controlled by a school admin; guardian access is a domain-level admin toggle, not something the teacher controls, and home/private/college-inquiry students have no school domain at all. Even at contracted schools, the teacher isn't the domain admin. Classroom's model (coursework, assignments, grading streams) is also the wrong shape for lesson scheduling and billing. Not a fit at any scale this product operates at.

---

## 5. Microsite Authentication Model

**Teacher:** standard email/password login, full access to all schools, students, ledgers, and settings.

**Guardian/Payer (parent microsite access):** no account creation required. Each Guardian/Payer gets a persistent, unique 6-digit access code (not shared across families — a single global code would let any parent see every other family's ledger and schedule, which is unacceptable given financial balances are visible). The code is always visible next to that student's record on the teacher's own dashboard, so the teacher can read it out or text it to a parent on request.

- Parent enters the code once on the microsite login screen; a signed session cookie persists so they aren't re-entering it on every visit — code entry is only needed on a new device or after session expiry.
- Teacher can regenerate any family's code independently at any time (e.g. if shared beyond the household, or the family leaves), without affecting other families.
- Proportionate security for the access level: this is read-only visibility into schedule/ledger, not a payment-execution account, so a 6-digit code is appropriate — validated against ClassDojo's parent-code pattern, though note ClassDojo uses 7-9 digits per child specifically because they treat a single shared/class-wide code as their least secure option. Keep the code unique per family for the same reason.
- Built on the same wallet-pass infrastructure as The IG Card (theig.uk) — the access code and the CheckIn scan (Section on Student/CheckIn above) both draw on the same underlying card/pass identifier system, so a family only needs the one physical/digital card plus their code, not a separate login for every tool.

---

## 6. Suggested Build Order
1. Prisma schema for all entities above — get this reviewed before writing any UI
2. Teacher/School/Student/Subscription CRUD + auth
3. Ledger engine (this is the piece to sanity-check hardest — consider Fable 5 here if Sonnet's output looks shaky under test cases)
4. Timetable generator (fixed/fluid toggle — also a Fable 5 candidate if Sonnet struggles)
5. Stripe integration + webhook → LedgerEntry creation
6. Contract generation — in-app clickwrap acceptance (see ContractAcceptance above), not PDF/e-signature. Requires a minimal parent-facing login (access code → signed session) ahead of the full microsite in step 7, since acceptance needs to know which Payer is agreeing.
7. Parent microsite (read-only calendar + ledger view)
8. Room booking, GroupClass, Assessment, LoanableItem/Loan modules
9. Teacher income forecasting dashboard — include a simple expense-tracking line (validated against My Music Staff's payroll/expense module) so the teacher has a tax-ready income vs. expense view, not just incoming revenue
