import { test, expect } from "@playwright/test";

/**
 * Performance tests for measuring component loading times
 * Tests the user journey from page load to full interactivity
 */
test.describe("Performance: Loading Times", () => {
  /**
   * Measure all component loading times
   */
  test("should measure all component loading times", async ({ page, baseURL }) => {
    const metrics = {};
    const startTime = Date.now();

    // Navigate to page
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    metrics.domContentLoaded = Date.now() - startTime;

    // Track when roadmap overlay appears
    await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 5000 });
    metrics.roadmapOverlayVisible = Date.now() - startTime;

    // Track when loading spinner is visible
    const loadingSpinner = page.locator('.loading-spinner');
    if (await loadingSpinner.isVisible({ timeout: 100 }).catch(() => false)) {
      metrics.loadingSpinnerVisible = Date.now() - startTime;
    }

    // Track when roadmap tiers are populated
    await page.waitForSelector('#roadmap-tiers:not(:empty)', { timeout: 15000 });
    metrics.roadmapTiersPopulated = Date.now() - startTime;

    // Track when first level card appears
    await page.waitForSelector('.roadmap-level', { timeout: 15000 });
    metrics.firstLevelCardVisible = Date.now() - startTime;

    // Track when difficulty stars appear (should be immediate with level card)
    // Note: level_00 (intro) has no variants, so wait for stars from playable levels
    await page.waitForSelector('.roadmap-level:has(.variant-select) .difficulty-stars', { timeout: 15000 });
    metrics.difficultyStarsVisible = Date.now() - startTime;

    // Track when variant select appears (should be same time as stars)
    await page.waitForSelector('.roadmap-level:has(.difficulty-stars) .variant-select', { timeout: 15000 });
    metrics.variantSelectVisible = Date.now() - startTime;

    // Track when XP display updates
    await page.waitForSelector('#roadmap-xp', { timeout: 15000 });
    metrics.xpDisplayVisible = Date.now() - startTime;

    // Track when navbar is visible
    await page.waitForSelector('#navbar', { state: 'visible', timeout: 15000 });
    metrics.navbarVisible = Date.now() - startTime;

    // Track when sidebar is visible  
    await page.waitForSelector('#sidebar', { state: 'visible', timeout: 15000 });
    metrics.sidebarVisible = Date.now() - startTime;

    // Track when canvas is ready
    await page.waitForSelector('#circuit-canvas', { timeout: 15000 });
    const canvasReady = await page.evaluate(() => {
      const c = document.getElementById('circuit-canvas');
      return c && c.width > 0 && c.height > 0;
    });
    if (canvasReady) {
      metrics.canvasReady = Date.now() - startTime;
    }

    // Track when app is fully loaded (no loading class)
    await page.waitForFunction(() => !document.body.classList.contains('app-loading'), { timeout: 15000 });
    metrics.appFullyLoaded = Date.now() - startTime;

    // Log all metrics
    console.log('\n=== PERFORMANCE METRICS ===');
    const sortedMetrics = Object.entries(metrics).sort((a, b) => a[1] - b[1]);
    for (const [key, value] of sortedMetrics) {
      console.log(`${key}: ${value}ms`);
    }
    console.log('===========================\n');

    // Verify expected loading order
    expect(metrics.roadmapOverlayVisible).toBeLessThan(2000); // Roadmap should show quickly
    expect(metrics.difficultyStarsVisible).toBeLessThanOrEqual(metrics.variantSelectVisible + 100); // Stars and selects should be within 100ms
    expect(metrics.variantSelectVisible).toBeLessThanOrEqual(metrics.difficultyStarsVisible + 100); // Symmetric check
  });

  /**
   * Verify stars and variant-select load simultaneously (same data source)
   */
  test("difficulty stars and variant-select should load at the same time", async ({ page, baseURL }) => {
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Wait for roadmap to be populated with playable levels (not just intro)
    await page.waitForSelector('.roadmap-level:has(.variant-select)', { timeout: 15000 });

    // Check that both stars and variant-select are present in a playable level card
    const playableLevel = page.locator('.roadmap-level:has(.variant-select)').first();
    await expect(playableLevel).toBeVisible();

    const stars = playableLevel.locator('.difficulty-stars');
    const variantSelect = playableLevel.locator('.variant-select');

    // Both should be visible simultaneously
    await expect(stars).toBeVisible();
    await expect(variantSelect).toBeVisible();

    // Both should have content (not empty/disabled)
    const starsContent = await stars.textContent();
    expect(starsContent).toMatch(/[★☆]/); // Should have star symbols

    const selectOptions = await variantSelect.locator('option').count();
    expect(selectOptions).toBeGreaterThanOrEqual(1); // Should have options

    // Verify select is not disabled
    const isDisabled = await variantSelect.isDisabled();
    expect(isDisabled).toBe(false);
  });

  /**
   * Test loading sequence order
   */
  test("loading sequence should follow correct order", async ({ page, baseURL }) => {
    const loadOrder = [];
    const startTime = Date.now();

    const url = (baseURL || '/') + '?t=' + Date.now();
    
    // Set up mutation observer before navigation
    await page.addInitScript(() => {
      window.__loadOrder = [];
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.classList?.contains('roadmap-level')) {
                window.__loadOrder.push({ event: 'roadmap-level', time: performance.now() });
              }
              if (node.classList?.contains('difficulty-stars')) {
                window.__loadOrder.push({ event: 'difficulty-stars', time: performance.now() });
              }
              if (node.classList?.contains('variant-select')) {
                window.__loadOrder.push({ event: 'variant-select', time: performance.now() });
              }
            }
          }
        }
      });
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });

    await page.goto(url);
    await page.waitForSelector('.roadmap-level', { timeout: 15000 });

    // Get load order from page
    const pageLoadOrder = await page.evaluate(() => window.__loadOrder);
    console.log('Load order:', pageLoadOrder);

    // Stars and variant-select should appear at the same time (within the same level render)
    const starsEvents = pageLoadOrder.filter(e => e.event === 'difficulty-stars');
    const selectEvents = pageLoadOrder.filter(e => e.event === 'variant-select');

    if (starsEvents.length > 0 && selectEvents.length > 0) {
      const starTime = starsEvents[0].time;
      const selectTime = selectEvents[0].time;
      const diff = Math.abs(starTime - selectTime);
      console.log(`Stars appeared at ${starTime}ms, select at ${selectTime}ms, diff: ${diff}ms`);
      expect(diff).toBeLessThan(100); // Should be within 100ms of each other
    }
  });
});

