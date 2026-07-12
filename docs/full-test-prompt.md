# Full regression test prompt — roadmap v2 (both revisions)

Use this as a standalone prompt to fully test everything built across the two roadmap-v2 passes
(commits `6c166e3`..`d568b68`). Written so it can be handed to a fresh agent with no prior context.

---

## Prompt

You are testing the Learnio app after a large feature push (25 commits implementing the full
`learnio-roadmap-v2.md` doc and its later revision). Nothing in this list has been manually
verified in a browser yet — only `tsc`/`eslint`/`jest`/`next build`, plus an authenticated-curl
smoke test of every new route, have passed. Your job is to actually exercise these flows in a
browser and report back concrete pass/fail per item, not just "looks fine."

### 0. Setup
- Start the dev server per `scripts/run-next-dev.js` (see CLAUDE.md's "Dev Server / Tailwind cwd
  Bug" section for why this wrapper is required — plain `next dev` breaks Tailwind's PostCSS
  config discovery).
- Confirm Tailwind is actually applying (check for real utility classes in rendered HTML, not just
  base/reset styles — the cwd bug's known failure mode is unstyled black-text-on-white that still
  "looks like it's rendering fine" at a glance).
- Seed a test teacher via `npx prisma db seed` (creates `teacher@example.com` / `changeme123`) and
  log in.

### 1. Curriculum templates
- Create a `CurriculumTemplate` with 2+ sections under `/dashboard/curriculum-templates`.
- Import it onto a student; confirm the student gets an independent snapshot (edit the template
  afterward and confirm the student's imported copy does NOT change).
- Mark a section complete; confirm status persists.
- "Save as template" from a student's own from-scratch plan; confirm a new template appears in the
  library.
- Duplicate a plan onto a second student.

### 2. Session plans + Now/Next display
- Add a session plan to a `Lesson` and to a `GroupClass`; publish both.
- Generate a display link from a `TeachingLocation` and open `/display/[token]` in an incognito
  window (no login) — confirm it shows Now/Next correctly for the current time and that an
  unpublished plan does NOT appear.
- Confirm a `GroupClass` with multiple session plans shows the most recent as "current."

### 3. Group class capacity + waitlist
- Set a `GroupClass.capacity` to 1; book two students onto the same date — confirm the second is
  `WAITLISTED`.
- Cancel the `CONFIRMED` booking; confirm the waitlisted one auto-promotes.

### 4. Compliance & safety
- Add an `InstructorCertification` with an expiry date within its reminder window; confirm the
  "Expires in Nd" badge shows.
- Add a `StudentMedicalNote`; confirm it does NOT appear anywhere under `/parent/students/...`.
- Log an `IncidentLog` entry with and without a linked student.

### 5. Cancellation policy
- With NO policy configured, mark a lesson absent — confirm it's still free (make-up credit,
  `MAKE_UP_CREDIT_ISSUED`), matching pre-existing behavior exactly.
- Configure a teacher-wide policy: `noticeHoursRequired=24`, `lateCancelAction=PARTIAL_CHARGE` at
  50%, `noShowAction=FULL_CHARGE`.
  - Mark a lesson absent with "Informed" set >24h before `scheduledAt` — confirm still free.
  - Mark a lesson absent with "Informed" set 2h before `scheduledAt` — confirm a
    `LATE_CANCELLATION_CHARGE` for 50% of lesson value posts.
  - Mark a lesson absent with "Informed" left blank (same-time no-show) — confirm a full-value
    `LATE_CANCELLATION_CHARGE` posts.
- Set a location-scoped override and confirm it takes precedence over the teacher-wide default for
  lessons at that location.

### 6. Lesson feedback
- As a guardian on the microsite, leave feedback on a delivered lesson from the notes page.
- Confirm it appears on the teacher's Lesson detail page and updates the average-rating stat on
  the Student detail header.
- Re-submit feedback for the same lesson as the same guardian — confirm it updates in place
  (upsert), not a duplicate row.
- Confirm a 16+ student's own microsite login does NOT see a feedback form.

### 7. Commerce add-ons
- Issue a `GiftCard`; redeem part of its balance against a subscription — confirm a `PAYMENT`
  ledger entry posts and the remaining balance decrements correctly (not to zero).
- Create a `PromoCode` (PERCENT and FIXED variants); apply each to a subscription — confirm the
  discount amount matches `computeDiscountAmount`'s math, and that a FIXED discount larger than
  the bill amount is capped, not negative.
- Set a `usageLimit` of 1 on a promo code, apply it once, then try again — confirm it's rejected.
- Download the accounting CSV (`/dashboard/accounting-export`) with and without a date range;
  confirm CREDIT/DEBIT sign conventions are correct. (Already spot-checked with seeded data —
  produced a correct row; re-verify with more entries.)

