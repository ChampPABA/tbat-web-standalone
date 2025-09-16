import { test, expect } from "@playwright/test";

test.describe("Payment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', "free1@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });
  });

  test("should display upgrade options for free users", async ({ page }) => {
    await page.goto("/upgrade");

    // Check for upgrade packages
    await expect(page.locator("text=/Advanced Package/i")).toBeVisible();
    await expect(page.locator("text=/690.*THB|฿690/i")).toBeVisible();
  });

  test("should initiate Stripe checkout for Advanced package", async ({ page }) => {
    await page.goto("/upgrade");

    // Click on Advanced package button
    await page.click('button:has-text("Advanced Package")');

    // Should show Stripe payment form or redirect to Stripe
    await expect(page.locator('iframe[name*="stripe"], form[action*="stripe"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display post-exam upgrade option", async ({ page }) => {
    await page.goto("/results");

    // Check for upgrade option in results page
    await expect(page.locator("text=/Upgrade.*290.*THB|฿290/i")).toBeVisible();
  });

  test("should handle payment cancellation", async ({ page }) => {
    await page.goto("/upgrade");

    // Click on Advanced package
    await page.click('button:has-text("Advanced Package")');

    // Simulate cancellation (go back)
    await page.goBack();

    // Should be back on upgrade page
    await expect(page).toHaveURL(/upgrade/);
  });

  test("should show payment history for users with payments", async ({ page }) => {
    // Sign in as advanced user
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', "advanced1@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });

    // Go to account/payment history
    await page.goto("/account/payments");

    // Should show payment records
    await expect(page.locator("text=/690.*THB|฿690/i")).toBeVisible();
    await expect(page.locator("text=/COMPLETED|สำเร็จ/i")).toBeVisible();
  });
});
