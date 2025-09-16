import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display sign in page", async ({ page }) => {
    await page.goto("/auth/signin");

    // Check for sign in form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/signin");

    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator("text=/error|invalid/i")).toBeVisible({ timeout: 5000 });
  });

  test("should successfully sign in with valid credentials", async ({ page }) => {
    await page.goto("/auth/signin");

    // Fill in valid test credentials
    await page.fill('input[type="email"]', "free1@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/dashboard|home/, { timeout: 10000 });
  });

  test("should handle sign out", async ({ page }) => {
    // First sign in
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', "free1@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });

    // Sign out
    await page.goto("/auth/signout");
    await page.click('button:has-text("Sign out")');

    // Should redirect to home or sign in page
    await expect(page).toHaveURL(/signin|^\/$/);
  });
});
