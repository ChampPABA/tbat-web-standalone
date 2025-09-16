import { defineConfig, devices } from "@playwright/test";

/**
 * Dynamic port detection for TBAT development server
 * Supports multiple development scenarios and port configurations
 */
function getDevServerPort(): number {
  // Check environment variable first
  if (process.env.DEV_SERVER_PORT) {
    return parseInt(process.env.DEV_SERVER_PORT, 10);
  }
  
  // Check for common TBAT development ports in priority order
  const commonPorts = [3002, 3001, 3000];
  
  // For now, return the most commonly used port
  // In a more sophisticated setup, we could check which port is actually available
  return 3002;
}

const devServerPort = getDevServerPort();
const devServerUrl = `http://localhost:${devServerPort}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: devServerUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npm run dev -- --port ${devServerPort}`,
    url: devServerUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes timeout for dev server startup
  },
});
