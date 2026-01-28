import { test, expect } from "@playwright/test";

/**
 * Test the loading sequence: minimal HUD (roadmap) shows immediately,
 * then full UI appears after gameManager.init() resolves
 */
test.describe("Loading Sequence", () => {
  test("should show roadmap immediately, then complete UI after data loads", async ({ page, baseURL }) => {
    // Start navigation and immediately check for loading roadmap
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Immediately check that loading roadmap is visible (before data loads)
    await expect(page.locator("#roadmap-overlay")).toBeVisible();

    // Check that loading content is shown
    await expect(page.locator(".loading-roadmap")).toBeVisible();
    await expect(page.locator(".loading-spinner")).toBeVisible();
    await expect(page.getByText("Loading Logic Architect...")).toBeVisible();

    // Verify that main UI elements are still hidden during loading
    await expect(page.locator("#navbar")).not.toBeVisible();
    await expect(page.locator("#sidebar")).not.toBeVisible();
    await expect(page.locator("#circuit-canvas")).not.toBeVisible();

    // Wait for the app to fully load (roadmap should update with actual content)
    await page.waitForSelector("#roadmap-tiers", { timeout: 30000 });

    // After loading, verify full UI is now visible
    await expect(page.locator("#navbar")).toBeVisible();
    await expect(page.locator("#sidebar")).toBeVisible();
    
    // Canvas should be present (dimensions may be set asynchronously)
    const canvas = page.locator("#circuit-canvas");
    await expect(canvas).toBeAttached();

    // Verify loading content is gone and real roadmap content is present
    await expect(page.locator(".loading-roadmap")).not.toBeVisible();
    await expect(page.locator("#roadmap-tiers")).toBeVisible();
    await expect(page.locator("#roadmap-xp")).toBeVisible();

    // Verify the roadmap has actual level content (not just loading text)
    const roadmapLevels = page.locator(".roadmap-level");
    await expect(roadmapLevels.first()).toBeVisible();
  });

  test("should maintain loading sequence timing", async ({ page, baseURL }) => {
    const startTime = Date.now();

    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Roadmap should appear quickly (< 1000ms)
    await page.waitForSelector("#roadmap-overlay", { timeout: 1000 });
    const roadmapVisibleTime = Date.now() - startTime;
    expect(roadmapVisibleTime).toBeLessThan(1000);

    // Full UI should appear after data loads (but within reasonable time)
    await page.waitForSelector("#navbar", { timeout: 30000 });
    const fullUIVisibleTime = Date.now() - startTime;
    expect(fullUIVisibleTime).toBeGreaterThan(roadmapVisibleTime);
    expect(fullUIVisibleTime).toBeLessThan(30000); // Should load within 30 seconds
  });
});