/**
 * helpers.js — shared utilities for TeachBase Playwright tests.
 *
 * Import only what you need; nothing here causes side effects on import.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/** Confirm a page loaded successfully and shows no crash indicators. */
async function expectHealthyPage(page, path, marker) {
  const response = await page.goto(
    path.startsWith("http") ? path : `${BASE_URL}${path}`,
    { waitUntil: "load" }
  );
  if (!response) throw new Error(`No HTTP response for ${path}`);
  if (response.status() >= 400)
    throw new Error(`Status ${response.status()} for ${path}`);
  const errors = await page.locator("text=Application error").count();
  if (errors > 0) throw new Error(`Application error on ${path}`);
  if (marker) {
    await page.getByText(marker, { exact: false }).first().waitFor({ state: "visible", timeout: 15_000 });
  }
}

/**
 * Log in as the seeded teacher via the UI login form.
 * Use only in auth.spec.js — other specs use the saved storageState.
 */
async function teacherLogin(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.getByLabel("Email").fill("teacher@example.com");
  await page.getByLabel("Password").fill("changeme123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/**
 * Log in as the seeded cover teacher via the UI login form.
 */
async function coverTeacherLogin(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.getByLabel("Email").fill("cover.teacher@example.com");
  await page.getByLabel("Password").fill("cover12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/**
 * Log in as the guardian (parent microsite) via the 6-digit code.
 */
async function parentLogin(page) {
  await page.goto(`${BASE_URL}/parent/login`, { waitUntil: "load" });
  await page.getByLabel("Access code").fill("410001");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/parent\/students\//, { timeout: 30_000 });
}

/**
 * Register a brand-new throwaway teacher account via the API endpoint
 * (Better Auth — no email verification required).
 * Returns { email, password }.
 */
async function registerThrowawayTeacher(request) {
  const suffix = Date.now();
  const email = `qa-throwaway-${suffix}@example.com`;
  const password = "Qa$ecure1!";

  const resp = await request.post(`${BASE_URL}/api/auth/sign-up/email`, {
    data: { email, password, name: `QA Teacher ${suffix}` },
  });

  if (!resp.ok()) {
    throw new Error(
      `Throwaway teacher registration failed: ${resp.status()} ${await resp.text()}`
    );
  }

  return { email, password };
}

/**
 * Log in as a newly-registered teacher and return storageState-ready cookies.
 * Used in auth.spec.js register→onboarding→dashboard flow.
 */
async function loginAs(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard|\/onboard/, { timeout: 30_000 });
}

module.exports = {
  BASE_URL,
  expectHealthyPage,
  teacherLogin,
  coverTeacherLogin,
  parentLogin,
  registerThrowawayTeacher,
  loginAs,
};
