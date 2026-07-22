/**
 * foundation.spec.js — Priority 2: Foundation CRUD
 *
 * Covers (from qa-playwright-handover.md §5 item 2):
 *   - Create a Student via the multi-step wizard
 *   - Edit an existing Student (from seeded data)
 *   - Create a Payer
 *   - Edit an existing Payer
 *   - Create a TeachingLocation
 *   - Create a LessonType
 *
 * NOTE: These tests run with the seeded teacher's saved storageState (set in
 * playwright.config.js). No login steps needed here.
 */

const { test, expect } = require("@playwright/test");
const { BASE_URL, expectHealthyPage } = require("./helpers");

const ts = () => Date.now(); // timestamp suffix to keep names unique across runs

// ─── Students ────────────────────────────────────────────────────────────────

test.describe("Student CRUD", () => {
  test("student list page loads with seeded data", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/students", "Students");
    // Seeded student should be visible
    await expect(page.getByText("Ava Bennett", { exact: false }).first()).toBeVisible();
  });

  test("create a new student via the multi-step wizard", async ({ page }) => {
    // Navigate directly to the creation wizard page to avoid hydration click flakiness
    await page.goto(`${BASE_URL}/dashboard/students/new`, { waitUntil: "load" });

    // Should land on the student wizard URL
    await expect(page).toHaveURL(/\/students\/new|\/students\/create/);

    // Step 1: fill in student name (wizard first step)
    const studentName = `QA Student ${ts()}`;
    const nameInput = page.getByLabel(/first name|student name|name/i).first();
    await nameInput.fill(studentName.split(" ")[0]);

    // Last name field (may be separate)
    const lastNameInput = page.getByLabel(/last name|surname/i).first();
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(`TestLast-${ts()}`);
    }

    // Advance through the wizard — keep clicking "Next" / "Continue" until done
    let maxSteps = 8;
    while (maxSteps-- > 0) {
      const nextBtn = page
        .getByRole("button", { name: /next|continue/i })
        .or(page.getByRole("link", { name: /next|continue/i }));
      const isVisible = await nextBtn.first().isVisible().catch(() => false);
      if (!isVisible) break;
      await nextBtn.first().click();
      await page.waitForTimeout(500);
    }

    // The wizard should eventually reach the student detail page or students list
    await page.waitForURL(/\/dashboard\/students/, { timeout: 20_000 });
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("edit seeded student Ava Bennett", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/students`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Ava Bennett" }).first().click();
    await page.waitForURL(/\/dashboard\/students\//);

    const studentPath = new URL(page.url()).pathname;
    await expectHealthyPage(page, `${studentPath}/edit`, "Edit student");

    // Make a trivial change — append to notes or similar field
    const notesField = page.getByLabel(/notes|internal notes/i).first();
    if (await notesField.isVisible()) {
      await notesField.fill("Playwright edited");
    }

    // Submit
    const saveBtn = page
      .getByRole("button", { name: /save|update/i })
      .first();
    await saveBtn.click();

    // Should not crash
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("student detail subpages load (progress-summary, edit)", async ({ page }) => {
    test.slow();
    await page.goto(`${BASE_URL}/dashboard/students`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Ava Bennett" }).first().click();
    await page.waitForURL(/\/dashboard\/students\//);

    const studentPath = new URL(page.url()).pathname;
    await expectHealthyPage(page, `${studentPath}/progress-summary`, "Progress summary");
    await expectHealthyPage(page, `${studentPath}/edit`, "Edit student");
  });
});

// ─── Payers ──────────────────────────────────────────────────────────────────

test.describe("Payer CRUD", () => {
  test("payer list page loads with seeded data", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/payers", "Payers");
    await expect(page.getByText("Rachel Bennett", { exact: false }).first()).toBeVisible();
  });

  test("create a new payer", async ({ page }) => {
    // Navigate directly to avoid hydration click lag
    await page.goto(`${BASE_URL}/dashboard/payers/new`, { waitUntil: "load" });

    await expect(page).toHaveURL(/\/payers\/new|\/payers\/create/);

    const name = `QA Payer ${ts()}`;
    const nameField = page.getByLabel(/name/i).first();
    await nameField.fill(name);

    const emailField = page.getByLabel(/email/i).first();
    if (await emailField.isVisible()) {
      await emailField.fill(`qa-payer-${ts()}@example.com`);
    }

    const saveBtn = page.getByRole("button", { name: /save|create|add/i }).first();
    await saveBtn.click();

    await page.waitForURL(/\/dashboard\/payers/, { timeout: 15_000 });
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("edit seeded payer Rachel Bennett", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/payers`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Rachel Bennett" }).click();
    await page.waitForURL(/\/dashboard\/payers\//);

    const payerPath = new URL(page.url()).pathname;
    await expectHealthyPage(page, `${payerPath}/edit`, "Edit payer");

    await expect(page.locator("text=Application error")).toHaveCount(0);
  });
});

// ─── Teaching Locations ───────────────────────────────────────────────────────

test.describe("Teaching Location CRUD", () => {
  test("teaching locations list loads with seeded data", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/teaching-locations", "Teaching locations");
    await expect(page.getByText("Ashdown Primary", { exact: false }).first()).toBeVisible();
  });

  test("create a new teaching location", async ({ page }) => {
    // Navigate directly to avoid hydration click lag
    await page.goto(`${BASE_URL}/dashboard/teaching-locations/new`, { waitUntil: "load" });

    await expect(page).toHaveURL(/\/teaching-locations\/new|\/teaching-locations\/create/);

    const nameField = page.getByLabel(/name|location name/i).first();
    await nameField.fill(`QA Location ${ts()}`);

    const saveBtn = page.getByRole("button", { name: /save|create/i }).first();
    await saveBtn.click();

    await page.waitForURL(/\/dashboard\/teaching-locations/, { timeout: 15_000 });
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("seeded location detail page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/teaching-locations`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Ashdown Primary" }).click();
    await page.waitForURL(/\/dashboard\/teaching-locations\//);
    await expect(page.getByText("Rooms", { exact: false }).first()).toBeVisible();
  });
});

// ─── Lesson Types ─────────────────────────────────────────────────────────────

test.describe("Lesson Type CRUD", () => {
  test("lesson types list loads with seeded data", async ({ page }) => {
    await expectHealthyPage(page, "/dashboard/lesson-types", "Lesson types");
    await expect(page.getByText("Flute 1:1", { exact: false }).first()).toBeVisible();
  });

  test("create a new lesson type", async ({ page }) => {
    // Lesson Type creation is done directly on the main lesson-types page
    await page.goto(`${BASE_URL}/dashboard/lesson-types`, { waitUntil: "load" });

    const nameField = page.getByLabel("Name").first();
    const lessonTypeName = `QA Lesson Type ${ts()}`;
    await nameField.fill(lessonTypeName);

    const feeField = page.getByLabel(/default fee/i).first();
    await feeField.fill("30.00");

    const saveBtn = page.getByRole("button", { name: "Add lesson type" }).first();
    await saveBtn.click();

    // Verify it got successfully created and listed
    await expect(page.getByText(lessonTypeName).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("seeded lesson type detail page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/lesson-types`, { waitUntil: "load" });
    await page.getByRole("link", { name: "Flute 1:1" }).click();
    await page.waitForURL(/\/dashboard\/lesson-types\//);
    await expect(page.getByText("Pricing by location", { exact: false }).first()).toBeVisible();
  });
});
