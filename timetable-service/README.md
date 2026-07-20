# TeachBase Timetable Service

A separate Python microservice for timetable generation, using Google OR-Tools' CP-SAT
constraint solver. Kept out of the main Next.js/TypeScript app deliberately — see
`docs/spec.md` section 3a ("Approved Technical References") for why a deterministic
constraint solver was chosen over a genetic-algorithm approach, and why it runs as its
own service rather than an embedded library.

## What it guarantees vs. what it optimizes

- **Hard constraints (always satisfied):** no teacher double-booking, students only ever
  placed in their own pre-filtered candidate slots, FIXED-mode students keep the same slot
  all term.
- **Soft constraints (optimized for, not guaranteed):** FLUID-mode students get their usage
  spread evenly across candidate slots, and repeating the identical slot in consecutive
  weeks is penalized (encourages rotation).

See `solver.py`'s module docstring for the full constraint list.

## Running locally

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Then `POST /generate-timetable` with a `TimetableRequest` body (see `models.py`), or
`GET /health` to check it's up.

## Status: optionally wired into the main app

`src/lib/timetable-service-client.ts` calls this service from `previewFluidTimetable`
(`src/lib/timetable.ts`) when `TIMETABLE_SERVICE_URL` is set, falling back to the app's own
simpler round-robin on any failure. See CLAUDE.md's "Timetable Service Decisions" for the current
scope: it's wired in as a single-student call (matching the app's existing one-student-at-a-time
preview/confirm UX), not the joint multi-student solve this service is actually built for — that
would need a batch "generate for everyone at once" flow the app doesn't have yet. Post-hoc
teacher/room double-booking conflict detection against already-created `Lesson` rows still runs
in the TS app either way, since the solver has no visibility into other students' existing
lessons.

## Deployment — needs a decision before this can be tested end-to-end

This can't run on Vercel (which hosts the Next.js app) — OR-Tools ships native C++ solver
bindings, which need a real Python runtime, not a serverless edge/Node function. It needs its
own host: a small always-on VM, a container platform with Python support (Railway, Fly.io,
Render, Google Cloud Run), or similar. Pick one before wiring `src/lib/timetable.ts` to call
this over HTTP — the integration code will need a `TIMETABLE_SERVICE_URL` env var pointing at
wherever it ends up.
