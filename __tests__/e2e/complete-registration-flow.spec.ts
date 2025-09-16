import { test, expect } from '@playwright/test';

test.describe('Complete Registration Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
  });

  test('FREE package complete registration flow', async ({ page }) => {
    // Step 1: Fill personal information
    await page.fill('[name="fullname"]', 'สมชาย ทดสอบ');
    await page.fill('[name="email"]', 'somchai.test@example.com');
    await page.fill('[name="phone"]', '0812345678');
    await page.fill('[name="lineid"]', 'somchai_test');
    await page.selectOption('[name="school"]', 'chiang-mai-university');
    await page.click('[value="m6"]');
    await page.fill('[name="password"]', 'Test123456');
    await page.fill('[name="confirmPassword"]', 'Test123456');

    // Continue to step 2
    await page.click('button[type="submit"]');

    // Step 2: Select FREE package
    await page.click('input[value="FREE"]');
    await page.click('button[type="submit"]');

    // Select Biology subject
    await page.click('input[value="biology"]');
    await page.click('button[type="submit"]');

    // Select session time
    await page.click('input[value="09:00-12:00"]');
    await page.click('button[type="submit"]');

    // Step 3: Accept terms and complete registration
    await page.check('[name="terms"]');
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=ลงทะเบียนสำเร็จ')).toBeVisible();
    await expect(page.locator('text=FREE-')).toBeVisible(); // Exam code
  });

  test('ADVANCED package payment flow', async ({ page }) => {
    // Step 1: Fill personal information
    await page.fill('[name="fullname"]', 'สมใส ขั้นสูง');
    await page.fill('[name="email"]', 'somsai.advanced@example.com');
    await page.fill('[name="phone"]', '0987654321');
    await page.fill('[name="lineid"]', 'somsai_advanced');
    await page.selectOption('[name="school"]', 'chiang-mai-university');
    await page.click('[value="m6"]');
    await page.fill('[name="password"]', 'Advanced123456');
    await page.fill('[name="confirmPassword"]', 'Advanced123456');

    // Continue to step 2
    await page.click('button[type="submit"]');

    // Step 2: Select ADVANCED package
    await page.click('input[value="ADVANCED"]');
    await page.click('button[type="submit"]');

    // Skip subject selection (auto-selected for Advanced)
    await page.click('button[type="submit"]');

    // Select session time
    await page.click('input[value="13:00-16:00"]');

    // Mock Stripe Checkout redirect
    await page.route('/api/payment/create-checkout-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sessionId: 'cs_test_mock_session',
          url: 'https://checkout.stripe.com/pay/cs_test_mock_session'
        })
      });
    });

    // Click payment button - should redirect to Stripe
    const paymentButton = page.locator('button:has-text("ไปชำระเงิน")');
    await expect(paymentButton).toBeVisible();

    // Mock the redirect and verify API call
    let apiCalled = false;
    page.on('request', request => {
      if (request.url().includes('/api/payment/create-checkout-session')) {
        apiCalled = true;
      }
    });

    await paymentButton.click();

    // Verify loading state appears
    await expect(page.locator('text=กำลังสร้างช่องทางการชำระเงิน')).toBeVisible();

    // Wait for API call
    await page.waitForTimeout(1000);
    expect(apiCalled).toBe(true);
  });

  test('Capacity API integration and error handling', async ({ page }) => {
    // Mock capacity API with full sessions
    await page.route('/api/capacity/status*', async route => {
      const url = new URL(route.request().url());
      const sessionTime = url.searchParams.get('sessionTime');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session_time: sessionTime,
            availability_status: 'FULL',
            message: 'เต็มแล้ว',
            can_register_free: false,
            can_register_advanced: false,
            show_disabled_state: true
          }
        })
      });
    });

    // Navigate through registration
    await page.fill('[name="fullname"]', 'ทดสอบ เต็ม');
    await page.fill('[name="email"]', 'test.full@example.com');
    await page.fill('[name="phone"]', '0812345678');
    await page.fill('[name="lineid"]', 'test_full');
    await page.selectOption('[name="school"]', 'chiang-mai-university');
    await page.click('[value="m6"]');
    await page.fill('[name="password"]', 'Test123456');
    await page.fill('[name="confirmPassword"]', 'Test123456');
    await page.click('button[type="submit"]');

    // Select FREE package
    await page.click('input[value="FREE"]');
    await page.click('button[type="submit"]');

    // Select Biology
    await page.click('input[value="biology"]');
    await page.click('button[type="submit"]');

    // Wait for capacity data to load
    await page.waitForTimeout(1000);

    // Verify both sessions show as full
    await expect(page.locator('text=เต็มแล้ว')).toHaveCount(2);

    // Verify session inputs are disabled
    const morningSession = page.locator('input[value="09:00-12:00"]');
    const afternoonSession = page.locator('input[value="13:00-16:00"]');

    await expect(morningSession).toBeDisabled();
    await expect(afternoonSession).toBeDisabled();
  });

  test('Capacity API error handling', async ({ page }) => {
    // Mock capacity API failure
    await page.route('/api/capacity/status*', async route => {
      await route.abort('failed');
    });

    // Navigate to session selection
    await page.fill('[name="fullname"]', 'ทดสอบ ผิดพลาด');
    await page.fill('[name="email"]', 'test.error@example.com');
    await page.fill('[name="phone"]', '0812345678');
    await page.fill('[name="lineid"]', 'test_error');
    await page.selectOption('[name="school"]', 'chiang-mai-university');
    await page.click('[value="m6"]');
    await page.fill('[name="password"]', 'Test123456');
    await page.fill('[name="confirmPassword"]', 'Test123456');
    await page.click('button[type="submit"]');

    await page.click('input[value="FREE"]');
    await page.click('button[type="submit"]');

    await page.click('input[value="biology"]');
    await page.click('button[type="submit"]');

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Verify error message and retry button
    await expect(page.locator('text=เกิดปัญหาการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต')).toBeVisible();
    await expect(page.locator('text=ลองใหม่อีกครั้ง')).toBeVisible();
  });

  test('Payment error handling', async ({ page }) => {
    // Navigate to payment step
    await page.fill('[name="fullname"]', 'ทดสอบ ชำระเงินผิดพลาด');
    await page.fill('[name="email"]', 'payment.error@example.com');
    await page.fill('[name="phone"]', '0812345678');
    await page.fill('[name="lineid"]', 'payment_error');
    await page.selectOption('[name="school"]', 'chiang-mai-university');
    await page.click('[value="m6"]');
    await page.fill('[name="password"]', 'Test123456');
    await page.fill('[name="confirmPassword"]', 'Test123456');
    await page.click('button[type="submit"]');

    await page.click('input[value="ADVANCED"]');
    await page.click('button[type="submit"]');
    await page.click('button[type="submit"]'); // Skip subject
    await page.click('input[value="09:00-12:00"]');

    // Mock payment API failure
    await page.route('/api/payment/create-checkout-session', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
        })
      });
    });

    await page.click('button:has-text("ไปชำระเงิน")');

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Verify payment error message
    await expect(page.locator('text=เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง')).toBeVisible();
  });

  test('Thai language UI validation', async ({ page }) => {
    // Verify Thai language labels and messages are displayed correctly
    await expect(page.locator('text=ลงทะเบียนสมาชิก')).toBeVisible();
    await expect(page.locator('text=ข้อมูลส่วนตัว')).toBeVisible();
    await expect(page.locator('text=ชื่อ-นามสกุล')).toBeVisible();
    await expect(page.locator('text=อีเมล/ชื่อผู้ใช้')).toBeVisible();
    await expect(page.locator('text=เบอร์โทรศัพท์')).toBeVisible();
    await expect(page.locator('text=Line ID')).toBeVisible();
    await expect(page.locator('text=โรงเรียน')).toBeVisible();
    await expect(page.locator('text=ระดับชั้น')).toBeVisible();
    await expect(page.locator('text=รหัสผ่าน')).toBeVisible();
    await expect(page.locator('text=ยืนยันรหัสผ่าน')).toBeVisible();

    // Test validation messages in Thai
    await page.click('button[type="submit"]');

    // Should show Thai validation errors
    await expect(page.locator('text=กรุณากรอกชื่อ-นามสกุล')).toBeVisible();
    await expect(page.locator('text=กรุณากรอกอีเมล')).toBeVisible();
  });
});