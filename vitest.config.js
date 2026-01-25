import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Exclude Playwright E2E tests (they use their own runner)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.js',  // Playwright tests
      '**/playwright-report/**',
      '**/test-results/**'
    ],
    // Include only Vitest unit tests
    include: [
      '**/*.test.js'
    ]
  }
});
