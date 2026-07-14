const { chromium } = require("playwright");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectVisible(page, text) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: "visible", timeout: 30000 });
}

async function expectHealthyPage(page, path, marker) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  assert(response, `No response for ${path}`);
  assert(response.status() < 400, `Bad status ${response.status()} for ${path}`);
  assert(!(await page.getByText("Application error", { exact: false }).count()), `Application error on ${path}`);
  if (marker) {
    await expectVisible(page, marker);
  }
}

async function teacherLogin(page) {
  const csrfResponse = await page.context().request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfJson = await csrfResponse.json();
  const signInResponse = await page.context().request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      csrfToken: csrfJson.csrfToken,
      email: "teacher@example.com",
      password: "changeme123",
      callbackUrl: `${BASE_URL}/dashboard`,
      json: "true",
    },
  });
  assert(signInResponse.ok(), `Teacher sign-in request failed with ${signInResponse.status()}`);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await expectVisible(page, "Income forecast");
}

async function parentLogin(page) {
  await page.goto(`${BASE_URL}/parent/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Access code").fill("410001");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/parent\/students\//, { timeout: 30000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await teacherLogin(page);

    const dashboardRoutes = [
      ["/dashboard", "Income forecast"],
      ["/dashboard/students", "Students"],
      ["/dashboard/payers", "Payers"],
      ["/dashboard/teaching-locations", "Teaching locations"],
      ["/dashboard/lesson-types", "Lesson types"],
      ["/dashboard/group-classes", "Group classes"],
      ["/dashboard/lessons", "Lessons"],
      ["/dashboard/courses", "Courses"],
      ["/dashboard/curriculum-templates", "Curriculum templates"],
      ["/dashboard/contract", "Contract"],
      ["/dashboard/forecast", "Income forecasting"],
      ["/dashboard/billing", "Platform billing"],
      ["/dashboard/checkin", "Check-in"],
      ["/dashboard/gift-cards", "Gift cards"],
      ["/dashboard/promo-codes", "Promo codes"],
      ["/dashboard/resources", "Resources"],
      ["/dashboard/assignments", "Assignments"],
      ["/dashboard/loans", "Loans"],
      ["/dashboard/maintenance", "Maintenance reminders"],
      ["/dashboard/mileage", "Mileage"],
      ["/dashboard/travel-times", "Travel times"],
      ["/dashboard/waitlist", "Waitlist"],
      ["/dashboard/organisation", "Organisation"],
      ["/dashboard/subjects", "Subjects"],
      ["/dashboard/tax-pack", "Tax pack"],
      ["/dashboard/term-calendars", "Term calendars"],
      ["/dashboard/timetable/new", "Generate timetable"],
      ["/dashboard/timetable/bulk", "Bulk timetable"],
      ["/dashboard/today", "Today"],
      ["/dashboard/unavailability", "Unavailability"],
      ["/dashboard/incidents", "Incidents"],
      ["/dashboard/certifications", "Certifications"],
      ["/dashboard/route-check", "Route feasibility"],
      ["/dashboard/referrals", "Top referrers"],
      ["/dashboard/embeds", "Embeddable onboarding"],
      ["/dashboard/accounting-export", "Accounting export"],
    ];

    for (const [path, marker] of dashboardRoutes) {
      await expectHealthyPage(page, path, marker);
    }

    await page.goto(`${BASE_URL}/dashboard/students`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Ava Bennett" }).click();
    await page.waitForURL(/\/dashboard\/students\//);
    await expectVisible(page, "Subscriptions");
    const studentUrl = page.url().replace(BASE_URL, "");
    await expectHealthyPage(page, `${studentUrl}/edit`, "Edit student");
    await expectHealthyPage(page, `${studentUrl}/progress-summary`, "Progress summary");

    await page.goto(`${BASE_URL}/dashboard/payers`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Rachel Bennett" }).click();
    await page.waitForURL(/\/dashboard\/payers\//);
    await expectVisible(page, "Pupils");
    const payerUrl = page.url().replace(BASE_URL, "");
    await expectHealthyPage(page, `${payerUrl}/edit`, "Edit payer");

    await page.goto(`${BASE_URL}/dashboard/teaching-locations`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Ashdown Primary" }).click();
    await page.waitForURL(/\/dashboard\/teaching-locations\//);
    await expectVisible(page, "Rooms");
    const locationUrl = page.url().replace(BASE_URL, "");
    await expectHealthyPage(page, `${locationUrl}/edit`, "Edit teaching location");

    await page.goto(`${BASE_URL}/dashboard/group-classes`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Tuesday Junior Ensemble" }).click();
    await page.waitForURL(/\/dashboard\/group-classes\//);
    await expectVisible(page, "Bookings");

    await page.goto(`${BASE_URL}/dashboard/lessons`, { waitUntil: "networkidle" });
    await page.locator('a[href^="/dashboard/lessons/"]').first().click();
    await page.waitForURL(/\/dashboard\/lessons\//);
    await expectVisible(page, "Lesson note");

    await page.goto(`${BASE_URL}/dashboard/courses`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Flute Foundations" }).click();
    await page.waitForURL(/\/dashboard\/courses\//);
    await expectVisible(page, "Purchases");

    await page.goto(`${BASE_URL}/dashboard/lesson-types`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Flute 1:1" }).click();
    await page.waitForURL(/\/dashboard\/lesson-types\//);
    await expectVisible(page, "Default duration");

    await page.goto(`${BASE_URL}/dashboard/term-calendars`, { waitUntil: "networkidle" });
    await page.locator('a[href^="/dashboard/term-calendars/"]').first().click();
    await page.waitForURL(/\/dashboard\/term-calendars\//);
    await expectVisible(page, "Holiday periods");

    await parentLogin(page);
    await expectVisible(page, "Ava Bennett");
    const parentBase = page.url().replace(/\/$/, "");
    const parentRoutes = [
      ["", "Next lesson"],
      ["/calendar", "Calendar"],
      ["/notes", "Lesson notes"],
      ["/ledger", "Ledger"],
      ["/resources", "Resources"],
      ["/assignments", "Assignments"],
      ["/courses", "Courses"],
      ["/extras", "Extras"],
      ["/maintenance", "Maintenance"],
      ["/classes", "Classes"],
    ];

    for (const [suffix, marker] of parentRoutes) {
      const response = await page.goto(`${parentBase}${suffix}`, { waitUntil: "networkidle" });
      assert(response, `No response for parent route ${suffix}`);
      assert(response.status() < 400, `Bad status ${response.status()} for parent route ${suffix}`);
      await expectVisible(page, marker);
    }

    console.log("SMOKE_OK");
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error("SMOKE_FAIL");
  console.error(error);
  process.exit(1);
});
