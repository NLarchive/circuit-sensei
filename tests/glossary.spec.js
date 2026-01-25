import { test, expect } from '@playwright/test';

async function startLevelFromIntro(page) {
  await page.waitForSelector('#btn-start-level', { state: 'visible', timeout: 5000 });
  await page.locator('#btn-start-level').click();
  await page.waitForFunction(() => {
    const overlay = document.getElementById('level-intro-overlay');
    return !overlay || overlay.classList.contains('hidden') || window.getComputedStyle(overlay).display === 'none';
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

test.describe('Glossary (reference guide)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#roadmap-overlay:not(.hidden)', { timeout: 10000 });

    // Enter first playable level so the HUD/nav controls are available.
    await page.locator('.roadmap-level').nth(1).locator('.level-left').click();
    await startLevelFromIntro(page);
  });

  test('opens, switches tabs, searches, and closes', async ({ page }) => {
    await page.click('#btn-glossary');
    await expect(page.locator('#glossary-overlay')).not.toHaveClass(/hidden/, { timeout: 5000 });

    // Acronyms tab should render items
    await page.waitForSelector('#glossary-list .glossary-item', { timeout: 10000 });
    const initialCount = await page.locator('#glossary-list .glossary-item').count();
    expect(initialCount).toBeGreaterThan(5);

    // Search should reduce the visible set (use first item's data-key)
    const firstKey = (await page.locator('#glossary-list .glossary-item').first().getAttribute('data-key')) || '';
    const searchTerm = firstKey.slice(0, Math.min(4, firstKey.length)) || 'a';

    await page.fill('#glossary-search-input', searchTerm);
    const visibleCount = await page.locator('#glossary-list .glossary-item').evaluateAll((els) =>
      els.filter((el) => el.style.display !== 'none').length
    );
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(initialCount);

    await page.fill('#glossary-search-input', '');

    // Switch to Terms
    await page.click('.glossary-tab[data-tab="terms"]');
    await expect(page.locator('.glossary-tab.active[data-tab="terms"]')).toBeVisible();
    await page.waitForSelector('#glossary-list .glossary-item', { timeout: 10000 });

    // Expand/collapse toggles the class
    const firstItem = page.locator('#glossary-list .glossary-item').first();
    await firstItem.locator('.glossary-item-header').click();
    await expect(firstItem).toHaveClass(/expanded/);
    await firstItem.locator('.glossary-item-header').click();
    await expect(firstItem).not.toHaveClass(/expanded/);

    // "This Level" tab should show a level header
    await page.click('.glossary-tab[data-tab="current"]');
    await page.waitForSelector('#glossary-list h3', { timeout: 10000 });
    await expect(page.locator('#glossary-list h3').first()).toContainText('Level');

    // Close
    await page.click('#btn-close-glossary');
    await expect(page.locator('#glossary-overlay')).toHaveClass(/hidden/, { timeout: 5000 });
  });
});
