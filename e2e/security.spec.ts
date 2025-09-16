import { test, expect } from "@playwright/test";

test.describe("Security Features E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test.describe("Authentication Security", () => {
    test("should enforce password complexity requirements", async ({ page }) => {
      await page.goto("/auth/register");
      
      // Try weak password
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "weak");
      await page.fill('input[name="confirmPassword"]', "weak");
      await page.click('button[type="submit"]');
      
      // Should show password validation error
      await expect(page.locator("text=/Password must be at least 8 characters/")).toBeVisible();
      
      // Try password without uppercase
      await page.fill('input[name="password"]', "password123");
      await page.fill('input[name="confirmPassword"]', "password123");
      await page.click('button[type="submit"]');
      
      await expect(page.locator("text=/Password must contain at least one uppercase letter/")).toBeVisible();
      
      // Try valid password
      await page.fill('input[name="password"]', "ValidPass123");
      await page.fill('input[name="confirmPassword"]', "ValidPass123");
      await page.fill('input[name="thaiName"]', "ทดสอบ");
      await page.fill('input[name="phone"]', "0812345678");
      await page.click('input[name="pdpaConsent"]');
      
      // Should proceed with registration
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/auth\/verify-email/);
    });

    test("should implement account lockout after failed attempts", async ({ page }) => {
      await page.goto("/auth/signin");
      
      const email = "existing@example.com";
      const wrongPassword = "WrongPassword123";
      
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', wrongPassword);
        await page.click('button[type="submit"]');
        
        if (i < 4) {
          await expect(page.locator("text=/Invalid email or password/")).toBeVisible();
        }
      }
      
      // After 5th attempt, should show lockout message
      await expect(page.locator("text=/Account locked due to multiple failed login attempts/")).toBeVisible();
      
      // Try correct password - should still be locked
      await page.fill('input[name="password"]', "CorrectPassword123");
      await page.click('button[type="submit"]');
      
      await expect(page.locator("text=/Account locked/")).toBeVisible();
    });

    test("should protect against session hijacking", async ({ page, context }) => {
      // Login first
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL("/dashboard");
      
      // Get session cookie
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === "next-auth.session-token");
      expect(sessionCookie).toBeDefined();
      
      // Try to access protected route with modified cookie
      await context.clearCookies();
      await context.addCookies([{
        ...sessionCookie!,
        value: sessionCookie!.value + "tampered",
      }]);
      
      await page.goto("/dashboard");
      
      // Should redirect to login
      await expect(page).toHaveURL("/auth/signin");
    });
  });

  test.describe("Rate Limiting", () => {
    test("should enforce rate limits on authentication endpoints", async ({ page }) => {
      await page.goto("/auth/signin");
      
      // Make rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          page.evaluate(async () => {
            const response = await fetch("/api/auth/signin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: "test@example.com",
                password: "password",
              }),
            });
            return response.status;
          })
        );
      }
      
      const responses = await Promise.all(promises);
      
      // Should have some 429 (Too Many Requests) responses
      const rateLimited = responses.filter(status => status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test("should use device fingerprinting for rate limiting", async ({ page, context }) => {
      // Set custom headers for fingerprinting
      await context.setExtraHTTPHeaders({
        "Accept-Language": "th-TH,th;q=0.9",
        "X-Screen-Resolution": "1920x1080",
        "X-Timezone": "Asia/Bangkok",
      });
      
      await page.goto("/api/test-rate-limit");
      
      // Make requests and verify fingerprint is used
      const response = await page.evaluate(async () => {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password",
          }),
        });
        return {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
        };
      });
      
      // Check if rate limit headers include fingerprint info
      expect(response.headers["x-ratelimit-limit"]).toBeDefined();
    });
  });

  test.describe("CSRF Protection", () => {
    test("should reject requests without CSRF token", async ({ page }) => {
      await page.goto("/dashboard");
      
      // Try to make a state-changing request without CSRF token
      const response = await page.evaluate(async () => {
        const res = await fetch("/api/pdpa/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Test deletion",
            confirmDelete: true,
          }),
        });
        return {
          status: res.status,
          body: await res.text(),
        };
      });
      
      expect(response.status).toBe(403);
      expect(response.body).toContain("CSRF");
    });

    test("should accept requests with valid CSRF token", async ({ page }) => {
      await page.goto("/dashboard");
      
      // Get CSRF token from meta tag or cookie
      const csrfToken = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute("content");
      });
      
      expect(csrfToken).toBeDefined();
      
      // Make request with CSRF token
      const response = await page.evaluate(async (token) => {
        const res = await fetch("/api/pdpa/consent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token!,
          },
          body: JSON.stringify({
            consentType: "marketing",
            granted: true,
          }),
        });
        return res.status;
      }, csrfToken);
      
      // Should not be rejected for CSRF
      expect(response).not.toBe(403);
    });
  });

  test.describe("Input Validation & XSS Prevention", () => {
    test("should sanitize user input to prevent XSS", async ({ page }) => {
      await page.goto("/profile/edit");
      
      // Try to inject script tag
      const maliciousInput = '<script>alert("XSS")</script>Test';
      await page.fill('input[name="thaiName"]', maliciousInput);
      await page.fill('input[name="school"]', maliciousInput);
      await page.click('button[type="submit"]');
      
      // Navigate to profile view
      await page.goto("/profile");
      
      // Check that script is not executed
      const alertDialog = page.locator("dialog");
      await expect(alertDialog).not.toBeVisible();
      
      // Check that text is properly escaped
      const nameElement = page.locator('[data-testid="user-thai-name"]');
      const nameText = await nameElement.textContent();
      expect(nameText).not.toContain("<script>");
      expect(nameText).toContain("Test");
    });

    test("should validate Thai phone number format", async ({ page }) => {
      await page.goto("/profile/edit");
      
      // Try invalid phone formats
      const invalidPhones = [
        "123456789",    // Too short
        "12345678901",  // Too long
        "0912345678a",  // Contains letter
        "+6681234567",  // International format (not accepted)
      ];
      
      for (const phone of invalidPhones) {
        await page.fill('input[name="phone"]', phone);
        await page.click('button[type="submit"]');
        
        await expect(page.locator("text=/Invalid phone number format/")).toBeVisible();
      }
      
      // Try valid phone format
      await page.fill('input[name="phone"]', "0812345678");
      await page.click('button[type="submit"]');
      
      // Should succeed
      await expect(page.locator("text=/Profile updated successfully/")).toBeVisible();
    });
  });

  test.describe("Exam Code Security", () => {
    test("should generate unique exam codes", async ({ page }) => {
      await page.goto("/admin/exam-codes");
      
      const generatedCodes = new Set<string>();
      
      // Generate multiple codes
      for (let i = 0; i < 5; i++) {
        await page.click('button[data-testid="generate-code"]');
        await page.selectOption('select[name="packageType"]', "FREE");
        await page.selectOption('select[name="subject"]', "BIOLOGY");
        await page.click('button[data-testid="confirm-generate"]');
        
        // Get the generated code
        const codeElement = await page.locator('[data-testid="generated-code"]').last();
        const code = await codeElement.textContent();
        
        // Check uniqueness
        expect(generatedCodes.has(code!)).toBe(false);
        generatedCodes.add(code!);
        
        // Verify code format
        expect(code).toMatch(/^FREE-[A-Z0-9]{8}-BIOLOGY$/);
      }
    });

    test("should prevent code reuse", async ({ page }) => {
      await page.goto("/exam/enter-code");
      
      const usedCode = "FREE-USED1234-BIOLOGY";
      
      // First use of code
      await page.fill('input[name="examCode"]', usedCode);
      await page.click('button[type="submit"]');
      
      // Should proceed to exam
      await expect(page).toHaveURL(/\/exam\/session/);
      
      // Try to use same code again
      await page.goto("/exam/enter-code");
      await page.fill('input[name="examCode"]', usedCode);
      await page.click('button[type="submit"]');
      
      // Should show error
      await expect(page.locator("text=/This exam code has already been used/")).toBeVisible();
    });
  });

  test.describe("PDPA Compliance", () => {
    test("should require consent before data collection", async ({ page }) => {
      await page.goto("/auth/register");
      
      // Fill form without consent
      await page.fill('input[name="email"]', "noconsent@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.fill('input[name="confirmPassword"]', "ValidPass123");
      await page.fill('input[name="thaiName"]', "ทดสอบ");
      
      // Don't check consent checkbox
      // await page.click('input[name="pdpaConsent"]');
      
      await page.click('button[type="submit"]');
      
      // Should show consent required error
      await expect(page.locator("text=/You must agree to data collection/")).toBeVisible();
    });

    test("should allow data export", async ({ page }) => {
      // Login first
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to privacy settings
      await page.goto("/settings/privacy");
      
      // Request data export
      await page.click('button[data-testid="export-data"]');
      await page.selectOption('select[name="format"]', "json");
      await page.click('button[data-testid="confirm-export"]');
      
      // Wait for download
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.click('button[data-testid="download-export"]'),
      ]);
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/user_data_.*\.json/);
    });

    test("should allow data deletion", async ({ page }) => {
      // Login first
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "delete@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to privacy settings
      await page.goto("/settings/privacy");
      
      // Request data deletion
      await page.click('button[data-testid="delete-account"]');
      
      // Fill deletion form
      await page.fill('textarea[name="reason"]', "No longer using the service");
      await page.click('input[name="confirmDelete"]');
      
      // Type confirmation
      await page.fill('input[name="confirmText"]', "DELETE MY ACCOUNT");
      await page.click('button[data-testid="confirm-deletion"]');
      
      // Should show success and redirect to home
      await expect(page.locator("text=/Your account has been deleted/")).toBeVisible();
      await expect(page).toHaveURL("/");
      
      // Try to login with deleted account
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "delete@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Should show account not found
      await expect(page.locator("text=/Invalid email or password/")).toBeVisible();
    });

    test("should handle consent withdrawal", async ({ page }) => {
      // Login first
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to privacy settings
      await page.goto("/settings/privacy");
      
      // Withdraw marketing consent
      await page.uncheck('input[name="marketingConsent"]');
      await page.click('button[data-testid="save-consent"]');
      
      // Verify consent withdrawn
      await expect(page.locator("text=/Marketing consent withdrawn/")).toBeVisible();
      
      // Reload and verify state persisted
      await page.reload();
      const consentCheckbox = page.locator('input[name="marketingConsent"]');
      await expect(consentCheckbox).not.toBeChecked();
    });
  });

  test.describe("Audit Logging", () => {
    test("should log security events", async ({ page }) => {
      // Login as admin
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "AdminPass123");
      await page.click('button[type="submit"]');
      
      // Navigate to audit logs
      await page.goto("/admin/audit-logs");
      
      // Should show recent security events
      await expect(page.locator("text=/AUTHENTICATION_SUCCESS/")).toBeVisible();
      
      // Trigger a security event (failed login)
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "WrongPassword");
      await page.click('button[type="submit"]');
      
      // Check audit log updated
      await page.goto("/admin/audit-logs");
      await page.click('button[data-testid="refresh-logs"]');
      
      await expect(page.locator("text=/AUTHENTICATION_FAILURE/").first()).toBeVisible();
    });
  });

  test.describe("Session Security", () => {
    test("should expire sessions after inactivity", async ({ page, context }) => {
      // Login
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPass123");
      await page.click('button[type="submit"]');
      
      // Should be logged in
      await expect(page).toHaveURL("/dashboard");
      
      // Simulate session expiry by manipulating cookie
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === "next-auth.session-token");
      
      // Set expired cookie
      await context.clearCookies();
      await context.addCookies([{
        ...sessionCookie!,
        expires: Date.now() / 1000 - 3600, // 1 hour ago
      }]);
      
      // Try to access protected route
      await page.goto("/dashboard");
      
      // Should redirect to login
      await expect(page).toHaveURL("/auth/signin");
      await expect(page.locator("text=/Session expired/")).toBeVisible();
    });

    test("should prevent concurrent sessions", async ({ browser }) => {
      // Create two browser contexts
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Login in first browser
      await page1.goto("/auth/signin");
      await page1.fill('input[name="email"]', "test@example.com");
      await page1.fill('input[name="password"]', "ValidPass123");
      await page1.click('button[type="submit"]');
      
      // Should be logged in
      await expect(page1).toHaveURL("/dashboard");
      
      // Login in second browser
      await page2.goto("/auth/signin");
      await page2.fill('input[name="email"]', "test@example.com");
      await page2.fill('input[name="password"]', "ValidPass123");
      await page2.click('button[type="submit"]');
      
      // Should be logged in
      await expect(page2).toHaveURL("/dashboard");
      
      // First session should be invalidated
      await page1.reload();
      await expect(page1).toHaveURL("/auth/signin");
      await expect(page1.locator("text=/Session terminated/")).toBeVisible();
      
      // Cleanup
      await context1.close();
      await context2.close();
    });
  });
});