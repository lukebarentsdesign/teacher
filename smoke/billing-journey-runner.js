/**
 * End-to-end billing journey (roadmap "Trust the Trial" Item 8).
 *
 * Proves the money loop the whole trial depends on: a teacher signs up, agrees a smoothed
 * subscription, teaches a lesson (which posts a charge), invoices it, downloads the invoice PDF,
 * records the parent's payment, and the account reconciles to exactly £0.00 — charged for what was
 * taught, paid for what was charged, books balanced.
 *
 * Shape (approved "hybrid" plan): the *billing-critical* steps run through the real browser UI
 * (registration, the subscription calculator, mark-present, generate-invoice, download-PDF,
 * record-payment). The non-billing *scaffolding* with no single-item UI — a teaching location and
 * one scheduled Lesson row — is seeded directly in the DB, exactly the plumbing the timetable
 * generators exist to mass-produce and that no real teacher hand-builds for a single lesson.
 *
 * Standalone runner (plain `playwright`, ending in JOURNEY_OK) rather than a `@playwright/test`
 * spec: this repo has only the `playwright` package installed, not the `@playwright/test` runner —
 * same reason smoke-runner.js is a standalone script. Run: `node smoke/billing-journey-runner.js`.
 *
 * Run-scoped data: a fresh teacher with a timestamped email each run, so runs never collide. Rows
 * are left behind on purpose (labelled demo/trial data — see Item 10); no teardown dependency.
 *
 * Env: PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000) must be an origin Better Auth trusts
 * (set BETTER_AUTH_URL to the same value on the app), and DATABASE_URL must point at the app's DB.
 */
// Load DATABASE_URL (and friends) from .env — this standalone script isn't run through Next, which
// is what normally injects them.
try {
  require("dotenv").config();
} catch {
  /* dotenv is a devDependency; if absent, rely on the ambient environment */
}
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const PASSWORD = "changeme123";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}
function money(n) {
  return Number(n).toFixed(2);
}
async function db() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const schema = new URL(process.env.DATABASE_URL ?? "").searchParams.get("schema");
  if (schema) await client.query(`SET search_path TO "${schema.replace(/"/g, '""')}"`);
  return client;
}
async function withDb(fn) {
  const c = await db();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}
async function poll(fn, predicate, { timeout = 15000, interval = 500 } = {}) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    last = await fn();
    if (predicate(last)) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`poll timed out; last value = ${JSON.stringify(last)}`);
}

/**
 * Clicks a server-action submit button and waits for its DB side effect. Playwright's click resolves
 * before the Next.js server action + revalidation complete, so we poll `probe` until `done(value)`.
 * If nothing happened after the first window and the button is still on the page (the click likely
 * landed before hydration), we click once more. Buttons that vanish on success (e.g. "Present"
 * disappears once attendance is marked) are handled: a missing button is treated as "already done".
 */
