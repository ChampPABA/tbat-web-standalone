import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load landing page with all components", async ({ page }) => {
    // Check navigation is present
    await expect(page.locator("nav")).toBeVisible();
    
    // Check hero section with countdown
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="countdown-timer"]')).toBeVisible();
    
    // Check package selection component
    await expect(page.locator('[data-testid="package-selection"]')).toBeVisible();
    
    // Check credibility badges
    await expect(page.locator('[data-testid="credibility-section"]')).toBeVisible();
  });

  test("should display correct countdown timer target date", async ({ page }) => {
    // Verify countdown shows Thai date format
    const countdownElement = page.locator('[data-testid="countdown-timer"]');
    await expect(countdownElement).toContainText("27 กันยายน 2568");
  });

  test("should allow package selection toggle", async ({ page }) => {
    const packageSelection = page.locator('[data-testid="package-selection"]');
    
    // Check FREE package is default
    await expect(packageSelection.locator('[data-package="FREE"]')).toBeVisible();
    
    // Toggle to ADVANCED package
    await packageSelection.locator('[data-testid="package-toggle"]').click();
    await expect(packageSelection.locator('[data-package="ADVANCED"]')).toBeVisible();
    
    // Toggle back to FREE
    await packageSelection.locator('[data-testid="package-toggle"]').click();
    await expect(packageSelection.locator('[data-package="FREE"]')).toBeVisible();
  });

  test("should show capacity status for packages", async ({ page }) => {
    const packageSelection = page.locator('[data-testid="package-selection"]');
    
    // Check capacity badges are visible
    await expect(packageSelection.locator('[data-testid="capacity-status"]')).toBeVisible();
    
    // Switch to ADVANCED and verify capacity shows
    await packageSelection.locator('[data-testid="package-toggle"]').click();
    await expect(packageSelection.locator('[data-testid="capacity-status"]')).toBeVisible();
  });

  test.describe("Registration Flow", () => {
    test("should open registration modal on CTA click", async ({ page }) => {
      // Click main CTA button
      await page.locator('[data-testid="register-button"]').first().click();
      
      // Check modal opens
      await expect(page.locator('[data-testid="registration-modal"]')).toBeVisible();
    });

    test("should require PDPA consent before submission", async ({ page }) => {
      // Open registration modal
      await page.locator('[data-testid="register-button"]').first().click();
      
      const modal = page.locator('[data-testid="registration-modal"]');
      
      // Fill form without PDPA consent
      await modal.locator('[name="fullName"]').fill("นาย ทดสอบ ระบบ");
      await modal.locator('[name="email"]').fill("test@example.com");
      await modal.locator('[name="phone"]').fill("0812345678");
      await modal.locator('[name="school"]').fill("โรงเรียนทดสอบ");
      
      // Try to submit without PDPA consent
      await modal.locator('[type="submit"]').click();
      
      // Should show validation error
      await expect(modal.locator('[data-testid="pdpa-error"]')).toBeVisible();
    });

    test("should validate Thai phone number format", async ({ page }) => {
      // Open registration modal
      await page.locator('[data-testid="register-button"]').first().click();
      
      const modal = page.locator('[data-testid="registration-modal"]');
      
      // Try invalid phone number
      await modal.locator('[name="phone"]').fill("123456");
      await modal.locator('[name="phone"]').blur();
      
      // Should show validation error
      await expect(modal.locator('[data-testid="phone-error"]')).toBeVisible();
      
      // Try valid Thai phone number
      await modal.locator('[name="phone"]').fill("0812345678");
      await modal.locator('[name="phone"]').blur();
      
      // Error should disappear
      await expect(modal.locator('[data-testid="phone-error"]')).not.toBeVisible();
    });

    test("should validate email format", async ({ page }) => {
      // Open registration modal
      await page.locator('[data-testid="register-button"]').first().click();
      
      const modal = page.locator('[data-testid="registration-modal"]');
      
      // Try invalid email
      await modal.locator('[name="email"]').fill("invalid-email");
      await modal.locator('[name="email"]').blur();
      
      // Should show validation error
      await expect(modal.locator('[data-testid="email-error"]')).toBeVisible();
      
      // Try valid email
      await modal.locator('[name="email"]').fill("test@example.com");
      await modal.locator('[name="email"]').blur();
      
      // Error should disappear
      await expect(modal.locator('[data-testid="email-error"]')).not.toBeVisible();
    });

    test("should complete full registration flow with PDPA consent", async ({ page }) => {
      // Open registration modal
      await page.locator('[data-testid="register-button"]').first().click();
      
      const modal = page.locator('[data-testid="registration-modal"]');
      
      // Fill all required fields
      await modal.locator('[name="fullName"]').fill("นาย ทดสอบ ระบบ");
      await modal.locator('[name="email"]').fill("test@example.com");
      await modal.locator('[name="phone"]').fill("0812345678");
      await modal.locator('[name="school"]').fill("โรงเรียนทดสอบ");
      
      // Accept PDPA consent
      await modal.locator('[data-testid="pdpa-consent"]').check();
      
      // Submit form
      await modal.locator('[type="submit"]').click();
      
      // Should show success state or confirmation
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE viewport
    
    test("should display properly on mobile", async ({ page }) => {
      // Check navigation menu icon is visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Check hero section is responsive
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      
      // Check package selection is touch-friendly
      const packageToggle = page.locator('[data-testid="package-toggle"]');
      await expect(packageToggle).toBeVisible();
      
      // Touch targets should be large enough (minimum 44px)
      const boundingBox = await packageToggle.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    });

    test("should open full-screen modal on mobile", async ({ page }) => {
      // Open registration modal
      await page.locator('[data-testid="register-button"]').first().click();
      
      const modal = page.locator('[data-testid="registration-modal"]');
      await expect(modal).toBeVisible();
      
      // Modal should cover full viewport on mobile
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      expect(modalBox?.width).toBeCloseTo(viewport!.width, 10);
      expect(modalBox?.height).toBeCloseTo(viewport!.height, 10);
    });
  });

  test.describe("Thai Language Support", () => {
    test("should render Thai text correctly", async ({ page }) => {
      // Check Thai headers are visible and properly formatted
      await expect(page.locator("h1")).toContainText("TBAT");
      await expect(page.locator("text=ทดสอบ")).toBeVisible();
      await expect(page.locator("text=เชียงใหม่")).toBeVisible();
      await expect(page.locator("text=กรุงเทพ")).toBeVisible();
    });

    test("should display Thai pricing correctly", async ({ page }) => {
      // Check pricing displays Thai Baht
      await expect(page.locator("text=฿690")).toBeVisible();
      await expect(page.locator("text=ฟรี")).toBeVisible();
    });
  });

  test.describe("Analytics Preview (Freemium)", () => {
    test("should show blurred analytics preview", async ({ page }) => {
      const analyticsPreview = page.locator('[data-testid="analytics-preview"]');
      await expect(analyticsPreview).toBeVisible();
      
      // Should have blur overlay
      await expect(analyticsPreview.locator('[data-testid="blur-overlay"]')).toBeVisible();
      
      // Should show unlock CTA
      await expect(analyticsPreview.locator('[data-testid="unlock-cta"]')).toBeVisible();
      await expect(analyticsPreview.locator('[data-testid="unlock-cta"]')).toContainText("Advanced");
    });

    test("should trigger upgrade flow on analytics CTA", async ({ page }) => {
      const analyticsPreview = page.locator('[data-testid="analytics-preview"]');
      
      // Click unlock CTA
      await analyticsPreview.locator('[data-testid="unlock-cta"]').click();
      
      // Should automatically select ADVANCED package
      const packageSelection = page.locator('[data-testid="package-selection"]');
      await expect(packageSelection.locator('[data-package="ADVANCED"]')).toBeVisible();
    });
  });

  test.describe("Performance", () => {
    test("should load within acceptable time", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/");
      await page.locator('[data-testid="hero-section"]').waitFor();
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds (generous for E2E)
      expect(loadTime).toBeLessThan(3000);
    });
  });
});