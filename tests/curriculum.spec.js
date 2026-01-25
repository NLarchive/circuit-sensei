import { test, expect } from '@playwright/test';

test('curriculum should have 7 playable tiers and 21 levels', async ({ page, baseURL }) => {
  const url = (baseURL || '/') + '?t=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait for roadmap to appear with levels loaded
  await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 30000 });
  // Wait a bit for dynamic content to render
  await page.waitForTimeout(500);
  
  // Check number of levels using roadmap-level buttons (21 playable levels)
  const levels = await page.locator('.roadmap-level').count();
  expect(levels).toBe(21);
  
  // Check number of tiers (7 tiers total displayed)
  const tiers = await page.locator('.roadmap-tier').count();
  expect(tiers).toBe(7);
  
  // Check for specific content - using actual tier names from tiers.json
  await expect(page.getByText('Computer Architecture')).toBeVisible();
  await expect(page.getByText('Finite State Machines')).toBeVisible();
});
