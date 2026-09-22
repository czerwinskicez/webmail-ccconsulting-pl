import { test, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";

loadEnvConfig(process.cwd());

test("sender badge follows selection and template drafts preview without saving", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Klucz dostępu", { exact: true }).fill(process.env.WEBMAIL_SECRET!);
  await page.getByRole("button", { name: "Przejdź do panelu" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/wysylki");
  const senderSelect = page.getByRole("combobox", { name: "Od", exact: true });
  await expect(senderSelect).toBeVisible();
  const options = await senderSelect.locator("option").all();
  expect(options.length).toBeGreaterThan(0);
  for (const option of options) {
    const id = await option.getAttribute("value");
    const label = (await option.textContent())!.replace(" (domyślny)", "");
    await senderSelect.selectOption(id!);
    await expect(page.locator(".sender-badge")).toHaveText(label);
  }
  await expect(page.getByRole("combobox", { name: /^Szablon/ })).toHaveValue("");
  await page.getByRole("link", { name: "Szablony", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Szablony", exact: true })).toBeVisible();
  await page.getByLabel("Nazwa", { exact: true }).fill("Podgląd bez zapisu");
  await page.getByLabel("Kod HTML").fill(readFileSync("public/templates/cc-consulting.html", "utf8"));
  await page.getByRole("button", { name: "Podgląd", exact: true }).click();
  const preview = page.frameLocator("iframe");
  await expect(preview.getByText("Tak będzie wyglądać treść mojej wiadomości.")).toBeVisible();
  await expect(preview.getByText("Propozycja współpracy")).toBeVisible();
  await page.screenshot({ path: "test-results/templates-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/templates-mobile.png", fullPage: true });
});

test("template writes and preview require authorization", async ({ request }) => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await request.fetch("/api/templates", { method, data: {} });
    expect(response.status()).toBe(401);
  }
  const response = await request.post("/api/templates/preview", { data: {} });
  expect(response.status()).toBe(401);
});