### 8. Embeddable onboarding widget
- Create an `EmbedConfig` scoped to one location + one lesson type.
- Open the generated `/onboard/embed/[token]` link in incognito — confirm the lesson-type list is
  correctly filtered to just the allowed one, and the location is pre-selected.
- Submit through it; confirm the resulting `Student` lands in `/dashboard/students/pending` exactly
  like a submission through the plain `/onboard/[teacherId]` link would.

### 9. Multi-instructor support
- Start an `Organisation` as Teacher A.
- Generate an invite link; accept it as Teacher B (a second logged-in account) — confirm B becomes
  an `INSTRUCTOR`, and confirm the SAME invite link can't be reused by a third account.
- As Teacher A, assign a `CoverAssignment` on one of A's own lessons, covering instructor = B.
  Confirm the lesson's `teacherId` is UNCHANGED (ownership never transfers).
- As Teacher B, leave the organisation; confirm B reverts to a standalone `OWNER` and A's lesson
  data is untouched throughout.

### 10. Online lessons
- Set a `TeachingLocation.locationType = ONLINE`; add a `meetingUrl` to a lesson there — confirm
  the safeguarding guidance callout appears on the Lesson detail page.
- Download the `.ics` file (`GET /api/lessons/[id]/ics`) as both the owning teacher and a guardian
  on the microsite — confirm both succeed, and a third unrelated account gets a 403. (Already
  spot-checked: valid VCALENDAR output with correct UID/DTSTART/DTEND/SUMMARY/DESCRIPTION, and a
  nonexistent lesson ID correctly 404s.)
- Import the downloaded `.ics` into a real calendar app and confirm the event details are sane.

### 11. Sellable courses
- Create a `Course` with 2 `CourseItem`s (one VIDEO, one DOCUMENT); publish it.
- Record a manual purchase for a payer.
- As that guardian on `/parent/students/[id]/courses`, confirm the purchased course and its items
  appear with working media links, and confirm a DIFFERENT guardian (no purchase) sees nothing.

### 12. Invoice PDF
- Download an invoice from the Subscription detail page (teacher) and from the microsite ledger
  page (guardian) — confirm both produce a valid, openable PDF with correct line items and total.
  (Already spot-checked: valid `%PDF-1.7` output from the teacher side with seeded ledger data.)
- Confirm an unrelated microsite guardian gets a 403, not someone else's invoice.

### 13. Batch-cancel + lone-worker safety
- From `/dashboard/today`, click "Cancel remaining lessons today" — confirm it lands on the
  Unavailability preview with today's remaining lessons listed, and confirm actually confirming it
  cancels + emails guardians (if Gmail connected) + posts make-up credits.
- Set a `Teacher.emergencyContact*` under Billing.
- Check in to a `STUDENT_HOME` lesson, do NOT check out, and manually backdate/wait past
  `expectedEndAt + graceMinutes` — reload `/dashboard/today` and confirm the alert email attempt
  fires (check `alertSentAt` gets set even if Gmail isn't connected to send).

### 14. Tax pack + mileage
- Log several `MileageLog` entries spanning both sides of a tax-year boundary (e.g. 4 April and 8
  April) — confirm they land in the correct tax year on `/dashboard/tax-pack`.
- Log enough miles in one year to cross 10,000 within a single trip — confirm the allowance splits
  correctly between the two rates (cross-check against `calculateMileageAllowance`'s own unit
  tests).
- Download the tax-pack CSV and confirm it matches the on-screen totals. (Already spot-checked
  with one seeded PAYMENT entry — correct row output.)

### 15. Waitlist, referrals, progress summaries
- Add a waitlist entry, cycle it through WAITING → CONTACTED → CONVERTED.
- Set `referredBy` on two students to the same name; confirm `/dashboard/referrals` groups them
  under one entry with count 2.
- Generate a progress summary for a student with curriculum/assessment/note activity in range;
  confirm the date-range picker actually changes the content; send it to a guardian and confirm
  the email arrives (or fails gracefully with a clear message if Gmail isn't connected).

### 16. Route feasibility
- Set a `LocationTravelTime` of 30 minutes between two locations.
- Schedule two lessons at those locations 15 minutes apart on the same day — confirm
  `/dashboard/route-check` flags the gap with the correct shortfall.
- Confirm a location pair with NO travel time entered is silently skipped, not flagged.

### 17. Regression sanity (older, untouched-this-session features)
- Confirm the existing Unavailability workflow, timetable generation, Stripe payment link
  creation, and the parent microsite login flow still work — this session touched several files
  those flows depend on (`ledger.ts`, `Lesson` schema, `microsite-access.ts`) and a regression
  there would be easy to miss since none of it has its own end-to-end test.

---

## Reporting format

For each numbered section: **PASS**, **FAIL** (with repro steps and the actual vs. expected
behavior), or **BLOCKED** (couldn't test — e.g. no Gmail/Stripe credentials in this environment,
which is a known, pre-existing limitation, not a regression). Flag anything that required
guessing at intended behavior rather than being unambiguous from the UI.
