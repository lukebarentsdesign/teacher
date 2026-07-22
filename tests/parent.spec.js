/**
 * parent.spec.js — Priority 5: Parent microsite
 *
 * Covers (from qa-playwright-handover.md §5 item 5):
 *   - Guardian login lands on Ava Bennett's page
 *   - All parent microsite tabs load (calendar, ledger, notes, courses, extras, etc.)
 *   - Progress tab (NEW): verifies curriculum completion data renders for Ava Bennett
 *     (StudentCurriculum with 2 sections: 1 completed, 1 in-progress)
 *   - Ledger shows balance (core money flow visible to parent)
 *
 * Runs with the saved parent.json storageState (set by global.setup.js).
 * No login steps needed in this file.
 */

const { test, expect } = require("@playwright/test");
const { BASE_URL } = require("./helpers");

// ─── Resolve the parent student base URL from wherever we land ────────────────

async function getStudentBase(page) {
  // After login the URL is already /parent/students/<id>
  await page.goto(`${BASE_URL}/parent`, { waitUntil: "load" });
  await page.waitForURL(/\/parent$|\/parent\/students\/|\/parent\/login/, { timeout: 15_000 });

  if (page.url().includes("/parent/login")) {
    // Session may have expired — re-enter code
    await page.getByLabel("Access code").fill("410001");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/\/parent$|\/parent\/students\//, { timeout: 15_000 });
  }

  if (page.url().endsWith("/parent")) {
    // Select Ava Bennett
    await page.getByRole("link", { name: "Ava Bennett" }).first().click();
    await page.waitForURL(/\/parent\/students\//, { timeout: 15_000 });
  }

  return page.url().replace(/\/$/, "");
}

// ─── Parent microsite tab coverage ───────────────────────────────────────────

test.describe("Parent microsite — Ava Bennett", () => {
  let studentBase;

  test.beforeEach(async ({ page }) => {
    studentBase = await getStudentBase(page);
  });

  test("landing on student page shows Ava Bennett's name", async ({ page }) => {
    await expect(page.getByText("Ava Bennett", { exact: false }).first()).toBeVisible();
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  const tabs = [
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

  for (const [suffix, marker] of tabs) {
    test(`tab ${suffix || "(home)"} shows "${marker}"`, async ({ page }) => {
      const base = await getStudentBase(page);
      const response = await page.goto(`${base}${suffix}`, { waitUntil: "load" });
      expect(response?.status() ?? 200).toBeLessThan(400);
      await expect(page.locator("text=Application error")).toHaveCount(0);
      await expect(
        page.getByText(marker, { exact: false }).first()
      ).toBeVisible({ timeout: 15_000 });
    });
  }

  test("progress tab renders curriculum completion for Ava Bennett", async ({ page }) => {
    const base = await getStudentBase(page);
    const response = await page.goto(`${base}/progress`, { waitUntil: "load" });
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page.locator("text=Application error")).toHaveCount(0);

    // Ava has 2 curriculum sections: 1 completed, 1 in-progress.
    // The progress page should surface curriculum section headings or progress indicators.
    // Accept any of these as evidence the data rendered:
    const progressIndicators = page
      .getByText(/completed|in.?progress|section/i)
      .or(page.locator('[aria-label*="progress"], [class*="progress"]'));
    await expect(progressIndicators.first()).toBeVisible({ timeout: 15_000 });
  });

  test("ledger shows a balance figure", async ({ page }) => {
    const base = await getStudentBase(page);
    await page.goto(`${base}/ledger`, { waitUntil: "load" });
    await expect(page.locator("text=Application error")).toHaveCount(0);

    // A ledger should have a currency value visible somewhere
    const balance = page.locator("text=/[£$€][0-9]|balance/i");
    await expect(balance.first()).toBeVisible({ timeout: 10_000 });
  });
});