async function clickAndConfirm(page, nameRe, probe, done, { first = 8000, second = 12000 } = {}) {
  const button = () => page.getByRole("button", { name: nameRe });
  await button().click();
  try {
    await poll(probe, done, { timeout: first });
    return;
  } catch {
    /* fall through to a guarded retry */
  }
  const stillThere = await button()
    .first()
    .isVisible()
    .catch(() => false);
  if (stillThere) await button().click();
  await poll(probe, done, { timeout: second });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const stamp = Date.now();
  const email = `journey-${stamp}@example.com`;

  try {
    // ---- 1. Register a fresh teacher via the UI (exercises the Better Auth signup hook that
    //         creates the linked Teacher) and confirm the dashboard actually loads.
    await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
    await page.getByLabel("Name").fill("Journey Teacher");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/sign-up/email") && r.status() < 400),
      page.getByRole("button", { name: /Create account/i }).click(),
    ]);

    const dash = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    assert(dash.status() < 400, `dashboard should load for a fresh teacher, got ${dash.status()}`);
    const dashBody = await page.locator("body").innerText();
    assert(!/Internal Server Error|Application error/i.test(dashBody), "dashboard rendered an error");

    // ---- 2. Seed the non-billing scaffolding (location + payer + student + link) for THIS teacher.
    const ids = await withDb(async (c) => {
      const t = await c.query('SELECT id FROM "Teacher" WHERE email = $1', [email]);
      assert(t.rowCount === 1, "the signup hook must have created a Teacher row");
      const teacherId = t.rows[0].id;

      const loc = await c.query(
        `INSERT INTO "TeachingLocation" ("id","name","locationType","invoicingTarget","createdAt","updatedAt")
         VALUES ($1,$2,'STUDENT_HOME','PARENT',now(),now()) RETURNING id`,
        [`loc-${stamp}`, "Journey Home Visits"]
      );
      const locationId = loc.rows[0].id;

      await c.query(
        `INSERT INTO "TeacherLocationLink" ("id","teacherId","locationId","schedulingMode","taxHandling","availability","protectedBlocks","createdAt","updatedAt")
         VALUES ($1,$2,$3,'FIXED','SELF_EMPLOYED','[]'::jsonb,'[]'::jsonb,now(),now())`,
        [`tll-${stamp}`, teacherId, locationId]
      );

      // Payer.accessCode is a required unique 6-digit microsite login code — derive one from the
      // run stamp (kept unique across runs; collision-retry omitted since runs are seconds apart).
      const accessCode = String((stamp % 900000) + 100000);
      const payer = await c.query(
        `INSERT INTO "Payer" ("id","teacherId","name","email","accessCode","accessCodeUpdatedAt","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,now(),now(),now()) RETURNING id`,
        [`payer-${stamp}`, teacherId, "Rachel Journey", `rachel-${stamp}@example.com`, accessCode]
      );
      const payerId = payer.rows[0].id;

      const student = await c.query(
        `INSERT INTO "Student" ("id","teacherId","name","discipline","source","status","locationId","createdAt","updatedAt")
         VALUES ($1,$2,$3,'Flute','HOME','ACTIVE',$4,now(),now()) RETURNING id`,
        [`student-${stamp}`, teacherId, "Ava Journey", locationId]
      );
      const studentId = student.rows[0].id;

      await c.query(
        `INSERT INTO "StudentPayerLink" ("id","studentId","payerId","isPrimary","createdAt")
         VALUES ($1,$2,$3,true,now())`,
        [`spl-${stamp}`, studentId, payerId]
      );

      return { teacherId, locationId, payerId, studentId };
    });

    // ---- 3. Create the smoothed subscription through the REAL calculator UI.
    await page.goto(`${BASE_URL}/dashboard/students/${ids.studentId}`, { waitUntil: "networkidle" });
    await page.getByText("Payment Calculator").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#billingModel").selectOption("SMOOTHED_SUBSCRIPTION");
    await page.locator("#lessonCount").fill("30");
    await page.locator("#lessonPrice").fill("32");
    await page.locator("#months").fill("12");
    // 30 * £32 = £960.00 annual total, computed live by the calculator.
    await page.getByText("£960.00").first().waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: /Create subscription/i }).click();
    await page
      .getByText(/Active Billing Plan|SMOOTHED_SUBSCRIPTION/)
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    const subscriptionId = await withDb(async (c) => {
      const sub = await c.query(
        'SELECT id FROM "Subscription" WHERE "studentId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        [ids.studentId]
      );
      assert(sub.rowCount === 1, "subscription should have been created via the calculator");
      return sub.rows[0].id;
    });

    // ---- 4. Seed the one Lesson (no single-lesson UI exists — generators only). Wire it to the
    //         student, subscription and location so "Present ($)" can post a LESSON_DELIVERED charge.
    const lessonId = `lesson-${stamp}`;
    await withDb((c) =>
      c.query(
        `INSERT INTO "Lesson" ("id","studentId","teacherId","locationId","subscriptionId","scheduledAt","durationMins","status","hoursCounted","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5, now() - interval '1 hour', 30, 'HELD', true, now(), now())`,
        [lessonId, ids.studentId, ids.teacherId, ids.locationId, subscriptionId]
      )
    );

    // ---- 5. Mark the lesson Present ($) — posts the LESSON_DELIVERED debit. Server-action form;
    //         click, poll for the debit, and retry the click once if it fired before hydration.
    await page.goto(`${BASE_URL}/dashboard/lessons/${lessonId}`, { waitUntil: "networkidle" });
    const debitPosted = () =>
      withDb(async (c) => {
        const r = await c.query(
          `SELECT COALESCE(SUM(amount),0) AS debit FROM "LedgerEntry"
           WHERE "subscriptionId" = $1 AND reason='LESSON_DELIVERED' AND operation='DEBIT'`,
          [subscriptionId]
        );
        return Number(r.rows[0].debit);
      });
    await clickAndConfirm(page, /Present/i, debitPosted, (v) => v > 0);

    // The amount owed = debits - credits (should be positive after one lesson, no payment yet).
    // Cash-affecting reasons only (make-up credits are excluded from the cash balance by design).
    const owed = await withDb(async (c) => {
      const r = await c.query(
        `SELECT COALESCE(SUM(CASE WHEN operation='DEBIT' THEN amount ELSE -amount END),0) AS bal
         FROM "LedgerEntry" WHERE "subscriptionId" = $1
           AND reason IN ('LESSON_DELIVERED','PAYMENT','MANUAL_CORRECTION','VENUE_FEE_ITEMISED','LATE_CANCELLATION_CHARGE','CANCELLATION_ADJUSTMENT')`,
        [subscriptionId]
      );
      return Number(r.rows[0].bal);
    });
    assert(owed > 0, `expected a positive amount owed after the lesson, got ${owed}`);

    // ---- 6. Generate the invoice via the subscription detail UI. The button is a server-action
    //         form submit; the click resolves before the action + revalidation finish, so click,
    //         then confirm the Invoice row landed in the DB (retrying the click once in case it fired
    //         before the action was hydrated), then wait for the re-rendered Download PDF link.
    await page.goto(`${BASE_URL}/dashboard/subscriptions/${subscriptionId}`, { waitUntil: "networkidle" });
    const invoiceExists = () =>
      withDb(async (c) => {
        const r = await c.query('SELECT COUNT(*)::int AS n FROM "Invoice" WHERE "subscriptionId" = $1', [
          subscriptionId,
        ]);
        return r.rows[0].n;
      });
    await clickAndConfirm(page, /Generate Invoice/i, invoiceExists, (n) => n > 0);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('a:has-text("Download PDF")').first().waitFor({ state: "visible", timeout: 15000 });

    // ---- 7. Download the invoice PDF and assert it's a real PDF.
    const pdfHref = await page.locator('a:has-text("Download PDF")').first().getAttribute("href");
    assert(pdfHref && pdfHref.includes("/api/invoices/"), `unexpected PDF href: ${pdfHref}`);
    const pdfResp = await page.request.get(`${BASE_URL}${pdfHref}`);
    assert(pdfResp.status() === 200, `invoice PDF should be 200, got ${pdfResp.status()}`);
    const pdfBytes = await pdfResp.body();
    assert(pdfBytes.length > 500, `invoice PDF suspiciously small: ${pdfBytes.length} bytes`);
    assert(pdfBytes.slice(0, 5).toString("latin1") === "%PDF-", "invoice download is not a PDF");

    // ---- 8. Record the parent's payment for exactly the amount owed.
    await page.locator("form input#amount").fill(money(owed));
    await page.getByRole("button", { name: /Record payment/i }).click();

    // ---- 9. Assert the account reconciles to exactly £0.00.
    await poll(
      () =>
        withDb(async (c) => {
          const r = await c.query(
            `SELECT COALESCE(SUM(CASE WHEN operation='CREDIT' THEN amount ELSE -amount END),0) AS cash
             FROM "LedgerEntry" WHERE "subscriptionId" = $1
               AND reason IN ('LESSON_DELIVERED','PAYMENT','MANUAL_CORRECTION','VENUE_FEE_ITEMISED','LATE_CANCELLATION_CHARGE','CANCELLATION_ADJUSTMENT')`,
            [subscriptionId]
          );
          return money(r.rows[0].cash);
        }),
      (v) => v === "0.00",
      { timeout: 15000 }
    );

    // And it's reflected in the UI cash-balance tile.
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("£0.00").first().waitFor({ state: "visible", timeout: 10000 });

    console.log(`JOURNEY_OK (teacher=${email}, subscription=${subscriptionId}, owed+paid=£${money(owed)})`);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error("JOURNEY_FAIL");
  console.error(error);
  process.exit(1);
});
