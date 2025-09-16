/**
 * Performance regression tests for user registration flow
 * Tests critical TBAT platform registration scenarios
 */
import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 3000, // 3 seconds max for page load
  FORM_SUBMISSION: 2000, // 2 seconds max for form submission
  API_RESPONSE: 500, // 500ms max for API response
  FULL_FLOW: 10000, // 10 seconds max for complete registration
};

test.describe('Registration Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/api/test/cleanup');
  });

  test('registration page loads within performance threshold', async ({ page }) => {
    const startTime = performance.now();
    
    await page.goto('/register');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'สมัครสมาชิก' })).toBeVisible();
    
    const loadTime = performance.now() - startTime;
    
    console.log(`Registration page load time: ${loadTime.toFixed(2)}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
  });

  test('form validation responds quickly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Test email validation performance
    const startTime = performance.now();
    
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.locator('[data-testid="email-input"]').blur();
    
    // Wait for validation message
    await expect(page.getByText('กรุณากรอกอีเมลที่ถูกต้อง')).toBeVisible();
    
    const validationTime = performance.now() - startTime;
    
    console.log(`Email validation time: ${validationTime.toFixed(2)}ms`);
    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });

  test('successful registration completes within time limit', async ({ page }) => {
    const startTime = performance.now();
    
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Fill registration form
    const testEmail = `test.${Date.now()}@example.com`;
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="thai-name-input"]', 'ทดสอบ ระบบ');
    await page.fill('[data-testid="phone-input"]', '0891234567');
    await page.fill('[data-testid="school-input"]', 'โรงเรียนทดสอบ');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
    
    // Accept PDPA
    await page.check('[data-testid="pdpa-consent"]');
    
    // Submit form and measure response time
    const submitStartTime = performance.now();
    
    await page.click('[data-testid="register-button"]');
    
    // Wait for success message or redirect
    await expect(
      page.getByText('ลงทะเบียนสำเร็จ') || 
      page.getByText('กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
    ).toBeVisible({ timeout: PERFORMANCE_THRESHOLDS.FORM_SUBMISSION });
    
    const submitTime = performance.now() - submitStartTime;
    const totalTime = performance.now() - startTime;
    
    console.log(`Registration submission time: ${submitTime.toFixed(2)}ms`);
    console.log(`Total registration flow time: ${totalTime.toFixed(2)}ms`);
    
    expect(submitTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_SUBMISSION);
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FULL_FLOW);
  });

  test('concurrent registrations perform adequately', async ({ browser }) => {
    const CONCURRENT_USERS = 5;
    const contexts = [];
    const pages = [];
    
    // Create multiple browser contexts
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }
    
    const startTime = performance.now();
    
    // Start all registrations concurrently
    const registrationPromises = pages.map(async (page, index) => {
      const userStartTime = performance.now();
      
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      const testEmail = `concurrent.test.${Date.now()}.${index}@example.com`;
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="thai-name-input"]', `ทดสอบ ผู้ใช้${index + 1}`);
      await page.fill('[data-testid="phone-input"]', `089123456${index}`);
      await page.fill('[data-testid="school-input"]', `โรงเรียนทดสอบ ${index + 1}`);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      
      await page.check('[data-testid="pdpa-consent"]');
      await page.click('[data-testid="register-button"]');
      
      await expect(
        page.getByText('ลงทะเบียนสำเร็จ') || 
        page.getByText('กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
      ).toBeVisible({ timeout: PERFORMANCE_THRESHOLDS.FORM_SUBMISSION * 2 });
      
      const userTime = performance.now() - userStartTime;
      console.log(`User ${index + 1} registration time: ${userTime.toFixed(2)}ms`);
      
      return userTime;
    });
    
    // Wait for all registrations to complete
    const individualTimes = await Promise.all(registrationPromises);
    const totalTime = performance.now() - startTime;
    
    console.log(`Concurrent registrations total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average individual time: ${(individualTimes.reduce((a, b) => a + b, 0) / individualTimes.length).toFixed(2)}ms`);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
    
    // Assert performance requirements
    const maxIndividualTime = Math.max(...individualTimes);
    expect(maxIndividualTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_SUBMISSION * 2);
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FULL_FLOW * 2);
  });

  test('database performance under load', async ({ page }) => {
    // Create multiple users first
    const userCount = 10;
    const users = [];
    
    for (let i = 0; i < userCount; i++) {
      users.push({
        email: `load.test.${Date.now()}.${i}@example.com`,
        thaiName: `ทดสอบ โหลด${i + 1}`,
        phone: `089123456${i.toString().padStart(2, '0')}`,
        school: `โรงเรียนโหลด ${i + 1}`,
      });
    }
    
    const startTime = performance.now();
    
    // Register users sequentially to test database performance
    for (const user of users) {
      const userStartTime = performance.now();
      
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="thai-name-input"]', user.thaiName);
      await page.fill('[data-testid="phone-input"]', user.phone);
      await page.fill('[data-testid="school-input"]', user.school);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      
      await page.check('[data-testid="pdpa-consent"]');
      await page.click('[data-testid="register-button"]');
      
      await expect(
        page.getByText('ลงทะเบียนสำเร็จ') || 
        page.getByText('กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
      ).toBeVisible({ timeout: PERFORMANCE_THRESHOLDS.FORM_SUBMISSION });
      
      const userTime = performance.now() - userStartTime;
      console.log(`User ${user.thaiName} registration time: ${userTime.toFixed(2)}ms`);
      
      // Ensure no degradation in performance
      expect(userTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_SUBMISSION);
    }
    
    const totalTime = performance.now() - startTime;
    const avgTime = totalTime / userCount;
    
    console.log(`Database load test total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average registration time: ${avgTime.toFixed(2)}ms`);
    
    // Performance should not degrade significantly
    expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_SUBMISSION);
  });
});