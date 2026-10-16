// Playwright configuration for the ShopNest end-to-end suite.
import path from 'node:path';
import { defineConfig, devices, type Project, type ReporterDescription } from '@playwright/test';
import { env } from './config/env';

// Desktop projects depend on the `setup` project (setup/auth.setup.ts), which saves the Demo User's signed-in
// storage state. Tests start signed out by default; signed-in suites opt in with `test.use(signedIn)`.
const desktopProject = (name: string, device: (typeof devices)[string]): Project => ({
  name,
  testDir: './ui',
  grepInvert: /@mobile/,
  dependencies: ['setup'],
  use: { ...device, baseURL: env.baseUrl },
});

// Everything generated goes under one directory (PW_ARTIFACTS_DIR, default ./artifacts), so a run, a Docker
// container or a CI shard can be given its own isolated output location.
const artifacts = env.artifactsDir;
const reporter: ReporterDescription[] = env.blobReport
  ? [['list'], ['blob', { outputDir: path.join(artifacts, 'blob-report') }]]
  : [
      ['list'],
      ['html', { outputFolder: path.join(artifacts, 'html-report'), open: 'never' }],
      ['json', { outputFile: path.join(artifacts, 'results.json') }],
    ];

const mobileProject = (name: string, device: (typeof devices)[string]): Project => ({
  name,
  testDir: './ui',
  grep: /@mobile/,
  dependencies: ['setup'],
  use: { ...device, baseURL: env.baseUrl },
});

export default defineConfig({
  testDir: '.',
  outputDir: path.join(artifacts, 'test-results'),
  // Every test gets its own browser context, and all app state (users, session, cart, drafts, orders) lives in
  // that context's localStorage, so tests are independent and safe to run in parallel against one dev server.
  fullyParallel: true,
  workers: env.workers,
  forbidOnly: env.isCI,
  retries: env.isCI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter,
  use: {
    // Diagnostics: trace on failure and on the first retry, screenshot on failure, video kept for failures.
    trace: env.isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    testIdAttribute: 'data-testid',
  },
  // Starts the Vite dev server (the /__demo tools are enabled there) unless one is already running.
  webServer: env.startServer
    ? {
        command: `npm run dev -- --port ${new URL(env.baseUrl).port || '5173'} --strictPort`,
        cwd: path.resolve(__dirname, '..', '..'),
        url: env.baseUrl,
        reuseExistingServer: !env.isCI,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe',
      }
    : undefined,
  projects: [
    {
      // Signs the seeded Demo User in once and saves the storage state (session in localStorage) to .auth/.
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: env.baseUrl },
    },
    desktopProject('ui', devices['Desktop Chrome']),
    ...(env.crossBrowser
      ? [desktopProject('ui-firefox', devices['Desktop Firefox']), desktopProject('ui-webkit', devices['Desktop Safari'])]
      : []),
    // Mobile browser emulation (Playwright device profiles: viewport, user agent, touch, device scale factor).
    // Only tests tagged @mobile run here, and each one runs once per device on purpose. Desktop projects exclude
    // @mobile, so no test runs twice on the same device.
    mobileProject('mobile-chrome', devices['Pixel 7']),
    mobileProject('mobile-safari', devices['iPhone 14']),
  ],
});
