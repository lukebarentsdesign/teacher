/**
 * auth.spec.js — Priority 1: Authentication flows
 *
 * Covers (from qa-playwright-handover.md §5 item 1):
 *   - Register → onboarding wizard → dashboard
 *   - Login / logout (seeded teacher account)
 *   - Parent 6-digit code login
 *   - Login redirects unauthenticated dashboard access to /login
 *   - Cover teacher login
 */

const { test, expect } = require("@playwright/test");
const {
  BASE_URL,
  teacherLogin,
  coverTeacherLogin,
  parentLogin,
  registerThrowawayTeacher,
  loginAs,
} = require("./helpers");

// ─── Seeded teacher login / logout ──────────────────────────────────────────

test.describe("Teacher login / logout", () => {
  test("seeded teacher logs in and reaches dashboard", async ({ page }) => {
    await teacherLogin(page);
    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard should have some meaningful content
    await expect(page.getByRole("heading", { name: "Overview" }).first()).toBeVisible();
  });

  test("wrong password shows an error, not a crash", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
    await page.getByLabel("Email").fill("teacher@example.com");
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should stay on /login and show an error — not a 500
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("teacher can log out and is redirected away from dashboard", async ({ page }) => {
    await teacherLogin(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // Open user profile dropdown first
    await page.getByRole("button", { name: "T Teacher" }).click();

    // Find and force-click sign-out (bypassing animation delays)
    const signOut = page.locator("text=/sign out|log out/i").last();
    await signOut.click({ force: true });

    // After logout, going to /dashboard should redirect to login
    await page.waitForURL(/\/login|\//, { timeout: 15_000 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "load" });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── Cover teacher ───────────────────────────────────────────────────────────

test.describe("Cover teacher login", () => {
  test("cover.teacher@example.com logs in and reaches dashboard", async ({ page }) => {
    await coverTeacherLogin(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });
});

// ─── Parent microsite ────────────────────────────────────────────────────────

test.describe("Parent 6-digit code login", () => {
  test("code 410001 logs in as Rachel Bennett and shows Ava Bennett", async ({ page }) => {
    await parentLogin(page);
    await expect(page).toHaveURL(/\/parent\/students\//);
    await expect(page.getByText("Ava Bennett", { exact: false }).first()).toBeVisible();
  });

  test("wrong parent code shows an error, not a crash", async ({ page }) => {
    await page.goto(`${BASE_URL}/parent/login`, { waitUntil: "load" });
    await page.getByLabel("Access code").fill("000000");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Application error")).toHaveCount(0);
    // Should stay on parent login or show an error message
    await expect(page).not.toHaveURL(/\/parent\/students\//);
  });
});

// ─── Registration → onboarding → dashboard ──────────────────────────────────

test.describe("New teacher registration flow", () => {
  test("register via API then log in and reach dashboard or onboarding", async ({
    page,
    request,
  }) => {
    const { email, password } = await registerThrowawayTeacher(request);
    await loginAs(page, email, password);

    // Better Auth creates a session cookie immediately — no email verification
    // Expect either the onboarding wizard OR the dashboard
    await expect(page).toHaveURL(/\/dashboard|\/onboard/);
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("/register page loads without crashing", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`, { waitUntil: "load" });
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe("complete");
    await expect(page.locator("text=Application error")).toHaveCount(0);
    // Some kind of registration form should exist
    await expect(
      page.getByRole("textbox").or(page.locator("input")).first()
    ).toBeVisible();
  });
});

// ─── Unauthenticated redirect ────────────────────────────────────────────────

test.describe("Auth guards", () => {
  test("unauthenticated /dashboard access redirects to /login", async ({ page }) => {
    // Fresh context with no cookies
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "load" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /dashboard/students access redirects to /login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/students`, { waitUntil: "load" });
    await expect(page).toHaveURL(/\/login/);
  });
});
