import { test, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

test("login, protected dashboard, session persistence and logout", async ({ page, context }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("heading", { name: "Mój Webmail." })).toBeVisible();
  await page.getByLabel("Klucz dostępu", { exact: true }).fill("incorrect-secret");
  await page.getByRole("button", { name: "Przejdź do panelu" }).click();
  await expect(page.locator("#login-error")).toContainText("Nieprawidłowy klucz");
  await page.getByLabel("Klucz dostępu", { exact: true }).fill(process.env.WEBMAIL_SECRET!);
  await page.getByRole("button", { name: "Przejdź do panelu" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Hello." })).toBeVisible();
  const cookie = (await context.cookies()).find(cookie => cookie.name === "webmail-session")!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Strict");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hello." })).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Wyloguj się" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.goto("/dashboard");
  await expect(page).toHaveURL("http://localhost:3000/");
});

test("rejects forged sessions and fits mobile viewport", async ({ page, context }) => {
  await context.addCookies([{ name: "webmail-session", value: "forged.token.signature", domain: "localhost", path: "/" }]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard");
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.screenshot({ path: "test-results/login-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Klucz dostępu", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/login-mobile.png", fullPage: true });
});
