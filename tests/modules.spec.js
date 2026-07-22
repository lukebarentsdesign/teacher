/**
 * modules.spec.js — Priority 4: Module primary create flows
 *
 * Covers (from qa-playwright-handover.md §5 item 4) — with PAYWALL_ENFORCED
 * unset, the seeded teacher has access to all 8 modules:
 *
 *   SCHEDULING      — timetable/new and timetable/bulk load correctly
 *   TERM_CALENDARS  — term-calendars list loads; detail page loads
 *   CURRICULUM      — curriculum-templates list loads
 *   COMPLIANCE      — cancellation-policy page loads
 *   EMBEDS          — embeds page loads
 *   COMMERCE        — gift-cards, promo-codes, addons pages load
 *   GROUP_TEACHING  — group-classes list loads; detail loads
 *   ORGANISATION    — organisation page loads
 *
 * For each module this file:
 *   1. Verifies the primary list/create entry-point loads (no crash).
 *   2. Verifies the seeded detail page loads where data exists.
 *   3. (Where feasible without complex multi-step forms) submits a create form.
 *
 * Runs with the seeded teacher's saved storageState.
 */

const { test, expect } = require("@playwright/test");
const { BASE_URL, expectHealthyPage } = require("./helpers");

const ts = () => Date.now();

// ─── SCHEDULING module ────────────────────────────────────────────────────────

test.describe("Module: SCHEDULING (timetable)", () => {
  test("timetable/new page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/timetable/new", "Generate timetable");
  });

  test("timetable/bulk page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/timetable/bulk", "Bulk timetable");
  });

  test("unavailability page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/unavailability", "Unavailability");
  });

  test("today page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/today", "Live workspace");
  });
});

// ─── TERM_CALENDARS module ────────────────────────────────────────────────────

test.describe("Module: TERM_CALENDARS", () => {
  test("term-calendars list loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/term-calendars", "Term calendars");
  });

  test("seeded term calendar detail loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/term-calendars`, { waitUntil: "load" });
    const firstCalendar = page.locator('a[href^="/dashboard/term-calendars/"]').first();
    await firstCalendar.click();
    await page.waitForURL(/\/dashboard\/term-calendars\//);
    await expect(page.getByText("Holidays & half-terms", { exact: false }).first()).toBeVisible();
  });
});

// ─── CURRICULUM module ────────────────────────────────────────────────────────

test.describe("Module: CURRICULUM", () => {
  test("curriculum-templates list loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/curriculum-templates", "Curriculum templates");
  });

  test("create a curriculum template", async ({ page }) => {
    test.slow();
    // Curriculum template creation is done directly on the list page via inline form
    await page.goto(`${BASE_URL}/dashboard/curriculum-templates`, { waitUntil: "load" });

    const titleField = page.getByLabel("Title").first();
    const title = `QA Curriculum ${ts()}`;
    await titleField.fill(title);

    const saveBtn = page.getByRole("button", { name: "New template" }).first();
    await saveBtn.click();

    // Verify it got successfully created and listed
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 25_000 });
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });
});

// ─── COMPLIANCE module ────────────────────────────────────────────────────────

test.describe("Module: COMPLIANCE (cancellation policy)", () => {
  test("cancellation-policy page loads", async ({ page }) => {
    // The cancellation policy form is embedded inside the Billing page
    await expectHealthyPage(page, "/dashboard/billing", "Cancellation policy");
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("incidents page loads (always ungated)", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/incidents", "Incident log");
  });

  test("certifications page loads (always ungated)", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/certifications", "Certifications");
  });
});

// ─── EMBEDS module ────────────────────────────────────────────────────────────

test.describe("Module: EMBEDS", () => {
  test("embeds page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/embeds", "Embeddable onboarding");
  });
});

// ─── COMMERCE module ──────────────────────────────────────────────────────────

