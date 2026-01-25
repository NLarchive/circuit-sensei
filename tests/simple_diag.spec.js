import { test, expect } from '@playwright/test';

test('Check live site loads without errors', async ({ page, context }) => {
  // Clear any cached data
  await context.clearCookies();
  
  const failedRequests = [];
  
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push(`${resp.status()}: ${resp.url()}`);
    }
  });

  // Go to the site with a cache-busting param
  const url = 'https://nlarchive.github.io/circuit-sensei/?t=' + Date.now();
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit
  await page.waitForTimeout(3000);

  // Print all failed requests
  console.log('\\n=== Failed Requests ===');
  failedRequests.forEach(r => console.log(r));
  console.log('Total failed:', failedRequests.length);

  // Check DOM
  const html = await page.content();
  const hasRoadmapOverlay = html.includes('roadmap-overlay');
  const hasCircuitCanvas = html.includes('circuit-canvas');
  console.log('\\nDOM Check:');
  console.log('Has roadmap-overlay:', hasRoadmapOverlay);
  console.log('Has circuit-canvas:', hasCircuitCanvas);

  // Take screenshot
  await page.screenshot({ path: 'test-results/simple-diagnostic.png', fullPage: true });

  // Expectation
  expect(failedRequests.length).toBe(0);
});
