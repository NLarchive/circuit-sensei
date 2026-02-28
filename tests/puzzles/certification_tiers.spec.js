// @ts-check
import { test, expect } from '@playwright/test';
import { navigateToHome } from './puzzle-helpers.js';

async function setCertificationTier(page, tier, { useHints = false } = {}) {
  await page.evaluate(async ({ tier, useHints }) => {
    const gm = window.gameManager;

    gm.progress.completedLevels = {};
    gm.progress.usedHints = {};

    const playableLevels = (gm.levels || []).filter(level => level && !level.isIndex);

    playableLevels.forEach((level) => {
      const variants = gm.getVariantsForLevel(level.id) || {};
      gm.progress.completedLevels[level.id] = { easy: false, medium: false, hard: false, expert: false, original: false };
      gm.progress.usedHints[level.id] = { easy: false, medium: false, hard: false, expert: false, original: false };

      const hasAnyVariant = Object.keys(variants).length > 0;
      const hasEasy = !!variants.easy || !hasAnyVariant;
      const hasMedium = !!variants.medium;
      const hasHard = !!variants.hard;
      const hasExpert = !!variants.expert;

      if (hasEasy) {
        gm.progress.completedLevels[level.id].easy = true;
        if (useHints) gm.progress.usedHints[level.id].easy = true;
      }
      if ((tier === 'intermediate' || tier === 'advanced' || tier === 'expert') && hasMedium) {
        gm.progress.completedLevels[level.id].medium = true;
        if (useHints) gm.progress.usedHints[level.id].medium = true;
      }
      if ((tier === 'advanced' || tier === 'expert') && hasHard) {
        gm.progress.completedLevels[level.id].hard = true;
        if (useHints) gm.progress.usedHints[level.id].hard = true;
      }
      if (tier === 'expert' && hasExpert) {
        gm.progress.completedLevels[level.id].expert = true;
        if (useHints) gm.progress.usedHints[level.id].expert = true;
      }
    });

    gm.recalculateProgressXP();
    gm.recalculateTiers();
    gm.refreshCertification();
    gm.saveProgress();

    window.HUDRoadmap.showRoadmap();
  }, { tier, useHints });
}

/**
 * Open the certification modal, enter a name, click "View Certificate",
 * wait for the formal-certificate preview, and screenshot it.
 */
async function openFormalCertificate(page, recipientName = 'Logic Architect Student') {
  // Open certification modal
  await page.locator('#btn-roadmap-certification').click();
  const panel = page.locator('#certification-modal .certmodal-box');
  await expect(panel).toBeVisible();

  // Fill recipient name
  const nameInput = page.locator('#certmodal-name-input');
  await nameInput.fill(recipientName);

  // Click "View Certificate" to open the formal preview
  const viewBtn = page.locator('#certmodal-btn-view');
  await expect(viewBtn).toBeEnabled();
  await viewBtn.click();

  // Wait for the formal certificate to render
  const previewModal = page.locator('#certificate-preview-modal');
  await expect(previewModal).toBeVisible({ timeout: 5000 });
  const certificate = previewModal.locator('.formal-certificate');
  await expect(certificate).toBeVisible();
  return certificate;
}

test.describe('Certification Tier Screenshots', () => {
  test('Simple certification — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'simple');

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_simple.png' });
  });

  test('Intermediate certification — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'intermediate');

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_intermediate.png' });
  });

  test('Advanced certification — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'advanced');

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_advanced.png' });
  });

  test('Hintless advanced — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'advanced', { useHints: false });

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_hintless.png' });
  });

  test('Guided learner (with hints) — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'advanced', { useHints: true });

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_guided.png' });
  });

  test('Expert certification — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'expert');

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_expert.png' });
  });

  test('Hintless expert — formal certificate', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'expert', { useHints: false });

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/certification_tier_expert_hintless.png' });
  });

  test('Advanced formal certificate — full preview', async ({ page, baseURL }) => {
    await navigateToHome(page, baseURL);
    await setCertificationTier(page, 'advanced');

    const cert = await openFormalCertificate(page, 'Jane Doe');
    await cert.screenshot({ path: 'tests/puzzles/__screenshots__/formal_certificate_advanced.png' });

    // Close preview
    await page.keyboard.press('Escape');
    const previewModal = page.locator('#certificate-preview-modal');
    await expect(previewModal).not.toBeVisible();
  });
});
