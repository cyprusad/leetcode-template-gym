import { expect, test } from "@playwright/test";

test("opens and consumes the one-time canonical Peek", async ({ page }) => {
  await page.goto("/");

  const drill = page.getByRole("button", { name: /Exact binary search/ });
  await expect(drill).toBeVisible();
  await drill.click();

  const peek = page.getByRole("button", { name: "Peek at code" });
  await expect(peek).toBeEnabled({ timeout: 6_000 });
  await peek.click();
  await expect(page.getByText("Peek at the sample template?")).toBeVisible();

  await page.getByRole("dialog").getByRole("button", { name: "Peek at code" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Peek ends in 10s")).toBeVisible();

  await page.waitForTimeout(10_200);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Peek used" })).toBeDisabled();
});