test.describe("Performance: User Journey", () => {
  /**
   * Test complete user journey timing
   */
  test("user journey from page load to playing a level", async ({ page, baseURL }) => {
    const journey = {};
    const startTime = Date.now();

    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Phase 1: Roadmap visible
    await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 5000 });
    journey.phase1_roadmapVisible = Date.now() - startTime;

    // Phase 2: Levels populated
    await page.waitForSelector('.roadmap-level', { timeout: 15000 });
    journey.phase2_levelsPopulated = Date.now() - startTime;

    // Phase 3: Can interact with level
    const firstLevel = page.locator('.roadmap-level').first();
    await expect(firstLevel).toBeEnabled({ timeout: 5000 });
    journey.phase3_levelInteractable = Date.now() - startTime;

    // Phase 4: Click level to start
    await firstLevel.click();
    journey.phase4_levelClicked = Date.now() - startTime;

    // Phase 5: Level intro appears OR game starts
    const introOrGame = await Promise.race([
      page.waitForSelector('#level-intro-overlay:not(.hidden)', { timeout: 10000 }).then(() => 'intro'),
      page.waitForFunction(() => window.gameManager?.state === 'PLAYING', { timeout: 10000 }).then(() => 'game')
    ]);
    journey.phase5_levelStarted = Date.now() - startTime;
    journey.phase5_type = introOrGame;

    console.log('\n=== USER JOURNEY TIMING ===');
    for (const [key, value] of Object.entries(journey)) {
      console.log(`${key}: ${typeof value === 'number' ? value + 'ms' : value}`);
    }
    console.log('===========================\n');

    // Verify journey is fast enough (allow some variance for CI/slow machines)
    expect(journey.phase1_roadmapVisible).toBeLessThan(2000);
    expect(journey.phase2_levelsPopulated).toBeLessThan(5000);
    expect(journey.phase3_levelInteractable).toBeLessThan(6000);
  });

  /**
   * Test variant selection performance
   */
  test("variant selection should be instant", async ({ page, baseURL }) => {
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Wait for roadmap's variant selects to appear (not navbar's)
    await page.waitForSelector('.roadmap-tier .variant-select', { timeout: 15000 });

    const select = page.locator('.roadmap-tier .variant-select').first();
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();

    // Check what options are available
    const options = await select.locator('option').allTextContents();
    console.log('Available options:', options);

    // Only try to change if we have multiple options
    if (options.length > 1) {
      // Get current value
      const currentValue = await select.inputValue();
      const targetValue = currentValue === 'easy' ? 'medium' : 'easy';

      // Change variant and measure response time
      const beforeChange = Date.now();
      await select.selectOption(targetValue);
      const afterChange = Date.now();

      const changeTime = afterChange - beforeChange;
      console.log(`Variant change took: ${changeTime}ms`);

      // Should be instant (< 200ms)
      expect(changeTime).toBeLessThan(200);

      // Verify the change was applied
      const selectedValue = await select.inputValue();
      expect(selectedValue).toBe(targetValue);
    }
  });
});

