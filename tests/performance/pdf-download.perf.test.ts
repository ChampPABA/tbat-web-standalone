/**
 * Performance regression tests for PDF download functionality
 * Tests critical TBAT platform PDF access workflows for Advanced package users
 */
import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

const PERFORMANCE_THRESHOLDS = {
  PDF_INITIATION: 3000, // 3 seconds max for PDF download initiation (QA requirement)
  PDF_GENERATION: 5000, // 5 seconds max for PDF generation
  PAGE_LOAD: 3000, // 3 seconds max for page load
  API_RESPONSE: 500, // 500ms max for API response
  CONCURRENT_DOWNLOADS: 15000, // 15 seconds max for concurrent downloads
};

test.describe('PDF Download Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a test user with advanced package
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'advanced.user@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('PDF solutions page loads quickly for advanced users', async ({ page }) => {
    const startTime = performance.now();
    
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    // Wait for PDF solutions list to load
    await expect(page.getByText('เฉลยข้อสอบ PDF')).toBeVisible();
    await expect(page.locator('[data-testid="pdf-list"]')).toBeVisible();
    
    const loadTime = performance.now() - startTime;
    
    console.log(`PDF solutions page load time: ${loadTime.toFixed(2)}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
  });

  test('Biology PDF download initiation meets performance requirement', async ({ page }) => {
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    // Click on Biology PDF download
    await page.click('[data-testid="biology-pdf-download"]');
    
    // Wait for download initiation response (time to first byte)
    await expect(
      page.getByText('กำลังเตรียม PDF') || 
      page.getByText('PDF พร้อมดาวน์โหลด')
    ).toBeVisible();
    
    const initiationTime = performance.now() - startTime;
    
    console.log(`Biology PDF download initiation time: ${initiationTime.toFixed(2)}ms`);
    expect(initiationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PDF_INITIATION);
  });

  test('Chemistry PDF download performance', async ({ page }) => {
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    await page.click('[data-testid="chemistry-pdf-download"]');
    
    // Wait for download preparation
    await expect(page.getByText('กำลังเตรียม PDF')).toBeVisible();
    
    // Wait for actual download to be ready
    const downloadPromise = page.waitForEvent('download', { timeout: PERFORMANCE_THRESHOLDS.PDF_GENERATION });
    await page.click('[data-testid="confirm-download"]');
    
    const download = await downloadPromise;
    const totalTime = performance.now() - startTime;
    
    console.log(`Chemistry PDF total download time: ${totalTime.toFixed(2)}ms`);
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PDF_GENERATION);
    
    // Verify download file
    expect(download.suggestedFilename()).toContain('chemistry');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Physics PDF download performance', async ({ page }) => {
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    await page.click('[data-testid="physics-pdf-download"]');
    
    await expect(page.getByText('กำลังเตรียม PDF')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download', { timeout: PERFORMANCE_THRESHOLDS.PDF_GENERATION });
    await page.click('[data-testid="confirm-download"]');
    
    const download = await downloadPromise;
    const totalTime = performance.now() - startTime;
    
    console.log(`Physics PDF total download time: ${totalTime.toFixed(2)}ms`);
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PDF_GENERATION);
    
    // Verify download file
    expect(download.suggestedFilename()).toContain('physics');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('concurrent PDF downloads by multiple users', async ({ browser }) => {
    const CONCURRENT_USERS = 3; // Advanced package users downloading PDFs
    const contexts = [];
    const pages = [];
    
    // Create multiple authenticated browser contexts
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Login each advanced user
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', `advanced.${i}@example.com`);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page.getByText('Dashboard')).toBeVisible();
      
      contexts.push(context);
      pages.push(page);
    }
    
    const startTime = performance.now();
    
    // Start downloads concurrently
    const downloadPromises = pages.map(async (page, index) => {
      const userStartTime = performance.now();
      
      await page.goto('/solutions');
      await page.waitForLoadState('networkidle');
      
      // Each user downloads a different subject
      const subjects = ['biology', 'chemistry', 'physics'];
      const subject = subjects[index % subjects.length];
      
      await page.click(`[data-testid="${subject}-pdf-download"]`);
      await expect(page.getByText('กำลังเตรียม PDF')).toBeVisible();
      
      const downloadPromise = page.waitForEvent('download', { timeout: PERFORMANCE_THRESHOLDS.PDF_GENERATION * 2 });
      await page.click('[data-testid="confirm-download"]');
      
      const download = await downloadPromise;
      const userTime = performance.now() - userStartTime;
      
      console.log(`User ${index + 1} (${subject}) download time: ${userTime.toFixed(2)}ms`);
      
      return {
        userTime,
        filename: download.suggestedFilename(),
        subject
      };
    });
    
    const results = await Promise.all(downloadPromises);
    const totalTime = performance.now() - startTime;
    
    console.log(`Concurrent PDF downloads total time: ${totalTime.toFixed(2)}ms`);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
    
    // Assert performance under concurrent load
    const maxIndividualTime = Math.max(...results.map(r => r.userTime));
    expect(maxIndividualTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PDF_GENERATION * 1.5);
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_DOWNLOADS);
    
    // Verify all downloads completed successfully
    results.forEach((result, index) => {
      expect(result.filename).toContain('.pdf');
      expect(result.filename).toContain(result.subject);
    });
  });

  test('PDF access authorization check performance', async ({ page }) => {
    // Test that authorization checks don't slow down the process
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    // Click download - should check user package type quickly
    await page.click('[data-testid="biology-pdf-download"]');
    
    // Authorization check should be fast
    await expect(
      page.getByText('กำลังตรวจสอบสิทธิ์') ||
      page.getByText('กำลังเตรียม PDF')
    ).toBeVisible();
    
    const authTime = performance.now() - startTime;
    
    console.log(`PDF authorization check time: ${authTime.toFixed(2)}ms`);
    expect(authTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });

  test('PDF metadata API response time', async ({ page }) => {
    const startTime = performance.now();
    
    // Call API directly to test response time
    const response = await page.request.get('/api/pdfs/metadata', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies => 
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    });
    
    const apiTime = performance.now() - startTime;
    
    console.log(`PDF metadata API response time: ${apiTime.toFixed(2)}ms`);
    expect(response.ok()).toBeTruthy();
    expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
    
    const metadata = await response.json();
    expect(metadata).toHaveProperty('pdfs');
    expect(Array.isArray(metadata.pdfs)).toBeTruthy();
  });

  test('PDF download history loading performance', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const startTime = performance.now();
    
    // Navigate to download history
    await page.click('[data-testid="download-history-tab"]');
    
    // Wait for download history to load
    await expect(page.getByText('ประวัติการดาวน์โหลด')).toBeVisible();
    await expect(page.locator('[data-testid="download-history-list"]')).toBeVisible();
    
    const loadTime = performance.now() - startTime;
    
    console.log(`PDF download history load time: ${loadTime.toFixed(2)}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });

  test('PDF size optimization check', async ({ page }) => {
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    // Start download and measure file size vs time
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="biology-pdf-download"]');
    await page.click('[data-testid="confirm-download"]');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    
    if (downloadPath) {
      const fs = require('fs');
      const stats = fs.statSync(downloadPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      console.log(`PDF file size: ${fileSizeMB.toFixed(2)} MB`);
      
      // PDFs should be optimized for web delivery (under 5MB for typical exam solutions)
      expect(fileSizeMB).toBeLessThan(5);
    }
  });

  test('free package users blocked from PDF access quickly', async ({ page }) => {
    // Logout and login as free user
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'free.user@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    const startTime = performance.now();
    
    await page.goto('/solutions');
    
    // Should quickly show upgrade message
    await expect(
      page.getByText('อัพเกรดแพ็คเกจเพื่อเข้าถึง PDF') ||
      page.getByText('เฉพาะแพ็คเกจ Advanced')
    ).toBeVisible();
    
    const blockTime = performance.now() - startTime;
    
    console.log(`Free user PDF access block time: ${blockTime.toFixed(2)}ms`);
    expect(blockTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });
});