import { test, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

test("read inbox and prepare a reply without sending", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Klucz dostępu", { exact: true }).fill(process.env.WEBMAIL_SECRET!);
  await page.getByRole("button", { name: "Przejdź do panelu" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/odebrane");
  await expect(page.getByRole("heading", { name: "Odebrane", exact: true })).toBeVisible();
  const first = page.locator(".sent-row").first();
  await expect(first).toBeVisible({ timeout: 20000 });
  await first.click();
  await expect(page.locator("iframe").last()).toBeVisible();
  await page.getByRole("link", { name: "Odpowiedz", exact: true }).click();
  await expect(page.getByLabel("Temat", { exact: true })).toHaveValue(/^Re: /);
  await expect(page.getByRole("button", { name: "Wyślij odpowiedź" })).toBeVisible();
  await expect(page.locator(".reply-context")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