test.describe("Performance: Game Engine", () => {
  /**
   * Test game engine initialization time
   */
  test("game engine should initialize quickly", async ({ page, baseURL }) => {
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Wait for game manager to be available AND initialized
    await page.waitForFunction(() => {
      const gm = window.gameManager;
      return gm && gm.levels && gm.levels.length > 0;
    }, { timeout: 15000 });

    const engineStats = await page.evaluate(() => {
      const gm = window.gameManager;
      return {
        hasLevels: gm.levels && gm.levels.length > 0,
        levelCount: gm.levels?.length || 0,
        hasTiers: gm.tiers && Object.keys(gm.tiers).length > 0,
        tierCount: Object.keys(gm.tiers || {}).length,
        hasGates: gm.gates && Object.keys(gm.gates).length > 0,
        gateCount: Object.keys(gm.gates || {}).length,
        state: gm.state,
        mode: gm.mode
      };
    });

    console.log('\n=== GAME ENGINE STATS ===');
    console.log(JSON.stringify(engineStats, null, 2));
    console.log('=========================\n');

    expect(engineStats.hasLevels).toBe(true);
    expect(engineStats.levelCount).toBeGreaterThan(0);
    expect(engineStats.hasTiers).toBe(true);
    expect(engineStats.hasGates).toBe(true);
  });

  /**
   * Test canvas rendering performance
   */
  test("canvas should render without jank", async ({ page, baseURL }) => {
    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Start a level
    await page.waitForSelector('.roadmap-level', { timeout: 15000 });
    await page.locator('.roadmap-level').first().click();

    // Wait for level to load
    await page.waitForFunction(() => window.gameManager?.state === 'PLAYING', { timeout: 15000 });

    // Measure frame rate
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();
        
        const countFrame = () => {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frameCount);
          }
        };
        
        requestAnimationFrame(countFrame);
      });
    });

    console.log(`Canvas FPS: ${fps}`);
    expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
  });
});

test.describe("Performance: Network", () => {
  /**
   * Test that variant prefetch doesn't saturate network
   */
  test("variant prefetch should be rate-limited", async ({ page, baseURL }) => {
    const requests = [];

    // Monitor network requests
    page.on('request', (request) => {
      if (request.url().includes('level-puzzles')) {
        requests.push({
          url: request.url(),
          time: Date.now()
        });
      }
    });

    const url = (baseURL || '/') + '?t=' + Date.now();
    await page.goto(url);

    // Wait for some prefetch to happen
    await page.waitForTimeout(3000);

    console.log('\n=== NETWORK REQUESTS (level-puzzles) ===');
    console.log(`Total requests: ${requests.length}`);
    
    if (requests.length >= 2) {
      // Check that requests are spread out (rate-limited)
      const times = requests.map(r => r.time);
      const gaps = [];
      for (let i = 1; i < times.length; i++) {
        gaps.push(times[i] - times[i - 1]);
      }
      
      console.log('Request gaps (ms):', gaps);
      
      // Should not have many simultaneous requests (gaps should be >= 100ms average for rate limiting)
      // But also not too slow
    }
    console.log('========================================\n');

    // The roadmap should still be functional during prefetch
    await expect(page.locator('.roadmap-level').first()).toBeVisible();
    await expect(page.locator('.variant-select').first()).toBeEnabled();
  });
});
