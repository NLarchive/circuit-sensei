import { test, expect } from '@playwright/test';

test('curriculum should have 6 playable tiers and 20 levels', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for roadmap to appear with levels loaded
  await page.waitForSelector('#roadmap-overlay:not(.hidden)');
  // Wait a bit for dynamic content to render
  await page.waitForTimeout(500);
  
  // Check number of levels using roadmap-level buttons (20 playable, level_00 is index-only)
  const levels = await page.locator('.roadmap-level').count();
  expect(levels).toBe(20);
  
  // Check number of tiers (6 playable tiers; intro tier has no levels to display)
  const tiers = await page.locator('.roadmap-tier').count();
  expect(tiers).toBe(6);
  
  // Check for specific content - using actual tier names from tiers.json
  await expect(page.getByText('Computer Architecture')).toBeVisible();
  await expect(page.getByText('Finite State Machines')).toBeVisible();
});
