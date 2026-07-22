import { chromium } from "playwright";

const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3001";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ acceptDownloads: true });

try {
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).fill("teacher@example.com");
  await page.getByLabel(/password/i).fill("changeme123");
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
  console.log(`LOGIN_OK ${page.url()}`);

  const invoiceLinks = await page.getByRole("link").evaluateAll((links) =>
    links
      .map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute("href") }))
      .filter((link) => /invoice/i.test(`${link.text} ${link.href}`)),
  );
  console.log(`INVOICE_LINKS ${JSON.stringify(invoiceLinks)}`);

  const target = invoiceLinks.find((link) => link.href)?.href ?? "/dashboard/invoices";
  await page.goto(new URL(target, baseURL).toString(), { waitUntil: "networkidle" });
  console.log(`INVOICE_PAGE ${page.url()}`);
  console.log(`INVOICE_TEXT ${(await page.locator("body").innerText()).slice(0, 5000)}`);
  console.log(`INVOICE_BUTTONS ${JSON.stringify(await page.getByRole("button").allTextContents())}`);
  console.log(`INVOICE_PAGE_LINKS ${JSON.stringify(await page.getByRole("link").evaluateAll((links) => links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute("href") })).filter((link) => link.text)))}`);
} finally {
  await browser.close();
}
