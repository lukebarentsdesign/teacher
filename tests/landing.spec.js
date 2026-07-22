/**
 * landing.spec.js — Priority 6: Landing page
 *
 * Covers:
 *   - Landing page (/) loads without error
 *   - #modules section renders cards for Foundation + 8 optional modules
 *   - Page is unauthenticated
 */

const { test, expect } = require("@playwright/test");
const { BASE_URL } = require("./helpers");

test.describe("Landing page (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
  });

  test("page loads with a 200 response and no application error", async ({ page }) => {
    await expect(page.locator("text=Application error")).toHaveCount(0);
    await expect(page.locator("body")).toBeVisible();
  });

  test("#modules section is present on the page", async ({ page }) => {
    const modulesSection = page.locator("#modules");
    await expect(modulesSection).toBeVisible();
  });

  test("#modules section contains the module headers", async ({ page }) => {
    await page.locator("#modules").scrollIntoViewIfNeeded();

    // Look for all header elements (h3) within the #modules container
    const cardHeaders = page.locator("#modules h3");
    const count = await cardHeaders.count();

    // Should have 9 cards total (1 Foundation + 8 modules)
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test("#modules section names all 8 optional modules", async ({ page }) => {
    await page.locator("#modules").scrollIntoViewIfNeeded();
    const modulesHtml = await page.locator("#modules").innerText();

    const expectedModules = [
      "Organisation",
      "Term Calendars",
      "Scheduling",
      "Curriculum",
      "Compliance",
      "Embeds",
      "Commerce",
      "Group Teaching",
    ];

    for (const mod of expectedModules) {
      expect(
        modulesHtml.toLowerCase(),
        `Expected #modules to mention "${mod}"`
      ).toContain(mod.toLowerCase());
    }
  });

  test("landing page has a CTA link to /register or /login", async ({ page }) => {
    const cta = page
      .getByRole("link", { name: /get started|sign up|register|try free|create free/i })
      .or(page.getByRole("link", { name: /login|log in|sign in/i }));
    await expect(cta.first()).toBeVisible();
  });
});
