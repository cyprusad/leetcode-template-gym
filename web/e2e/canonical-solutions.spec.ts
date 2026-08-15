import { expect, test } from "@playwright/test";

test("opens and consumes the one-time canonical Peek", async ({ page }) => {
  await page.goto("/");

  const drill = page.getByRole("button", { name: /Exact binary search/ });
  await expect(drill).toBeVisible();
  await drill.click();

  const peek = page.getByRole("button", { name: "Peek for 10 seconds" });
  await expect(peek).toBeEnabled({ timeout: 6_000 });
  await peek.click();
  await expect(page.getByText("Use your one-time 10-second canonical peek?")).toBeVisible();

  await page.getByRole("button", { name: "Use 10-second peek" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Peek ends in 10s")).toBeVisible();

  await page.waitForTimeout(10_200);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Peek used" })).toBeDisabled();
});
