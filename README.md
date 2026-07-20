# TeachBase

A standalone platform for self-employed peripatetic instructors (music teachers, yoga instructors,
personal trainers) working across multiple locations — home visits, private students, and
contracted work across several schools/venues.

See [CLAUDE.md](CLAUDE.md) for the tech stack, build order, and key implementation decisions.
Full requirements are in [docs/spec.md](docs/spec.md).

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in the values (Supabase Postgres connection string,
Stripe keys, etc).

## Timetable service

`timetable-service/` is a separate Python (FastAPI + Google OR-Tools) microservice for
constraint-based timetable generation — see its own [README](timetable-service/README.md).
