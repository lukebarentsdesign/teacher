// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * TeachBase Playwright config.
 *
 * Run all tests:          npx playwright test --config playwright.config.js
 * Run a single file:      npx playwright test tests/auth.spec.js
 * Run headed (visible):   npx playwright test --headed
 * Run with UI mode:       npx playwright test --ui
 *
 * The server must already be running (node scripts/run-next-dev.js) before
 * running tests. See docs/qa-playwright-handover.md §1 for startup details.
 */
module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false, // sequential — tests share a seeded DB, some CRUD tests mutate state
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Give RSC pages time to fully hydrate
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Shared setup: saves teacher + parent auth state so suites don't re-login
    {
      name: "setup",
      testMatch: /global\.setup\.js/,
    },

    // Main teacher-authenticated tests (CRUD, modules, money flow)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/teacher.json",
      },
      dependencies: ["setup"],
      testIgnore: /parent\.spec\.js|auth\.spec\.js|landing\.spec\.js|paywall\.spec\.js/,
    },

    // Auth flows (no pre-saved state — tests DO the login themselves)
    {
      name: "chromium-auth",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testMatch: /auth\.spec\.js/,
    },

    // Parent microsite (uses separate parent.json auth state)
    {
      name: "chromium-parent",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/parent.json",
      },
      dependencies: ["setup"],
      testMatch: /parent\.spec\.js/,
    },

    // Landing page (unauthenticated)
    {
      name: "chromium-landing",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /landing\.spec\.js/,
    },

    // Paywall gating tests (uses fresh throwaway accounts + DB inserts)
    {
      name: "chromium-paywall",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /paywall\.spec\.js/,
    },
  ],
});
