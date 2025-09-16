/**
 * Performance regression tests for exam code generation
 * Tests critical TBAT platform exam code workflows
 */
import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

const PERFORMANCE_THRESHOLDS = {
  EXAM_CODE_GENERATION: 5000, // 5 seconds max per QA requirement
  DASHBOARD_LOAD: 3000, // 3 seconds max for dashboard load
  API_RESPONSE: 500, // 500ms max for API calls
  BATCH_GENERATION: 10000, // 10 seconds max for batch generation
};

test.describe('Exam Code Generation Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a test user with advanced package
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'perf.test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('dashboard loads user exam codes quickly', async ({ page }) => {
    const startTime = performance.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for exam codes section to load
    await expect(page.getByText('รหัสสอบของคุณ')).toBeVisible();
    await expect(page.locator('[data-testid="exam-codes-list"]')).toBeVisible();
    
    const loadTime = performance.now() - startTime;
    
    console.log(`Dashboard load time with exam codes: ${loadTime.toFixed(2)}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DASHBOARD_LOAD);
  });

  test('single exam code generation meets performance requirement', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Start exam code generation
    const startTime = performance.now();
    
    await page.click('[data-testid="generate-code-button"]');
    
    // Select package type (Biology only for faster test)
    await page.click('[data-testid="package-biology"]');
    
    // Select session time
    await page.selectOption('[data-testid="session-select"]', '09:00-12:00');
    
    // Confirm generation
    await page.click('[data-testid="confirm-generate"]');
    
    // Wait for success message and new code to appear
    await expect(page.getByText('รหัสสอบถูกสร้างแล้ว')).toBeVisible();
    await expect(page.locator('[data-testid="generated-code"]')).toBeVisible();
    
    const generationTime = performance.now() - startTime;
    
    console.log(`Exam code generation time: ${generationTime.toFixed(2)}ms`);
    expect(generationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXAM_CODE_GENERATION);
    
    // Verify the code format is correct (QR-XXXXXXXXXX)
    const codeText = await page.locator('[data-testid="generated-code"]').textContent();
    expect(codeText).toMatch(/QR-[A-Z0-9]{10}/);
  });

  test('advanced package multi-subject generation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    await page.click('[data-testid="generate-code-button"]');
    
    // Select advanced package (all subjects)
    await page.click('[data-testid="package-advanced"]');
    
    // Select session time
    await page.selectOption('[data-testid="session-select"]', '13:00-16:00');
    
    // Confirm generation
    await page.click('[data-testid="confirm-generate"]');
    
    // Wait for all three codes to be generated (Biology, Chemistry, Physics)
    await expect(page.getByText('รหัสสอบถูกสร้างแล้ว')).toBeVisible();
    await expect(page.locator('[data-testid="biology-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="chemistry-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="physics-code"]')).toBeVisible();
    
    const generationTime = performance.now() - startTime;
    
    console.log(`Multi-subject exam code generation time: ${generationTime.toFixed(2)}ms`);
    expect(generationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXAM_CODE_GENERATION);
    
    // Verify all codes have correct format
    const biologyCodes = await page.locator('[data-testid="biology-code"]').textContent();
    const chemistryCode = await page.locator('[data-testid="chemistry-code"]').textContent();
    const physicsCode = await page.locator('[data-testid="physics-code"]').textContent();
    
    expect(biologyCodes).toMatch(/QR-[A-Z0-9]{10}/);
    expect(chemistryCode).toMatch(/QR-[A-Z0-9]{10}/);
    expect(physicsCode).toMatch(/QR-[A-Z0-9]{10}/);
  });

  test('concurrent code generation by multiple users', async ({ browser }) => {
    const CONCURRENT_USERS = 5;
    const contexts = [];
    const pages = [];
    
    // Create multiple authenticated browser contexts
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Login each user
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', `concurrent.${i}@example.com`);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page.getByText('Dashboard')).toBeVisible();
      
      contexts.push(context);
      pages.push(page);
    }
    
    const startTime = performance.now();
    
    // Generate codes concurrently
    const generationPromises = pages.map(async (page, index) => {
      const userStartTime = performance.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await page.click('[data-testid="generate-code-button"]');
      await page.click('[data-testid="package-biology"]');
      await page.selectOption('[data-testid="session-select"]', '09:00-12:00');
      await page.click('[data-testid="confirm-generate"]');
      
      await expect(page.getByText('รหัสสอบถูกสร้างแล้ว')).toBeVisible();
      
      const userTime = performance.now() - userStartTime;
      console.log(`User ${index + 1} code generation time: ${userTime.toFixed(2)}ms`);
      
      return userTime;
    });
    
    const individualTimes = await Promise.all(generationPromises);
    const totalTime = performance.now() - startTime;
    
    console.log(`Concurrent code generation total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average individual time: ${(individualTimes.reduce((a, b) => a + b, 0) / individualTimes.length).toFixed(2)}ms`);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
    
    // Assert performance under concurrent load
    const maxIndividualTime = Math.max(...individualTimes);
    expect(maxIndividualTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXAM_CODE_GENERATION * 1.5);
  });

  test('session capacity checking performance', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    await page.click('[data-testid="generate-code-button"]');
    
    // Session capacity should be checked quickly
    await page.click('[data-testid="package-biology"]');
    
    const checkStartTime = performance.now();
    await page.selectOption('[data-testid="session-select"]', '09:00-12:00');
    
    // Wait for capacity info to load
    await expect(page.getByText('ที่นั่งคงเหลือ:')).toBeVisible();
    
    const capacityCheckTime = performance.now() - checkStartTime;
    
    console.log(`Session capacity check time: ${capacityCheckTime.toFixed(2)}ms`);
    expect(capacityCheckTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });

  test('exam code validation API performance', async ({ page }) => {
    // First generate a code to validate
    await page.goto('/dashboard');
    await page.click('[data-testid="generate-code-button"]');
    await page.click('[data-testid="package-biology"]');
    await page.selectOption('[data-testid="session-select"]', '09:00-12:00');
    await page.click('[data-testid="confirm-generate"]');
    
    await expect(page.getByText('รหัสสอบถูกสร้างแล้ว')).toBeVisible();
    const generatedCode = await page.locator('[data-testid="generated-code"]').textContent();
    
    // Now test validation performance
    const startTime = performance.now();
    
    // Navigate to validation page
    await page.goto('/validate');
    await page.fill('[data-testid="code-input"]', generatedCode || '');
    await page.click('[data-testid="validate-button"]');
    
    // Wait for validation result
    await expect(page.getByText('รหัสสอบถูกต้อง') || page.getByText('รหัสสอบไม่ถูกต้อง')).toBeVisible();
    
    const validationTime = performance.now() - startTime;
    
    console.log(`Code validation time: ${validationTime.toFixed(2)}ms`);
    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });

  test('database query performance with large dataset', async ({ page }) => {
    // This test assumes there are already many exam codes in the database
    // Typically run after database seeding
    
    const startTime = performance.now();
    
    await page.goto('/admin/codes'); // Admin view of all codes
    await page.waitForLoadState('networkidle');
    
    // Wait for the codes table to load
    await expect(page.locator('[data-testid="codes-table"]')).toBeVisible();
    
    // Test search functionality performance
    const searchStartTime = performance.now();
    
    await page.fill('[data-testid="search-input"]', 'QR-');
    await page.waitForTimeout(300); // Debounce time
    
    // Wait for search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    const searchTime = performance.now() - searchStartTime;
    const totalTime = performance.now() - startTime;
    
    console.log(`Admin codes page load time: ${totalTime.toFixed(2)}ms`);
    console.log(`Code search time: ${searchTime.toFixed(2)}ms`);
    
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DASHBOARD_LOAD);
    expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });
});