import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone SE'] });

test('Mobile UI (iPhone SE): sidebar drawer and navbar overflow menu work', async ({ page, baseURL }) => {
  const url = (baseURL || '/') + '?t=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Roadmap overlay covers the screen on first load; enter a level so the navbar is clickable.
  await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 30000 });
  const level1 = page.locator('.roadmap-level').nth(1);
  await expect(level1).toBeVisible();
  await level1.locator('.level-left').click();
  await expect(page.locator('#level-intro-overlay')).not.toHaveClass(/hidden/, { timeout: 5000 });
  await page.click('#btn-start-level');
  await expect(page.locator('#level-intro-overlay')).toHaveClass(/hidden/, { timeout: 5000 });

  // Wait for HUD to render
  await expect(page.locator('#navbar')).toBeVisible();
  await expect(page.locator('#btn-toggle-sidebar')).toBeVisible();

  // Sidebar opens (use evaluate click to avoid pointer interception flakiness)
  await page.evaluate(() => document.getElementById('btn-toggle-sidebar')?.click());
  await expect(page.locator('#sidebar')).toHaveClass(/mobile-open/);
  await expect(page.locator('#sidebar-backdrop')).toBeVisible();

  // Verify a tap outside the drawer would hit the backdrop (tap-outside-to-close)
  const hit = await page.evaluate(() => {
    const x = Math.max(0, Math.floor(window.innerWidth - 8));
    const y = Math.max(0, Math.floor(window.innerHeight / 2));
    const el = document.elementFromPoint(x, y);
    return {
      tag: el?.tagName || null,
      id: el?.id || null,
      className: el?.className || null,
    };
  });
  expect(hit.id === 'sidebar-backdrop' || (hit.className && String(hit.className).includes('backdrop'))).toBeTruthy();

  // Close via the same toggle button (stable in automated runs)
  await page.evaluate(() => document.getElementById('btn-toggle-sidebar')?.click());
  await expect(page.locator('#sidebar')).not.toHaveClass(/mobile-open/);
  await expect(page.locator('#sidebar-backdrop')).not.toBeVisible();

  // Navbar overflow menu opens
  const moreSummary = page.locator('#nav-more > summary');
  await expect(moreSummary).toBeVisible();
  await moreSummary.click();
  await expect(page.locator('#nav-more .nav-more-menu')).toBeVisible();
});
