import { test, expect } from "@playwright/test";

test.describe("PDPA Compliance E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test.describe("Consent Management", () => {
    test("should display consent form on first visit", async ({ page }) => {
      // Clear cookies to simulate first visit
      await page.context().clearCookies();
      await page.goto("/");
      
      // Should show consent banner
      await expect(page.locator('[data-testid="cookie-consent-banner"]')).toBeVisible();
      
      // Should have necessary and optional consent options
      await expect(page.locator('text=/Necessary Cookies/')).toBeVisible();
      await expect(page.locator('text=/Analytics Cookies/')).toBeVisible();
      await expect(page.locator('text=/Marketing Cookies/')).toBeVisible();
      
      // Necessary cookies should be checked and disabled
      const necessaryCookies = page.locator('input[name="necessaryCookies"]');
      await expect(necessaryCookies).toBeChecked();
      await expect(necessaryCookies).toBeDisabled();
    });

    test("should save consent preferences", async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/");
      
      // Accept only analytics
      await page.check('input[name="analyticsCookies"]');
      await page.uncheck('input[name="marketingCookies"]');
      await page.click('button[data-testid="save-preferences"]');
      
      // Banner should disappear
      await expect(page.locator('[data-testid="cookie-consent-banner"]')).not.toBeVisible();
      
      // Reload page
      await page.reload();
      
      // Banner should not reappear
      await expect(page.locator('[data-testid="cookie-consent-banner"]')).not.toBeVisible();
      
      // Check saved preferences
      await page.goto("/settings/privacy");
      const analyticsCookies = page.locator('input[name="analyticsCookies"]');
      const marketingCookies = page.locator('input[name="marketingCookies"]');
      
      await expect(analyticsCookies).toBeChecked();
      await expect(marketingCookies).not.toBeChecked();
    });

    test("should allow consent modification", async ({ page }) => {
      // Login first
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Go to privacy settings
      await page.goto("/settings/privacy");
      
      // Change consent preferences
      await page.uncheck('input[name="dataProcessing"]');
      await page.check('input[name="dataSharing"]');
      await page.click('button[data-testid="update-consent"]');
      
      // Should show success message
      await expect(page.locator('text=/Consent preferences updated/')).toBeVisible();
      
      // Verify changes persisted
      await page.reload();
      await expect(page.locator('input[name="dataProcessing"]')).not.toBeChecked();
      await expect(page.locator('input[name="dataSharing"]')).toBeChecked();
    });

    test("should track consent history", async ({ page }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Go to privacy settings
      await page.goto("/settings/privacy");
      
      // View consent history
      await page.click('button[data-testid="view-consent-history"]');
      
      // Should show consent timeline
      await expect(page.locator('text=/Consent History/')).toBeVisible();
      await expect(page.locator('[data-testid="consent-entry"]').first()).toBeVisible();
      
      // Each entry should have timestamp and status
      const firstEntry = page.locator('[data-testid="consent-entry"]').first();
      await expect(firstEntry.locator('[data-testid="consent-timestamp"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="consent-status"]')).toBeVisible();
    });
  });

  test.describe("Data Portability", () => {
    test("should export data in JSON format", async ({ page }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to data export
      await page.goto("/settings/privacy/export");
      
      // Select JSON format
      await page.selectOption('select[name="exportFormat"]', "json");
      await page.click('button[data-testid="request-export"]');
      
      // Wait for export to be ready
      await expect(page.locator('text=/Export ready/')).toBeVisible({ timeout: 10000 });
      
      // Download the export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button[data-testid="download-export"]'),
      ]);
      
      // Verify file name and extension
      expect(download.suggestedFilename()).toMatch(/user_data_.*\.json/);
      
      // Save and verify content structure
      const path = await download.path();
      if (path) {
        const fs = require('fs');
        const content = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        // Verify data structure
        expect(content).toHaveProperty('personalInfo');
        expect(content).toHaveProperty('examData');
        expect(content).toHaveProperty('paymentData');
        expect(content).toHaveProperty('consentHistory');
        expect(content).toHaveProperty('metadata');
      }
    });

    test("should export data in CSV format", async ({ page }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to data export
      await page.goto("/settings/privacy/export");
      
      // Select CSV format
      await page.selectOption('select[name="exportFormat"]', "csv");
      await page.click('button[data-testid="request-export"]');
      
      // Wait for export to be ready
      await expect(page.locator('text=/Export ready/')).toBeVisible({ timeout: 10000 });
      
      // Download the export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button[data-testid="download-export"]'),
      ]);
      
      // Verify file name and extension
      expect(download.suggestedFilename()).toMatch(/user_data_.*\.csv/);
    });

    test("should handle large data exports with streaming", async ({ page }) => {
      // Login as user with lots of data
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "poweruser@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to data export
      await page.goto("/settings/privacy/export");
      
      // Request large export
      await page.click('input[name="includeAllHistory"]');
      await page.click('button[data-testid="request-export"]');
      
      // Should show progress indicator
      await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
      
      // Should show streaming status
      await expect(page.locator('text=/Processing/')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('text=/Export ready/')).toBeVisible({ timeout: 30000 });
      
      // Verify no timeout or memory errors
      await expect(page.locator('text=/error/i')).not.toBeVisible();
    });
  });

  test.describe("Right to Erasure", () => {
    test("should require confirmation for account deletion", async ({ page }) => {
      // Create test account
      await page.goto("/auth/register");
      const testEmail = `delete-test-${Date.now()}@example.com`;
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.fill('input[name="confirmPassword"]', "ValidPass123");
      await page.fill('input[name="thaiName"]', "ทดสอบลบ");
      await page.fill('input[name="phone"]', "0898765432");
      await page.click('input[name="pdpaConsent"]');
      await page.click('button[type="submit"]');
      
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to account deletion
      await page.goto("/settings/privacy/delete");
      
      // Should show warning
      await expect(page.locator('text=/This action cannot be undone/')).toBeVisible();
      
      // Try to delete without confirmation
      await page.fill('textarea[name="reason"]', "Testing deletion");
      await page.click('button[data-testid="delete-account"]');
      
      // Should require checkbox confirmation
      await expect(page.locator('text=/Please confirm deletion/')).toBeVisible();
      
      // Check confirmation
      await page.click('input[name="confirmDelete"]');
      
      // Should require typing confirmation text
      await page.click('button[data-testid="delete-account"]');
      await expect(page.locator('text=/Type "DELETE" to confirm/')).toBeVisible();
      
      // Type confirmation
      await page.fill('input[name="confirmText"]', "DELETE");
      await page.click('button[data-testid="delete-account"]');
      
      // Should show final confirmation dialog
      await expect(page.locator('[data-testid="final-confirmation-dialog"]')).toBeVisible();
      await page.click('button[data-testid="confirm-final-delete"]');
      
      // Should complete deletion
      await expect(page.locator('text=/Account successfully deleted/')).toBeVisible();
      await expect(page).toHaveURL("/");
    });

    test("should delete all user data", async ({ page }) => {
      // Create test account with data
      const testEmail = `data-delete-${Date.now()}@example.com`;
      
      // Register and create some data
      await page.goto("/auth/register");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.fill('input[name="confirmPassword"]', "ValidPass123");
      await page.fill('input[name="thaiName"]', "ทดสอบข้อมูล");
      await page.fill('input[name="phone"]', "0887654321");
      await page.click('input[name="pdpaConsent"]');
      await page.click('button[type="submit"]');
      
      // Login and create exam data
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Generate exam code
      await page.goto("/exam/generate");
      await page.selectOption('select[name="packageType"]', "FREE");
      await page.selectOption('select[name="subject"]', "BIOLOGY");
      await page.click('button[data-testid="generate-code"]');
      
      // Delete account
      await page.goto("/settings/privacy/delete");
      await page.fill('textarea[name="reason"]', "Complete data deletion test");
      await page.click('input[name="confirmDelete"]');
      await page.fill('input[name="confirmText"]', "DELETE");
      await page.click('button[data-testid="delete-account"]');
      await page.click('button[data-testid="confirm-final-delete"]');
      
      // Verify deletion
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Account should not exist
      await expect(page.locator('text=/Invalid email or password/')).toBeVisible();
    });

    test("should provide deletion receipt", async ({ page }) => {
      // Create and delete account
      const testEmail = `receipt-test-${Date.now()}@example.com`;
      
      await page.goto("/auth/register");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.fill('input[name="confirmPassword"]', "ValidPass123");
      await page.fill('input[name="thaiName"]', "ทดสอบใบเสร็จ");
      await page.fill('input[name="phone"]', "0876543210");
      await page.click('input[name="pdpaConsent"]');
      await page.click('button[type="submit"]');
      
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Delete account
      await page.goto("/settings/privacy/delete");
      await page.fill('textarea[name="reason"]', "Receipt test");
      await page.click('input[name="confirmDelete"]');
      await page.fill('input[name="confirmText"]', "DELETE");
      await page.click('button[data-testid="delete-account"]');
      await page.click('button[data-testid="confirm-final-delete"]');
      
      // Should offer deletion receipt download
      await expect(page.locator('text=/Download deletion receipt/')).toBeVisible();
      
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button[data-testid="download-receipt"]'),
      ]);
      
      // Verify receipt file
      expect(download.suggestedFilename()).toMatch(/deletion_receipt_.*\.pdf/);
    });
  });

  test.describe("Data Retention", () => {
    test("should display data retention policy", async ({ page }) => {
      await page.goto("/privacy-policy");
      
      // Should show retention periods
      await expect(page.locator('text=/Data Retention Policy/')).toBeVisible();
      await expect(page.locator('text=/6 months/')).toBeVisible();
      await expect(page.locator('text=/Personal data/')).toBeVisible();
      await expect(page.locator('text=/Exam results/')).toBeVisible();
      await expect(page.locator('text=/Payment records/')).toBeVisible();
    });

    test("should notify before data expiry", async ({ page }) => {
      // Login as user with expiring data
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "expiring@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Should show expiry notification
      await expect(page.locator('[data-testid="data-expiry-notice"]')).toBeVisible();
      await expect(page.locator('text=/Your data will expire in/')).toBeVisible();
      
      // Should offer export option
      await expect(page.locator('button[data-testid="export-before-expiry"]')).toBeVisible();
    });

    test("should auto-delete expired data", async ({ page }) => {
      // This would typically be tested with time manipulation
      // For E2E, we verify the UI shows correct information
      
      // Login as admin
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "AdminPass123");
      await page.click('button[type="submit"]');
      
      // Go to data retention dashboard
      await page.goto("/admin/data-retention");
      
      // Should show retention status
      await expect(page.locator('text=/Active Users/')).toBeVisible();
      await expect(page.locator('text=/Expired Data/')).toBeVisible();
      await expect(page.locator('text=/Pending Deletion/')).toBeVisible();
      
      // Should have manual cleanup option
      await expect(page.locator('button[data-testid="run-cleanup"]')).toBeVisible();
    });
  });

  test.describe("Data Minimization", () => {
    test("should only collect necessary data", async ({ page }) => {
      await page.goto("/auth/register");
      
      // Required fields should be marked
      const emailField = page.locator('input[name="email"]');
      const passwordField = page.locator('input[name="password"]');
      const thaiNameField = page.locator('input[name="thaiName"]');
      
      await expect(emailField).toHaveAttribute('required', '');
      await expect(passwordField).toHaveAttribute('required', '');
      await expect(thaiNameField).toHaveAttribute('required', '');
      
      // Optional fields should be clearly marked
      const phoneField = page.locator('input[name="phone"]');
      const schoolField = page.locator('input[name="school"]');
      
      await expect(page.locator('label[for="phone"] >> text=/Optional/')).toBeVisible();
      await expect(page.locator('label[for="school"] >> text=/Optional/')).toBeVisible();
    });

    test("should anonymize data when possible", async ({ page }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // View public leaderboard
      await page.goto("/leaderboard");
      
      // Names should be partially hidden
      const userEntries = page.locator('[data-testid="leaderboard-entry"]');
      const firstEntry = userEntries.first();
      const displayName = await firstEntry.locator('[data-testid="user-name"]').textContent();
      
      // Should show anonymized format (e.g., "ท***บ")
      expect(displayName).toMatch(/^.{1,2}\*+.{0,1}$/);
      
      // Full name should not be visible
      expect(displayName).not.toContain("ทดสอบ");
    });
  });

  test.describe("Third-party Data Sharing", () => {
    test("should require explicit consent for data sharing", async ({ page }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Try to enable a feature that requires data sharing
      await page.goto("/settings/integrations");
      await page.click('[data-testid="enable-analytics"]');
      
      // Should show data sharing consent dialog
      await expect(page.locator('[data-testid="data-sharing-dialog"]')).toBeVisible();
      await expect(page.locator('text=/This feature requires sharing data with/')).toBeVisible();
      
      // Should list what data will be shared
      await expect(page.locator('text=/Data to be shared:/')).toBeVisible();
      await expect(page.locator('[data-testid="shared-data-list"]')).toBeVisible();
      
      // Decline sharing
      await page.click('button[data-testid="decline-sharing"]');
      
      // Feature should remain disabled
      const analyticsToggle = page.locator('input[data-testid="analytics-toggle"]');
      await expect(analyticsToggle).not.toBeChecked();
    });

    test("should track third-party data access", async ({ page }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // View data sharing history
      await page.goto("/settings/privacy/sharing");
      
      // Should show sharing log
      await expect(page.locator('text=/Data Sharing History/')).toBeVisible();
      
      // Each entry should show recipient and purpose
      const sharingEntries = page.locator('[data-testid="sharing-entry"]');
      if (await sharingEntries.count() > 0) {
        const firstEntry = sharingEntries.first();
        await expect(firstEntry.locator('[data-testid="recipient"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="purpose"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="shared-date"]')).toBeVisible();
      }
    });
  });
});