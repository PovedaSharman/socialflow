import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/frontend/e2e',
  outputDir: './test-results/playwright',
  timeout: 120_000,
  globalTimeout: 15 * 60_000,
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'test-results/playwright-report',
        open: 'never',
      },
    ],
  ],
  use: {
    baseURL: process.env.E2E_FRONTEND_URL ?? 'http://localhost:4200',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
