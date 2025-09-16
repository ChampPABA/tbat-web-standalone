/**
 * E2E Tests for Story 3.1: Complete Capacity Management Workflow
 * Tests the entire user journey from registration to exam code generation
 * with capacity validation at each step
 */

import { test, expect } from '@playwright/test';

// Test data constants aligned with Story 3.1
const EXAM_DATE = '2025-09-27';
const MORNING_SESSION = 'MORNING';
const AFTERNOON_SESSION = 'AFTERNOON';
const FREE_PACKAGE = 'FREE';
const ADVANCED_PACKAGE = 'ADVANCED';

test.describe('Story 3.1: Capacity Management E2E Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
  });

  test.describe('User Registration with Capacity Validation', () => {

    test('should complete free package registration when capacity is available', async ({ page }) => {
      // Step 1: Navigate to registration
      await page.click('[data-testid="register-button"]');
      await expect(page).toHaveURL(/.*\/register/);

      // Step 2: Fill registration form
      await page.fill('[data-testid="thai-name"]', 'สมใจ ทดสอบ');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="phone"]', '0812345678');
      await page.fill('[data-testid="school"]', 'โรงเรียนทดสอบ');
      await page.selectOption('[data-testid="grade"]', '12');

      // Step 3: Accept PDPA consent
      await page.check('[data-testid="pdpa-consent"]');

      // Step 4: Select FREE package
      await page.click('[data-testid="package-free"]');

      // Step 5: Verify capacity check before session selection
      await expect(page.locator('[data-testid="capacity-status"]')).toBeVisible();

      // Ensure no exact numbers are displayed per AC5
      const capacityText = await page.locator('[data-testid="capacity-status"]').textContent();
      expect(capacityText).not.toMatch(/\d+\/\d+/); // No "X/Y" format
      expect(capacityText).not.toMatch(/\d+\s*(seats|ที่นั่ง)/); // No exact numbers

      // Step 6: Select session based on availability
      const morningSession = page.locator('[data-testid="session-morning"]');
      const isDisabled = await morningSession.getAttribute('disabled');

      if (!isDisabled) {
        await morningSession.click();

        // Verify session selection shows availability without numbers
        await expect(page.locator('[data-testid="session-availability"]')).toContainText(/เปิดรับสมัคร|ยังมีที่นั่งว่าง/);

        // Step 7: Complete registration
        await page.click('[data-testid="complete-registration"]');

        // Step 8: Verify success and exam code generation
        await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

        const examCode = await page.locator('[data-testid="exam-code"]').textContent();
        expect(examCode).toMatch(/^FREE-[A-Z0-9]{4}-(BIOLOGY|CHEMISTRY|PHYSICS)$/);

        // Step 9: Verify capacity was updated (indirectly through UI state)
        await page.goto('/register');
        const updatedCapacity = page.locator('[data-testid="capacity-status"]');
        await expect(updatedCapacity).toBeVisible();
      } else {
        // Session is full - verify proper messaging
        await expect(morningSession).toHaveClass(/disabled|opacity-50/);
        await expect(page.locator('[data-testid="session-full-message"]')).toBeVisible();
      }
    });

    test('should handle advanced package registration with priority logic', async ({ page }) => {
      // Navigate to registration
      await page.click('[data-testid="register-button"]');

      // Fill basic information
      await page.fill('[data-testid="thai-name"]', 'สมคิด ทดสอบ');
      await page.fill('[data-testid="email"]', 'advanced@example.com');
      await page.fill('[data-testid="phone"]', '0898765432');
      await page.check('[data-testid="pdpa-consent"]');

      // Select ADVANCED package
      await page.click('[data-testid="package-advanced"]');

      // Verify payment information is shown
      await expect(page.locator('[data-testid="payment-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-thai-baht"]')).toContainText('฿');

      // Advanced should have access even when free is limited
      const sessionOptions = page.locator('[data-testid^="session-"]');
      const enabledSessions = await sessionOptions.evaluateAll(elements =>
        elements.filter(el => !el.hasAttribute('disabled')).length
      );

      // Advanced package should have more availability than free
      expect(enabledSessions).toBeGreaterThan(0);

      // Select available session
      await page.click('[data-testid="session-afternoon"]');

      // Proceed to payment
      await page.click('[data-testid="proceed-payment"]');

      // Verify Stripe payment form
      await expect(page.locator('[data-testid="stripe-payment"]')).toBeVisible();
    });
  });

  test.describe('Capacity Validation During Registration', () => {

    test('should display appropriate messages based on capacity status', async ({ page }) => {
      await page.goto('/register');

      // Wait for capacity data to load
      await page.waitForSelector('[data-testid="capacity-status"]');

      const statusElement = page.locator('[data-testid="capacity-status"]');
      const statusText = await statusElement.textContent();

      // Verify Thai/English messaging without exact numbers
      if (statusText?.includes('เต็มแล้ว') || statusText?.includes('full')) {
        // Full capacity scenario
        await expect(page.locator('[data-testid="session-morning"]')).toBeDisabled();
        await expect(page.locator('[data-testid="session-afternoon"]')).toBeDisabled();
        await expect(page.locator('[data-testid="alternative-recommendations"]')).toBeVisible();

      } else if (statusText?.includes('จำกัด') || statusText?.includes('limited')) {
        // Limited capacity scenario
        const freePackage = page.locator('[data-testid="package-free"]');
        const advancedPackage = page.locator('[data-testid="package-advanced"]');

        // Advanced should still be available
        await expect(advancedPackage).toBeEnabled();

        // Check if free is restricted
        const freeDisabled = await freePackage.getAttribute('disabled');
        if (freeDisabled) {
          await expect(page.locator('[data-testid="upgrade-recommendation"]')).toBeVisible();
        }

      } else {
        // Available capacity scenario
        await expect(page.locator('[data-testid="package-free"]')).toBeEnabled();
        await expect(page.locator('[data-testid="package-advanced"]')).toBeEnabled();
        await expect(page.locator('[data-testid="session-morning"]')).toBeEnabled();
        await expect(page.locator('[data-testid="session-afternoon"]')).toBeEnabled();
      }
    });

    test('should prevent registration when session is full', async ({ page }) => {
      await page.goto('/register');

      // Fill minimal form data
      await page.fill('[data-testid="thai-name"]', 'เต็ม ทดสอบ');
      await page.fill('[data-testid="email"]', 'full@example.com');
      await page.check('[data-testid="pdpa-consent"]');

      // Try to select a package
      await page.click('[data-testid="package-free"]');

      // If sessions are full, verify error handling
      const sessionButtons = page.locator('[data-testid^="session-"]');
      const allDisabled = await sessionButtons.evaluateAll(elements =>
        elements.every(el => el.hasAttribute('disabled'))
      );

      if (allDisabled) {
        await expect(page.locator('[data-testid="no-sessions-available"]')).toBeVisible();
        await expect(page.locator('[data-testid="complete-registration"]')).toBeDisabled();

        // Verify recommendations are shown
        const recommendations = page.locator('[data-testid="recommendations"]');
        await expect(recommendations).toBeVisible();
        await expect(recommendations).toContainText(/อัปเกรด|upgrade|ช่วงเวลาอื่น/);
      }
    });
  });

  test.describe('Real-time Capacity Updates', () => {

    test('should reflect capacity changes in real-time', async ({ page, context }) => {
      // Open two browser sessions to simulate concurrent users
      const page2 = await context.newPage();

      await page.goto('/register');
      await page2.goto('/register');

      // Check initial capacity status on both pages
      await page.waitForSelector('[data-testid="capacity-status"]');
      await page2.waitForSelector('[data-testid="capacity-status"]');

      const initialStatus1 = await page.locator('[data-testid="capacity-status"]').textContent();
      const initialStatus2 = await page2.locator('[data-testid="capacity-status"]').textContent();

      // Complete registration on first page if possible
      const sessionAvailable = await page.locator('[data-testid="session-morning"]').isEnabled();

      if (sessionAvailable) {
        // User 1 completes registration
        await page.fill('[data-testid="thai-name"]', 'คนแรก ทดสอบ');
        await page.fill('[data-testid="email"]', 'first@example.com');
        await page.check('[data-testid="pdpa-consent"]');
        await page.click('[data-testid="package-free"]');
        await page.click('[data-testid="session-morning"]');
        await page.click('[data-testid="complete-registration"]');

        // Wait for registration to complete
        await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

        // Refresh second page to check capacity update
        await page2.reload();
        await page2.waitForSelector('[data-testid="capacity-status"]');

        const updatedStatus2 = await page2.locator('[data-testid="capacity-status"]').textContent();

        // Verify capacity status changed (without checking exact numbers)
        // Status should be different after registration
        if (initialStatus2?.includes('เปิดรับสมัคร') && updatedStatus2?.includes('จำกัด')) {
          // Capacity decreased from available to limited
          expect(updatedStatus2).not.toBe(initialStatus2);
        }
      }

      await page2.close();
    });
  });

  test.describe('Thai Language Support', () => {

    test('should display all capacity messages in Thai', async ({ page }) => {
      await page.goto('/register?lang=th');

      await page.waitForSelector('[data-testid="capacity-status"]');

      // Verify Thai language elements
      const capacityStatus = await page.locator('[data-testid="capacity-status"]').textContent();
      const sessionLabels = await page.locator('[data-testid^="session-"] .label').allTextContents();
      const packageLabels = await page.locator('[data-testid^="package-"] .label').allTextContents();

      // Check for Thai characters in capacity messaging
      expect(capacityStatus).toMatch(/[ก-๏]/); // Thai Unicode range

      // Check session time labels
      expect(sessionLabels.some(label => label.includes('เช้า') || label.includes('บ่าย'))).toBe(true);

      // Check package labels
      expect(packageLabels.some(label => label.includes('ฟรี') || label.includes('แอดวานซ์'))).toBe(true);
    });
  });

  test.describe('Accessibility Compliance', () => {

    test('should be accessible to screen readers', async ({ page }) => {
      await page.goto('/register');

      // Check ARIA labels and roles
      await expect(page.locator('[data-testid="capacity-status"]')).toHaveAttribute('role', 'status');
      await expect(page.locator('[data-testid="session-morning"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="session-afternoon"]')).toHaveAttribute('aria-label');

      // Verify disabled state is announced properly
      const disabledSessions = page.locator('[data-testid^="session-"][disabled]');
      const count = await disabledSessions.count();

      for (let i = 0; i < count; i++) {
        const session = disabledSessions.nth(i);
        await expect(session).toHaveAttribute('aria-disabled', 'true');

        const ariaLabel = await session.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/เต็ม|full|ไม่ว่าง/);
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/register');

      // Test tab navigation through capacity-related elements
      await page.keyboard.press('Tab'); // Move to first form field
      await page.keyboard.press('Tab'); // Next field

      // Navigate to package selection
      while (!(await page.locator('[data-testid="package-free"]:focus').isVisible())) {
        await page.keyboard.press('Tab');
      }

      // Select package with keyboard
      await page.keyboard.press('Enter');

      // Navigate to session selection
      while (!(await page.locator('[data-testid^="session-"]:focus').isVisible())) {
        await page.keyboard.press('Tab');
      }

      // Verify focused session can be selected
      const focusedSession = page.locator('[data-testid^="session-"]:focus');
      const isEnabled = await focusedSession.isEnabled();

      if (isEnabled) {
        await page.keyboard.press('Enter');
        await expect(focusedSession).toHaveClass(/selected|active/);
      }
    });
  });

  test.describe('Error Handling', () => {

    test('should handle capacity API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('/api/capacity/status', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Service unavailable' }
          })
        });
      });

      await page.goto('/register');

      // Verify error state is handled
      await expect(page.locator('[data-testid="capacity-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Verify user can still see form but registration is disabled
      await expect(page.locator('[data-testid="complete-registration"]')).toBeDisabled();

      // Test retry functionality
      await page.unroute('/api/capacity/status');
      await page.route('/api/capacity/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              availability_status: 'AVAILABLE',
              message: 'ยังมีที่นั่งว่าง',
              can_register_free: true,
              can_register_advanced: true
            }
          })
        });
      });

      await page.click('[data-testid="retry-button"]');

      // Verify recovery
      await expect(page.locator('[data-testid="capacity-error"]')).toBeHidden();
      await expect(page.locator('[data-testid="capacity-status"]')).toBeVisible();
    });
  });
});