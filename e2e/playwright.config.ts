import { defineConfig } from '@playwright/test';

/**
 * Playwright config for the Sprint 02 staging smoke test. Runs from a GitHub
 * Actions runner (which can reach github.io and script.google.com) against the
 * REAL deployed system — no localhost, no mocks. Apps Script is slow and can
 * cold-start, so timeouts are generous and one retry is allowed.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
});
