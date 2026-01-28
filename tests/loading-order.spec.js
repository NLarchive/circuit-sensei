import { test, expect } from "@playwright/test";

test.describe('Loading sequence: roadmap → navbar → main-view (no intro auto-show)', () => {
  test('renders roadmap first and does not auto-open level intro; canvas is initialized', async ({ page, baseURL }) => {
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 1) Roadmap should be visible quickly
    await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 5000 });

    // 2) Intro content should NOT appear automatically
    await expect(page.locator('#level-intro-overlay')).toBeHidden({ timeout: 1500 });

    // 3) Navbar should be revealed after data loads
    await page.waitForSelector('#navbar', { state: 'visible', timeout: 10000 });

    // 4) Main view canvas should have non-zero drawing buffer
    await page.waitForSelector('#circuit-canvas');
    const canvasSize = await page.evaluate(() => {
      const c = document.getElementById('circuit-canvas');
      return { w: c && c.width, h: c && c.height };
    });

    expect(canvasSize.w).toBeGreaterThan(0);
    expect(canvasSize.h).toBeGreaterThan(0);
  });
});