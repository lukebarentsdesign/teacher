const { test: setup, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

setup("authenticate teacher", async ({ page }) => {
  // Set long timeout for first-time compilation
  page.setDefaultTimeout(60_000);
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.getByLabel("Email").fill("teacher@example.com");
  await page.getByLabel("Password").fill("changeme123");
  await page.getByRole("button", { name: "Sign in" }).click();
  
  // Wait up to 60s for Next.js to compile and render /dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });

  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  await page.context().storageState({ path: path.join(authDir, "teacher.json") });
  console.log("[setup] Teacher auth state saved.");
});

setup("authenticate parent", async ({ page }) => {
  page.setDefaultTimeout(60_000);
  
  await page.goto(`${BASE_URL}/parent/login`, { waitUntil: "load" });
  await page.getByLabel("Access code").fill("410001");
  await page.getByRole("button", { name: "Continue" }).click();
  
  // Wait for the main parent directory or a student detail view
  await page.waitForURL(/\/parent/, { timeout: 60_000 });
  
  // If we land on the multi-student chooser list (/parent), select Ava Bennett
  const currentUrl = page.url();
  if (currentUrl.endsWith("/parent") || currentUrl.endsWith("/parent/")) {
    const studentLink = page.getByRole("link", { name: "Ava Bennett" }).first();
    await studentLink.waitFor({ state: "visible", timeout: 15_000 });
    await studentLink.click();
  }
  
  await page.waitForURL(/\/parent\/students\//, { timeout: 60_000 });

  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  await page.context().storageState({ path: path.join(authDir, "parent.json") });
  console.log("[setup] Parent auth state saved.");
});
