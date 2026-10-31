import { defineConfig } from '@playwright/test';

const baseURL=process.env.VERCEL_PREVIEW_URL;
if (!baseURL || new URL(baseURL).protocol !== 'https:' ||
    new URL(baseURL).hostname !== 'hackverse-40nirmikpersonal-gbnb4yijo-nirmikchawale1-4179.vercel.app') {
  throw new Error('INT-03 requires a pinned HTTPS Vercel preview URL.');
}
if (!process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  throw new Error('INT-03 requires a reviewer-approved GitHub environment bypass secret, never committed to source.');
}
export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'int03-deployed.spec.mjs',
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  expect: {timeout: 18_000},
  outputDir: 'test-results-int03',
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
