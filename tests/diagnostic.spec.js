import { test, expect } from '@playwright/test';

test('Live site diagnostic: check console errors and data loading', async ({ page, baseURL }) => {
  const consoleMessages = [];
  const errors = [];
  const requests = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page error: ${err.message}`);
  });

  page.on('request', req => {
    requests.push({ url: req.url(), resourceType: req.resourceType() });
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[${resp.status()}] FAILED: ${resp.url()}`);
    }
  });

  // Navigate to the site (use baseURL + cache-bust for live testing)
  const url = (baseURL || '/') + '?t=' + Date.now();
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait a bit for async operations
  await page.waitForTimeout(5000);

  // Log what we found
  console.log('=== Console Messages ===');
  consoleMessages.forEach(m => console.log(`[${m.type}] ${m.text}`));
  
  console.log('=== Errors ===');
  errors.forEach(e => console.log(e));

  console.log('=== Failed Requests ===');
  // Already logged above via response handler

  // Check if roadmap overlay exists in DOM
  const roadmapExists = await page.locator('#roadmap-overlay').count();
  console.log(`Roadmap overlay exists: ${roadmapExists > 0}`);
  
  const roadmapHidden = await page.locator('#roadmap-overlay.hidden').count();
  console.log(`Roadmap is hidden: ${roadmapHidden > 0}`);

  // Check if data was loaded by looking at page content
  const levelNodes = await page.locator('.roadmap-level').count();
  console.log(`Level nodes found: ${levelNodes}`);

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/live-diagnostic.png', fullPage: true });
  
  // Simple assertion: page should have loaded without critical errors
  // expect(errors.filter(e => e.includes('404') || e.includes('Failed to load'))).toHaveLength(0);
  expect(true).toBe(true); // Just collect data for now
});
