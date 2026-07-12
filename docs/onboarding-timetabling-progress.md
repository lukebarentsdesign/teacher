# Onboarding & Timetabling Spec — Build Progress

Tracks implementation of **"Teaching Platform — Relational Model, Onboarding & Timetabling Spec"**
(supplied 2026-07-12). Parts 1–3 were already built before the spec arrived; Part 4 is the new work.

Decision (confirmed via the user): do a **full** `School` → `TeachingLocation` rename (not additive),
and build **all of Part 4 in the spec's recommended build order**, committing at each stage.

---

## Status at a glance

| Part | What | Status | Commit |
|---|---|---|---|
| 1 | Payer ↔ Student ↔ School cross-referencing | ✅ pre-existing | — |
| 2 | New-student wizard | ✅ pre-existing | — |
| 3 | Global cross-entity search | ✅ pre-existing, **extended** to LessonType | `270550b` |
| 4.3 | `School` → `TeachingLocation` generalization | ✅ **done** | `6c166e3` |
| 4.1 | `LessonType` catalog | ✅ **done** | `96751b1` |
| 4.2 | Self-serve onboarding questionnaire | ✅ **done** | `75ad249` |
| 4.4 | `VenueFeeArrangement` + `LessonTypeLocationPricing` + itemised ledger | ✅ **done** | `f115b6f` |
| 4.5 | `TermCalendar` / `TermPeriod` / `HolidayPeriod` + per-location override | ⬜ **not started** | — |
| 4.6 | Term-based bulk timetable generation (LessonType + Location) | ⬜ **not started** | — |
| 4.7 | Cross-referencing on TeachingLocation / LessonType cards | 🟡 **partial** | (LessonType card done; TeachingLocation card needs 4.5's TermCalendarOverride display) |

Every completed stage passes `tsc --noEmit`, `eslint src`, and a full `next build`. All migrations are
applied to the live Supabase DB.

---

## What's been built (Parts 4.3, 4.1, 4.2, 4.4)

### 4.3 — TeachingLocation (commit `6c166e3`)
- `School` model → `TeachingLocation`; `schoolId` → `locationId` on Student, Lesson, GroupClass, Room,
  Unavailability, PrivateTuitionRequest; `TeacherSchoolLink` → `TeacherLocationLink`.
- New fields: `locationType` enum (`SCHOOL`/`STUDENT_HOME`/`TEACHER_BASE`/`HIRED_VENUE`/`OTHER`, default
  `SCHOOL` so existing rows need no backfill) and `accessNotes` (teacher-only WiFi/door-code/parking
  scratchpad, never exposed to parents/students).
- Route `/dashboard/schools` → `/dashboard/teaching-locations`.
- Migration `20260712053416_rename_school_to_teaching_location`.

### 4.1 — LessonType catalog (commit `96751b1`)
- Teacher-owned menu: name, description, `defaultDurationMinutes`, `defaultFee`, `active`.
- Optional m2m scoping to specific `TeachingLocation`s — **empty set = offered everywhere**, not nowhere.
- `/dashboard/lesson-types` list + create + activate-toggle; detail page at `/dashboard/lesson-types/[id]`.
- Migration `20260712054557_add_lesson_type`.

### 4.2 — Self-serve onboarding (commit `75ad249`)
- Public unauthenticated page `/onboard/[teacherId]` (outside the `/dashboard` middleware matcher, like
  `/parent` and `/pay`). Optional `?location=` scopes the LessonType picker to that venue.
- `Student.status` enum `PENDING_REVIEW`/`ACTIVE`/`DECLINED` (default `ACTIVE`, so the existing wizard is
  unaffected). `Student.requestedLessonTypeId` (informational, shown on review).
- Submissions always land `PENDING_REVIEW`; teacher review queue at `/dashboard/students/pending`
  (approve/decline) with a shareable-link generator (copy-to-clipboard, optional location scope). Students
  list now filters to `ACTIVE` only, with a banner linking to pending review.
- Migration `20260712055039_student_status_and_requested_lesson_type`.
- **Note:** shareable link only, no QR image (no QR lib in project; deemed scope creep).

### 4.4 — Venue fees & per-location pricing (commit `f115b6f`)
- `VenueFeeArrangement` (feeType `FLAT_PER_SESSION`/`PERCENT_OF_LESSON_FEE`/`PERIOD_RENTAL`, `amount`,
  `billingMode` `ABSORBED_INTO_FEE` default / `ITEMISED_TO_PAYER`, notes) — managed on the
  TeachingLocation detail page, surfaced on the Forecast dashboard as "Recurring venue costs".
- `LessonTypeLocationPricing` (per-location `fee` override) — managed on the LessonType detail page.
- Ledger: `postVenueFeeIfItemised()` in `src/lib/ledger.ts` posts a new `VENUE_FEE_ITEMISED` line
  alongside `LESSON_DELIVERED` when a lesson at an `ITEMISED_TO_PAYER` venue is marked present (both the
  manual attendance action and CheckIn sign-in). `PERIOD_RENTAL` excluded (not a per-lesson cost).
- Migration `20260712060229_venue_fee_and_lesson_type_pricing`.

---

## Next up (resume here)

### 4.5 — Term calendars
- `TermCalendar` (reusable global template) with `TermPeriod` rows (name Autumn/Spring/Summer, start/end)
  and `HolidayPeriod` rows (half-terms / inset days).
- `TeachingLocation` either inherits a default `TermCalendar` or attaches its own `TermCalendarOverride`
  with adjusted dates (independent schools run different terms).
- Populated **manually** per academic year — no live API (UK term dates are per-LA, no national feed).
- Note: `TeachingLocation` already has `termStart`/`termEnd` scalar fields from before this spec — decide
  whether TermCalendar supersedes them or coexists (the bulk generator in 4.6 should read the richer
  TermCalendar so holidays/half-terms are excluded from candidate dates).

### 4.6 — Bulk timetable generation
- Teacher picks LessonType + TeachingLocation + term + target lesson count/student + duration + min-gap;
  system auto-fills `Lesson` records for every ACTIVE student matching that LessonType+Location, spread
  across the term's available slots (holidays/half-terms from TermCalendar excluded), respecting a
  `minGapMinutes` buffer, and **flags** any student who can't be fully scheduled rather than silently
  under-booking.
- Builds on the existing `src/lib/scheduling.ts` / `src/lib/timetable.ts` and the optional OR-Tools
  service client (`src/lib/timetable-service-client.ts`) — this is the multi-student joint solve that
  service was actually built for (current usage is single-student only).

### 4.7 — Finish cross-referencing
- TeachingLocation card: enrolled Students ✅, VenueFeeArrangement ✅, lesson types offered ✅, access-notes
  scratchpad ✅ (in edit form) — **still needs** attached `TermCalendarOverride` display once 4.5 exists.
- LessonType card ✅ (offered-at locations + students who requested it).
- Global search extended to LessonType ✅ and TeachingLocation ✅.

---

## Conventions used throughout (match these when resuming)
- Server components by default; `'use client'` + `useActionState` for forms; ownership re-checked
  server-side via `session.user.id` (or `TeacherLocationLink` for shared `TeachingLocation` data).
- New entities are **additive**, never replacing existing fields (e.g. `LessonType` alongside
  `Student.discipline`, `TermCalendar` alongside `TeachingLocation.termStart/termEnd`).
- Small scoped commits, each ending in a `next build` verification, message tagged `(spec Part 4.X)`.
- Migrations applied to the live DB (`prisma migrate dev`), not just schema edits.
- A very large mechanical step (like the 4.3 rename) may be parallelized across background sub-agents;
  poll `tsc --noEmit` until clean rather than assuming one Agent call finished everything.
