import { test, expect } from '@playwright/test';

test.describe('Difficulty selector (roadmap + navbar)', () => {
  test('can select difficulty on roadmap and change it in-game from navbar', async ({ page, baseURL }) => {
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url, { waitUntil: 'networkidle' });

    // Roadmap should appear
    await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 30000 });

    // Pick Level 1 (second roadmap item) and set difficulty to Hard before entering
    const level1 = page.locator('.roadmap-level').nth(1);
    await expect(level1).toBeVisible();

    const level1Select = level1.locator('select.variant-select');
    await expect(level1Select).toBeVisible();
    await level1Select.selectOption('hard');

    // Enter level intro (click on the left side to avoid the nested <select>)
    await level1.locator('.level-left').click();
    await expect(page.locator('#level-intro-overlay')).not.toHaveClass(/hidden/, { timeout: 5000 });

    // Start gameplay
    await page.click('#btn-start-level');
    await expect(page.locator('#level-intro-overlay')).toHaveClass(/hidden/, { timeout: 5000 });

    // Navbar selectors: at least one should be visible and reflect 'hard'
    const inlineSel = page.locator('#nav-variant-select-inline');
    const titleSel = page.locator('#nav-variant-select');

    const inlineVisible = await inlineSel.isVisible().catch(() => false);
    const titleVisible = await titleSel.isVisible().catch(() => false);
    expect(inlineVisible || titleVisible).toBeTruthy();

    if (inlineVisible) {
      await expect(inlineSel).toHaveValue('hard');
      await expect(inlineSel).toHaveClass(/badge-hard/);
    } else {
      await expect(titleSel).toHaveValue('hard');
      await expect(titleSel).toHaveClass(/badge-hard/);
    }

    // Change difficulty in-game from whichever selector is visible
    if (inlineVisible) {
      await inlineSel.selectOption('easy');
    } else {
      await titleSel.selectOption('easy');
    }

    // Wait for game manager to apply variant
    await page.waitForFunction(() => window.gameManager?.currentVariant === 'easy');

    // Intro overlay should be hidden after changing variant
    await expect(page.locator('#level-intro-overlay')).toHaveClass(/hidden/, { timeout: 5000 });

    // Both selectors should reflect the change (visibility independent)
    await expect(inlineSel).toHaveValue('easy');
    await expect(inlineSel).toHaveClass(/badge-easy/);
    await expect(titleSel).toHaveValue('easy');
    await expect(titleSel).toHaveClass(/badge-easy/);
  });
});
