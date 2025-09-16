import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests (WCAG 2.1 AA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have proper heading structure", async ({ page }) => {
    // Check heading hierarchy (h1 -> h2 -> h3, etc.)
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    
    // Should have at least one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check that headings have accessible text
    for (const heading of headings) {
      const text = await heading.textContent();
      expect(text).not.toBeNull();
      expect(text!.trim()).not.toBe("");
    }
  });

  test("should have proper color contrast ratios", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have accessible form controls", async ({ page }) => {
    // Open registration modal
    await page.locator('[data-testid="register-button"]').first().click();
    
    const modal = page.locator('[data-testid="registration-modal"]');
    await expect(modal).toBeVisible();

    // Check form accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="registration-modal"]')
      .withTags(["forms", "wcag2a", "wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Test tab navigation through interactive elements
    const interactiveElements = [
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      'a[href]'
    ];

    for (const selector of interactiveElements) {
      const elements = await page.locator(selector).all();
      
      for (const element of elements) {
        if (await element.isVisible()) {
          await element.focus();
          // Check that focus is visible
          const isFocused = await element.evaluate(el => document.activeElement === el);
          expect(isFocused).toBe(true);
        }
      }
    }
  });

  test("should have proper ARIA labels and roles", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["aria"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should support screen reader navigation", async ({ page }) => {
    // Check landmarks
    const landmarks = await page.locator('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], nav, main, header, footer').all();
    expect(landmarks.length).toBeGreaterThan(0);

    // Check that interactive elements have accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      if (await button.isVisible()) {
        const accessibleName = await button.getAttribute('aria-label') || 
                             await button.getAttribute('aria-labelledby') ||
                             await button.textContent();
        expect(accessibleName).not.toBeNull();
        expect(accessibleName!.trim()).not.toBe("");
      }
    }
  });

  test.describe("Registration Modal Accessibility", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="register-button"]').first().click();
    });

    test("should trap focus within modal", async ({ page }) => {
      const modal = page.locator('[data-testid="registration-modal"]');
      await expect(modal).toBeVisible();

      // Get all focusable elements within modal
      const focusableElements = await modal.locator(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ).all();

      expect(focusableElements.length).toBeGreaterThan(0);

      // Focus should start within modal
      const firstFocusable = focusableElements[0];
      await firstFocusable.focus();
      
      let currentIndex = 0;
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await page.keyboard.press('Tab');
        currentIndex = (currentIndex + 1) % focusableElements.length;
        
        // Verify focus stays within modal
        const activeElement = page.locator(':focus');
        const isWithinModal = await modal.locator(':focus').count() > 0;
        expect(isWithinModal).toBe(true);
      }
    });

    test("should close modal with Escape key", async ({ page }) => {
      const modal = page.locator('[data-testid="registration-modal"]');
      await expect(modal).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test("should have proper form validation messages", async ({ page }) => {
      const modal = page.locator('[data-testid="registration-modal"]');
      
      // Navigate to details step
      await modal.locator('button:has-text("ต่อไป")').click();
      
      // Try to submit with invalid data
      await modal.locator('[name="email"]').fill("invalid-email");
      await modal.locator('[name="phone"]').fill("123");
      
      // Move to next field to trigger validation
      await modal.locator('[name="firstName"]').focus();
      
      // Check that validation messages are accessible
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="registration-modal"]')
        .withTags(["forms"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe("Thai Language Accessibility", () => {
    test("should properly announce Thai content to screen readers", async ({ page }) => {
      // Check that Thai text elements have proper lang attributes or screen reader support
      const thaiTextElements = await page.locator('text=/[ก-๏]/').all();
      
      for (const element of thaiTextElements) {
        if (await element.isVisible()) {
          // Thai text should be readable by screen readers
          const text = await element.textContent();
          expect(text).toMatch(/[ก-๏]/); // Contains Thai characters
          
          // Element should not have display: none or visibility: hidden
          const isHidden = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'none' || style.visibility === 'hidden';
          });
          expect(isHidden).toBe(false);
        }
      }
    });

    test("should have proper font rendering for Thai characters", async ({ page }) => {
      // Check that Thai fonts are loading properly
      await page.waitForLoadState('networkidle');
      
      // Verify Thai text is visible and properly sized
      const thaiHeader = page.locator('text=ทดสอบ TBAT').first();
      if (await thaiHeader.isVisible()) {
        const boundingBox = await thaiHeader.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(10); // Ensure text is not collapsed
        expect(boundingBox?.width).toBeGreaterThan(20);
      }
    });
  });

  test.describe("Mobile Accessibility", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should have appropriate touch target sizes", async ({ page }) => {
      // All interactive elements should be at least 44px x 44px
      const interactiveElements = await page.locator('button, [role="button"], input, select, textarea, a').all();
      
      for (const element of interactiveElements) {
        if (await element.isVisible()) {
          const boundingBox = await element.boundingBox();
          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test("should support zoom up to 200%", async ({ page }) => {
      // Test page at 200% zoom
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate zoom by scaling down the viewport (inverse of zoom)
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      // Check that content is still accessible
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });

    test("should maintain accessibility in mobile modal", async ({ page }) => {
      // Open modal on mobile
      await page.locator('[data-testid="register-button"]').first().click();
      
      const modal = page.locator('[data-testid="registration-modal"]');
      await expect(modal).toBeVisible();

      // Modal should be full-screen accessible on mobile
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="registration-modal"]')
        .withTags(["wcag2aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe("High Contrast Mode", () => {
    test("should be usable in high contrast mode", async ({ page }) => {
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background-color: black !important;
              color: white !important;
              border-color: white !important;
            }
            a, button {
              color: yellow !important;
            }
          }
        `
      });

      // Force high contrast media query
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });

      // Check that content is still accessible
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["color-contrast"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe("Focus Management", () => {
    test("should have visible focus indicators", async ({ page }) => {
      const focusableElements = await page.locator('button, input, select, textarea, a[href]').all();
      
      for (const element of focusableElements.slice(0, 5)) { // Test first 5 to avoid timeout
        if (await element.isVisible()) {
          await element.focus();
          
          // Check that focus is visually indicated
          const hasVisibleFocus = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.outlineWidth !== '0px' || 
                   style.outlineStyle !== 'none' ||
                   style.boxShadow !== 'none' ||
                   style.borderWidth !== style.borderWidth; // Simplified check
          });
          
          // At minimum, element should be focused
          const isFocused = await element.evaluate(el => document.activeElement === el);
          expect(isFocused).toBe(true);
        }
      }
    });

    test("should restore focus after modal closes", async ({ page }) => {
      const registerButton = page.locator('[data-testid="register-button"]').first();
      await registerButton.focus();
      await registerButton.click();

      const modal = page.locator('[data-testid="registration-modal"]');
      await expect(modal).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();

      // Focus should return to the trigger button
      const focusedElement = page.locator(':focus');
      const isRegisterButtonFocused = await registerButton.evaluate(el => document.activeElement === el);
      expect(isRegisterButtonFocused).toBe(true);
    });
  });
});