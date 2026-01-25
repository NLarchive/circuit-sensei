import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, baseURL }) => {
  // Navigate with cache-busting for live site testing
  // Use full baseURL + path with cache-bust param
  const targetUrl = (baseURL || '/') + '?t=' + Date.now();
  console.log('Navigating to:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  // Wait for app to initialize (data loaded, roadmap shown)
  await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 30000 });
  
  // Start the first playable level (Level 1) so gameplay UI is visible.
  await page.locator('.roadmap-level').nth(1).locator('.level-left').click();
  await page.waitForSelector('#level-intro-overlay:not(.hidden)', { timeout: 10000 });
  await page.click('#btn-start-level');

  // Wait for intro overlay to be hidden (class or display)
  await page.waitForFunction(() => {
    const overlay = document.getElementById('level-intro-overlay');
    return !overlay || overlay.classList.contains('hidden') || window.getComputedStyle(overlay).display === 'none';
  }, { timeout: 10000 });

  await expect(page.locator('#circuit-canvas')).toBeVisible({ timeout: 10000 });
});

test('should load the game and show the title', async ({ page }) => {
  const title = page.locator('#level-title');
  await expect(title).toBeVisible();
  await expect(title).not.toHaveText('Loading...', { timeout: 10000 });
});

test('should have a canvas for the circuit', async ({ page }) => {
  const canvas = page.locator('#circuit-canvas');
  await expect(canvas).toBeVisible();
});

test('should show the toolbox with components', async ({ page }) => {
  const toolbox = page.locator('.toolbox');
  await expect(toolbox).toBeVisible();
  
  // Check if gate list container exists
  const gateList = page.locator('#gate-list');
  await expect(gateList).toBeVisible();
});

test('should be able to click verify button', async ({ page }) => {
  const verifyBtn = page.locator('#btn-check');
  await expect(verifyBtn).toBeVisible();
  await expect(verifyBtn).toBeEnabled();
  await verifyBtn.click();
  
  // Verify completes without error - message area exists
  const messageArea = page.locator('#message-area');
  await expect(messageArea).toBeAttached();
});
