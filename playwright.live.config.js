import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  retries: 1,
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: 'https://nlarchive.github.io/circuit-sensei/',
    trace: 'on-first-retry',
    // Disable cache to always get fresh content
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          // Force fresh context without cache
          serviceWorkers: 'block',
        },
      },
    },
  ],
  // No webServer - testing live site
});
