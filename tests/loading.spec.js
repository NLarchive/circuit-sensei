import { test, expect } from "@playwright/test";

/**
 * Test the loading sequence: minimal HUD (roadmap) shows immediately,
 * then full UI appears after gameManager.init() resolves
 */
import { clearBrowserState } from './helpers/clear_browser_state.js';

test.describe("Loading Sequence", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });
  test("should show roadmap immediately, then complete UI after data loads", async ({ page, baseURL }) => {
    // Start navigation and immediately check for loading roadmap
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Roadmap overlay should be visible (either loading or populated)
    await expect(page.locator("#roadmap-overlay")).toBeVisible();

    // Wait for the app to fully load (roadmap should have actual content)
    await page.waitForSelector("#roadmap-tiers", { timeout: 30000 });

    // After loading, verify full UI is now visible
    await expect(page.locator("#navbar")).toBeVisible();
    await expect(page.locator("#sidebar")).toBeVisible();
    
    // Canvas should be present (dimensions may be set asynchronously)
    const canvas = page.locator("#circuit-canvas");
    await expect(canvas).toBeAttached();

    // Verify roadmap has real content (not loading placeholder)
    await expect(page.locator("#roadmap-tiers")).toBeVisible();
    await expect(page.locator("#roadmap-xp")).toBeVisible();

    // Verify the roadmap has actual level content
    const roadmapLevels = page.locator(".roadmap-level");
    await expect(roadmapLevels.first()).toBeVisible();

    // Verify stars and variant-select are visible for playable levels (not intro)
    // Skip level_00 (intro) which has no variants
    const playableLevels = page.locator('.roadmap-level:has(.variant-select)');
    const playableCount = await playableLevels.count();
    if (playableCount > 0) {
      await expect(playableLevels.first().locator(".difficulty-stars")).toBeVisible();
      await expect(playableLevels.first().locator(".variant-select")).toBeVisible();
    }
  });

  test("should maintain loading sequence timing", async ({ page, baseURL }) => {
    const startTime = Date.now();

    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Roadmap should appear quickly (< 2000ms for CI environments)
    await page.waitForSelector("#roadmap-overlay", { timeout: 2000 });
    const roadmapVisibleTime = Date.now() - startTime;
    expect(roadmapVisibleTime).toBeLessThan(2000);

    // Full UI should appear after data loads (but within reasonable time)
    await page.waitForSelector("#navbar", { timeout: 30000 });
    const fullUIVisibleTime = Date.now() - startTime;
    expect(fullUIVisibleTime).toBeGreaterThan(roadmapVisibleTime);
    expect(fullUIVisibleTime).toBeLessThan(30000); // Should load within 30 seconds
  });
});