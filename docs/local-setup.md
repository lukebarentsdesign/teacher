# Local setup (new machine / home machine)

Steps to get TeachBase running on a machine that doesn't have it yet — e.g. picking up work at home
after developing on another computer. No secrets are in this file; you carry `.env` over separately.

## 1. Get the code

```
git clone https://github.com/lukebarentsdesign/teacher.git teachbase
cd teachbase
npm install
```

If you already have the repo cloned there, just `git pull` instead.

## 2. Bring your `.env` over

This file holds real secrets (DB password, `AUTH_SECRET`, Stripe keys) and is deliberately
**gitignored** — it never goes to GitHub. Copy it directly (USB stick / your own private storage,
never email or chat) from the other machine's project root into this one's:

```
<other machine>\teachbase\.env  →  <this machine>\teachbase\.env
```

`.env.example` in the repo documents every variable's purpose if you ever need to rebuild it from
scratch instead (e.g. a fresh Supabase project) — see that file for what each key is for.

## 3. Check the database is in sync

Both machines point at the same Supabase Postgres instance (via `DATABASE_URL` in `.env`), so there's
nothing to migrate on a second machine — just confirm you're not behind:

```
node_modules\.bin\prisma.cmd migrate status
```

Should say "Database schema is up to date!". If new migrations exist that haven't been applied yet
(e.g. someone else applied them from a different machine, or you pulled newer code before running
this), apply them:

```
node_modules\.bin\prisma.cmd migrate deploy
node_modules\.bin\prisma.cmd generate
```

## 4. Run it

```
node scripts\run-next-dev.js
```

(Not bare `npm run dev` — see the "Dev Server / Tailwind cwd Bug" note in `CLAUDE.md` for why this
wrapper exists.) Then open **http://localhost:3000/login**.

Demo login (pre-filled on the form): `teacher@example.com` / `changeme123`.

## 5. Run the tests

```
npm test
```

Should be 24 suites / 178 tests, all green, matching what CI/other machines see.

## Troubleshooting

- **Sign-in fails with a 403 / "Invalid origin"** — `BETTER_AUTH_URL` in `.env` must match the
  origin you're actually browsing (`http://localhost:3000` by default). If you run the app on a
  different host/port, update it there.
- **A page 500s with a Prisma "column/table does not exist" error** — the DB is behind on
  migrations; run step 3 again.
- **Login page loads but styling looks broken (unstyled black-on-white)** — a stale `.next` build
  cache confusing Tailwind's config discovery. Stop the server, delete the `.next` folder, restart.
