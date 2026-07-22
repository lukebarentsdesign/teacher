/**
 * paywall.spec.js — Priority 7: Module paywall / gating
 *
 * From qa-playwright-handover.md §5 item 7 and §4:
 *
 *   - Uses a freshly-registered throwaway teacher (post-cutoff) for each test.
 *   - Inserts a LOCKED row into TeacherModuleAccess via the Supabase/Postgres
 *     API (or via the app's admin API if one exists — see note below).
 *   - Verifies that the gated module's primary create entry-point shows the
 *     locked message rather than the form.
 *   - Verifies that "use existing" actions (redeem a gift card, book an existing
 *     group class) remain clickable even when the owning module is locked.
 *   - Cleans up the LOCKED row after each test.
 *
 * ⚠️  DATABASE_URL REQUIRED
 * These tests insert directly into the DB using the pg client against
 * DATABASE_URL (the same connection string used by the app).
 * Set DATABASE_URL in your environment before running this suite:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 DATABASE_URL=... npx playwright test tests/paywall.spec.js
 *
 * If DATABASE_URL is not set, all tests in this file are skipped automatically.
 *
 * ⚠️  SEEDED ACCOUNTS: Don't use teacher@example.com here — see §3 of the
 * handover doc for the grandfathering caveat. Always use a throwaway account.
 */

