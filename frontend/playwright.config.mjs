import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  // Existing technical-workflow suites inspect the Detailed View. Dedicated
  // farmer-experience tests clear this state and verify farmer-first defaults.
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    storageState: {
      cookies: [],
      origins: [{origin: 'http://127.0.0.1:4173',localStorage: [
        {name: 'agri-foresight-view',value: 'detailed'}
      ]}]
    }
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