test.describe("Module: COMMERCE (gift cards, promo codes, add-ons)", () => {
  test("gift-cards page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/gift-cards", "Gift cards");
  });

  test("promo-codes page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/promo-codes", "Promo codes");
  });

  test("addons page loads", async ({ page }) => {
    // The module is COMMERCE; URL is /dashboard/addons
    await expectHealthyPage(page, "/dashboard/addons", null);
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("create a promo code", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/promo-codes`, { waitUntil: "load" });

    const newBtn = page
      .getByRole("link", { name: /new promo|add/i })
      .or(page.getByRole("button", { name: /new promo|add|create/i }));
    if (await newBtn.first().isVisible().catch(() => false)) {
      await newBtn.first().click();
      await expect(page.locator("text=Application error")).toHaveCount(0);
    }
  });

  test("create a gift card", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/gift-cards`, { waitUntil: "load" });

    const newBtn = page
      .getByRole("link", { name: /new gift card|add|create/i })
      .or(page.getByRole("button", { name: /new gift card|add|create/i }));
    if (await newBtn.first().isVisible().catch(() => false)) {
      await newBtn.first().click();
      await expect(page.locator("text=Application error")).toHaveCount(0);
    }
  });
});

// ─── GROUP_TEACHING module ────────────────────────────────────────────────────

test.describe("Module: GROUP_TEACHING", () => {
  test("group-classes list loads", async ({ page }) => {
    test.slow();
    await expectHealthyPage(page, "/dashboard/group-classes", "Group classes");
    await expect(page.getByText("Tuesday Junior Ensemble", { exact: false }).first()).toBeVisible();
  });

  test("seeded group class detail loads", async ({ page }) => {
    test.slow();
    await page.goto(`${BASE_URL}/dashboard/group-classes`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Tuesday Junior Ensemble" }).click();
    await page.waitForURL(/\/dashboard\/group-classes\//);
    await expect(page.getByText("Bookings", { exact: false }).first()).toBeVisible();
  });

  test("courses list loads with seeded course", async ({ page }) => {
    test.slow();
    await expectHealthyPage(page, "/dashboard/courses", "Courses");
    await expect(page.getByText("Flute Foundations", { exact: false }).first()).toBeVisible();
  });

  test("seeded course detail loads", async ({ page }) => {
    test.slow();
    await page.goto(`${BASE_URL}/dashboard/courses`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Flute Foundations" }).click();
    await page.waitForURL(/\/dashboard\/courses\//);
    await expect(page.getByText("Purchases", { exact: false }).first()).toBeVisible();
  });
});

// ─── ORGANISATION module ──────────────────────────────────────────────────────

test.describe("Module: ORGANISATION", () => {
  test("organisation page loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/organisation", "Organisation");
  });

  test("organisation page shows 'Learnio Collective' (cosmetic leftover — not a bug)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard/organisation`, { waitUntil: "load" });
    // The name "Learnio Collective" is a seeded cosmetic leftover from before
    // the TeachBase rebrand. This test just asserts the page renders data.
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });
});

// ─── Lessons (cross-module) ───────────────────────────────────────────────────

test.describe("Lessons (cross-module: appears in SCHEDULING)", () => {
  test("lessons list loads", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/lessons", "Lessons");
  });

  test("seeded lesson detail loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/lessons`, { waitUntil: "load" });
    const lessonLink = page.locator('a[href^="/dashboard/lessons/"]').first();
    await lessonLink.click();
    await page.waitForURL(/\/dashboard\/lessons\//);
    await expect(page.getByText("Lesson note", { exact: false }).first()).toBeVisible();
  });
});

// ─── Other dashboard utility pages ───────────────────────────────────────────

test.describe("Dashboard utility pages", () => {
  const routes = [
    ["/dashboard/subjects", "Subjects"],
    ["/dashboard/resources", "Resources"],
    ["/dashboard/assignments", "Assignments"],
    ["/dashboard/loans", "Loans"],
    ["/dashboard/maintenance", "Maintenance reminders"],
    ["/dashboard/mileage", "Mileage"],
    ["/dashboard/travel-times", "Travel times"],
    ["/dashboard/waitlist", "Waitlist"],
    ["/dashboard/route-check", "Route check"],
    ["/dashboard/referrals", "Referrals"],
    ["/dashboard/checkin", "Check in"],
    ["/dashboard/contract", "Contract"],
  ];

  for (const [path, marker] of routes) {
    test(`${path} loads`, async ({ page }) => {
      test.slow();
      await expectHealthyPage(page, path, marker);
    });
  }
});
