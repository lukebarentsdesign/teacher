const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

async function expectHealthyPage(page, path, marker) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  expect(response, `no response for ${path}`).toBeTruthy();
  expect(response.status(), `bad status for ${path}`).toBeLessThan(400);
  await expect(page.locator("text=Application error")).toHaveCount(0);
  await expect(page.locator("text=Invalid email or password.")).toHaveCount(0);
  if (marker) {
    await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
  } else {
    await expect(page.locator("main")).toBeVisible();
  }
}

async function teacherLogin(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("teacher@example.com");
  await page.getByLabel("Password").fill("changeme123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await expect(page.locator("main")).toBeVisible();
}

async function parentLogin(page) {
  await page.goto(`${BASE_URL}/parent/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Access code").fill("410001");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/parent\/students\//, { timeout: 30000 });
}

test.describe("TeachBase seeded-account smoke", () => {
  test("teacher dashboard surfaces load", async ({ page }) => {
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
  });

  test("teacher detail pages from seeded data load", async ({ page }) => {
    await teacherLogin(page);

    await page.goto(`${BASE_URL}/dashboard/students`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Ava Bennett" }).click();
    await page.waitForURL(/\/dashboard\/students\//);
    await expect(page.getByText("Subscriptions", { exact: false }).first()).toBeVisible();

    const studentUrl = page.url();
    await expectHealthyPage(page, studentUrl.replace(BASE_URL, "") + "/edit", "Edit student");
    await expectHealthyPage(
      page,
      studentUrl.replace(BASE_URL, "") + "/progress-summary",
      "Progress summary"
    );

    await page.goto(`${BASE_URL}/dashboard/payers`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Rachel Bennett" }).click();
    await page.waitForURL(/\/dashboard\/payers\//);
    await expect(page.getByText("Pupils", { exact: false }).first()).toBeVisible();
    const payerUrl = page.url();
    await expectHealthyPage(page, payerUrl.replace(BASE_URL, "") + "/edit", "Edit payer");

    await page.goto(`${BASE_URL}/dashboard/teaching-locations`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Ashdown Primary" }).click();
    await page.waitForURL(/\/dashboard\/teaching-locations\//);
    await expect(page.getByText("Rooms", { exact: false }).first()).toBeVisible();
    const locationUrl = page.url();
    await expectHealthyPage(page, locationUrl.replace(BASE_URL, "") + "/edit", "Edit teaching location");

    await page.goto(`${BASE_URL}/dashboard/group-classes`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Tuesday Junior Ensemble" }).click();
    await page.waitForURL(/\/dashboard\/group-classes\//);
    await expect(page.getByText("Bookings", { exact: false }).first()).toBeVisible();

    await page.goto(`${BASE_URL}/dashboard/lessons`, { waitUntil: "networkidle" });
    const lessonLink = page.locator('a[href^="/dashboard/lessons/"]').first();
    await lessonLink.click();
    await page.waitForURL(/\/dashboard\/lessons\//);
    await expect(page.getByText("Lesson note", { exact: false }).first()).toBeVisible();

    await page.goto(`${BASE_URL}/dashboard/courses`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Flute Foundations" }).click();
    await page.waitForURL(/\/dashboard\/courses\//);
    await expect(page.getByText("Purchases", { exact: false }).first()).toBeVisible();

    await page.goto(`${BASE_URL}/dashboard/lesson-types`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Flute 1:1" }).click();
    await page.waitForURL(/\/dashboard\/lesson-types\//);
    await expect(page.getByText("Default duration", { exact: false }).first()).toBeVisible();

    await page.goto(`${BASE_URL}/dashboard/term-calendars`, { waitUntil: "networkidle" });
    const calendarLink = page.locator('a[href^="/dashboard/term-calendars/"]').first();
    await calendarLink.click();
    await page.waitForURL(/\/dashboard\/term-calendars\//);
    await expect(page.getByText("Holiday periods", { exact: false }).first()).toBeVisible();
  });

  test("parent microsite seeded flow loads", async ({ page }) => {
    await parentLogin(page);

    await expect(page.getByText("Ava Bennett", { exact: false }).first()).toBeVisible();

    const studentBase = page.url().replace(/\/$/, "");
    const childRoutes = [
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

    for (const [suffix, marker] of childRoutes) {
      const response = await page.goto(`${studentBase}${suffix}`, { waitUntil: "networkidle" });
      expect(response, `no response for parent route ${suffix}`).toBeTruthy();
      expect(response.status(), `bad status for parent route ${suffix}`).toBeLessThan(400);
      await expect(page.locator("text=Application error")).toHaveCount(0);
      await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
    }
  });
});
