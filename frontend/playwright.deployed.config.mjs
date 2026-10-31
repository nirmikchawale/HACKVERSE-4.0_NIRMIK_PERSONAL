import { defineConfig } from '@playwright/test';
const url = process.env.B04_PREVIEW_URL;
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!url || !secret) throw new Error('B-04 requires protected-preview URL and CI-only secret.');
const parsed = new URL(url);
if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.vercel.app') ||
    parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('Invalid immutable preview origin.');
export default defineConfig({
  testDir: './tests/protected', testMatch: 'b04-protected-preview.spec.mjs',
  retries: 0, workers: 1, timeout: 45_000,
  expect: { timeout: 25_000 }, reporter: [['list']],
  outputDir: 'test-results/b04',
  use: { baseURL:url, trace:'off', video:'off', screenshot:'off', actionTimeout:20_000 },
});