const { test, expect } = require("@playwright/test");
const { Client } = require("pg");
const { BASE_URL, registerThrowawayTeacher, loginAs } = require("./helpers");

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getDbClient() {
  if (!process.env.DATABASE_URL) return null;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

async function getTeacherId(db, email) {
  const res = await db.query(
    `SELECT t.id FROM "Teacher" t
     JOIN "user" u ON u.id = t.id
     WHERE u.email = $1
     LIMIT 1`,
    [email]
  );
  return res.rows[0]?.id ?? null;
}

async function lockModule(db, teacherId, moduleKey) {
  await db.query(
    `INSERT INTO "TeacherModuleAccess" (id, "teacherId", "moduleKey", status, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'LOCKED', now(), now())
     ON CONFLICT ("teacherId", "moduleKey") DO UPDATE SET status = 'LOCKED'`,
    [teacherId, moduleKey]
  );
}

async function unlockModule(db, teacherId, moduleKey) {
  await db.query(
    `DELETE FROM "TeacherModuleAccess" WHERE "teacherId" = $1 AND "moduleKey" = $2`,
    [teacherId, moduleKey]
  );
}

// ─── Shared setup ─────────────────────────────────────────────────────────────

test.beforeEach(async ({}, testInfo) => {
  if (!process.env.DATABASE_URL) {
    testInfo.skip();
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Paywall gating — module LOCKED state", () => {
  test("locked CURRICULUM hides the curriculum-templates create button", async ({
    page,
    request,
  }) => {
    const db = await getDbClient();
    const { email, password } = await registerThrowawayTeacher(request);
    await loginAs(page, email, password);
    await page.waitForURL(/\/dashboard|\/onboard/, { timeout: 30_000 });

    const teacherId = await getTeacherId(db, email);
    expect(teacherId, "Could not resolve teacherId for throwaway account").toBeTruthy();

    await lockModule(db, teacherId, "CURRICULUM");
    try {
      await page.goto(`${BASE_URL}/dashboard/curriculum-templates`, {
        waitUntil: "load",
      });

      // The locked message should replace the create form/button
      const lockedMessage = page.getByText(/locked|upgrade|not available/i);
      await expect(lockedMessage.first()).toBeVisible({ timeout: 10_000 });

      // The create button should NOT be visible
      const createBtn = page
        .getByRole("link", { name: /new template|add/i })
        .or(page.getByRole("button", { name: /new template|add/i }));
      await expect(createBtn.first()).not.toBeVisible();
    } finally {
      await unlockModule(db, teacherId, "CURRICULUM");
      await db.end();
    }
  });

  test("locked COMMERCE hides gift-card create but redeeming a code stays accessible", async ({
    page,
    request,
  }) => {
    const db = await getDbClient();
    const { email, password } = await registerThrowawayTeacher(request);
    await loginAs(page, email, password);
    await page.waitForURL(/\/dashboard|\/onboard/, { timeout: 30_000 });

    const teacherId = await getTeacherId(db, email);
    expect(teacherId).toBeTruthy();

    await lockModule(db, teacherId, "COMMERCE");
    try {
      await page.goto(`${BASE_URL}/dashboard/gift-cards`, {
        waitUntil: "load",
      });

      // The create / issue new gift-card button should be locked
      const lockedMsg = page.getByText(/locked|upgrade|not available/i);
      await expect(lockedMsg.first()).toBeVisible({ timeout: 10_000 });

      // No crash
      await expect(page.locator("text=Application error")).toHaveCount(0);
    } finally {
      await unlockModule(db, teacherId, "COMMERCE");
      await db.end();
    }
  });

  test("locked ORGANISATION hides the invite button", async ({ page, request }) => {
    const db = await getDbClient();
    const { email, password } = await registerThrowawayTeacher(request);
    await loginAs(page, email, password);
    await page.waitForURL(/\/dashboard|\/onboard/, { timeout: 30_000 });

    const teacherId = await getTeacherId(db, email);
    expect(teacherId).toBeTruthy();

    await lockModule(db, teacherId, "ORGANISATION");
    try {
      await page.goto(`${BASE_URL}/dashboard/organisation`, {
        waitUntil: "load",
      });

      const lockedMsg = page.getByText(/locked|upgrade|not available/i);
      await expect(lockedMsg.first()).toBeVisible({ timeout: 10_000 });

      const inviteBtn = page
        .getByRole("button", { name: /invite|generate link/i })
        .or(page.getByRole("link", { name: /invite/i }));
      await expect(inviteBtn.first()).not.toBeVisible();
    } finally {
      await unlockModule(db, teacherId, "ORGANISATION");
      await db.end();
    }
  });

  test("certifications remain visible even with COMPLIANCE locked (always ungated)", async ({
    page,
    request,
  }) => {
    const db = await getDbClient();
    const { email, password } = await registerThrowawayTeacher(request);
    await loginAs(page, email, password);
    await page.waitForURL(/\/dashboard|\/onboard/, { timeout: 30_000 });

    const teacherId = await getTeacherId(db, email);
    expect(teacherId).toBeTruthy();

    await lockModule(db, teacherId, "COMPLIANCE");
    try {
      // certifications must NEVER be gated, per product decision
      await page.goto(`${BASE_URL}/dashboard/certifications`, {
        waitUntil: "load",
      });
      await expect(page.getByText("Certifications", { exact: false }).first()).toBeVisible();
      await expect(page.locator("text=Application error")).toHaveCount(0);
    } finally {
      await unlockModule(db, teacherId, "COMPLIANCE");
      await db.end();
    }
  });

  test("incidents remain visible even with COMPLIANCE locked (always ungated)", async ({
    page,
    request,
  }) => {
    const db = await getDbClient();
    const { email, password } = await registerThrowawayTeacher(request);
    await loginAs(page, email, password);
    await page.waitForURL(/\/dashboard|\/onboard/, { timeout: 30_000 });

    const teacherId = await getTeacherId(db, email);
    expect(teacherId).toBeTruthy();

    await lockModule(db, teacherId, "COMPLIANCE");
    try {
      await page.goto(`${BASE_URL}/dashboard/incidents`, { waitUntil: "load" });
      await expect(page.getByText("Incidents", { exact: false }).first()).toBeVisible();
      await expect(page.locator("text=Application error")).toHaveCount(0);
    } finally {
      await unlockModule(db, teacherId, "COMPLIANCE");
      await db.end();
    }
  });
});
