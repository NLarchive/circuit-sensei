// @ts-check
import { expect } from '@playwright/test';

/**
 * Shared helpers for puzzle solver E2E tests.
 *
 * Game exposes on window:
 *   - window.gameManager  (GameManager instance)
 *   - window.circuit       (Circuit instance)
 *   - window.globalEvents  (EventBus)
 */

/**
 * Navigate to home and wait for roadmap.
 */
export async function navigateToHome(page, baseURL) {
  const url = (baseURL || '/') + '?t=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#roadmap-overlay', { state: 'visible', timeout: 30000 });
}

/**
 * Load a specific level + variant via the GameManager API, wait for canvas.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} levelId  e.g. "level_01"
 * @param {string} variant  "easy" | "medium" | "hard"
 */
export async function loadLevelDirect(page, levelId, variant) {
  // Use the GameManager to load the level programmatically
  await page.evaluate(
    async ({ levelId, variant }) => {
      const gm = window.gameManager;
      // Ensure variant data is available
      if (!gm.levelVariants || !gm.levelVariants[levelId]) {
        const { StoryLoader } = await import('/src/utils/StoryLoader.js');
        const v = await StoryLoader.loadLevelVariants(levelId);
        if (v) {
          gm.levelVariants = gm.levelVariants || {};
          gm.levelVariants[levelId] = v;
        }
      }
      await gm.loadLevel(levelId, variant, { showIntro: false });
    },
    { levelId, variant }
  );

  // Wait for the circuit to settle (level loaded event triggers setupLevel)
  await page.waitForTimeout(600);

  // Ensure canvas is visible
  await expect(page.locator('#circuit-canvas')).toBeVisible({ timeout: 5000 });
}

/**
 * Build a circuit from a solution descriptor and verify.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Array<{type: string, x?: number, y?: number}>} gates  Gates to place
 * @param {Array<{from: string, fromPin: number, to: string, toPin: number}>} wires
 *   from/to: "input_0", "input_1", "output_0", "output_1", "gate_0", "gate_1", etc.
 *   (the first gates added will be gate_0, gate_1, ... in order of the gates array)
 * @returns {Promise<boolean>}  Whether verification passed
 */
export async function buildAndVerify(page, gates, wires) {
  const result = await page.evaluate(
    ({ gates, wires }) => {
      const circuit = window.circuit;
      // Locate existing input / output node ids
      const inputIds = circuit.inputs.map((n) => n.id);
      const outputIds = circuit.outputs.map((n) => n.id);

      // Place gates
      const placedIds = [];
      gates.forEach((g, i) => {
        const x = g.x ?? 300 + i * 120;
        const y = g.y ?? 200;
        const gate = circuit.addGate(g.type, x, y);
        placedIds.push(gate.id);
      });

      // Helper to resolve a name like "input_0", "output_1", "gate_2" to an actual gate id
      function resolveId(name) {
        const [prefix, idx] = name.split('_');
        const i = parseInt(idx, 10);
        if (prefix === 'input') return inputIds[i];
        if (prefix === 'output') return outputIds[i];
        if (prefix === 'gate') return placedIds[i];
        throw new Error(`Unknown gate ref: ${name}`);
      }

      // Connect wires
      wires.forEach((w) => {
        circuit.connect(resolveId(w.from), w.fromPin, resolveId(w.to), w.toPin);
      });

      // Simulate
      circuit.simulate();

      // Validate
      const { Validator } = window.__validatorModule || {};
      // Validator is a static import; we need to run it
      // Instead, click the verify button equivalent:
      const level = window.gameManager.currentLevel;
      if (!level) return { valid: false, error: 'No level loaded' };

      // Manual validation using circuit
      const truthTable = level.targetTruthTable || [];
      const sequence = level.targetSequence || [];

      if (sequence.length > 0) {
        // Sequential validation
        circuit.reset();
        const failedSteps = [];
        sequence.forEach((step, idx) => {
          circuit.setInputs(step.in);
          circuit.simulate();
          const actual = circuit.getOutputs();
          const expected = Array.isArray(step.out) ? step.out : [step.out];
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            failedSteps.push({ step: idx, expected, actual, inputs: step.in });
          }
        });
        return { valid: failedSteps.length === 0, failedSteps };
      }

      // Combinational validation
      const failedCases = [];
      truthTable.forEach((row, idx) => {
        circuit.setInputs(row.in);
        circuit.simulate();
        const actual = circuit.getOutputs();
        const expected = Array.isArray(row.out) ? row.out : [row.out];
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          failedCases.push({ case: idx, expected, actual, inputs: row.in });
        }
      });
      return { valid: failedCases.length === 0, failedCases };
    },
    { gates, wires }
  );

  return result;
}

/**
 * Take a snapshot of the canvas after solving.
 * @param {import('@playwright/test').Page} page
 * @param {string} name  Snapshot name
 */
export async function takeSnapshot(page, name) {
  // Trigger a re-draw
  await page.evaluate(() => {
    window.circuit.simulate();
  });
  await page.waitForTimeout(300);

  const canvas = page.locator('#circuit-canvas');
  await expect(canvas).toBeVisible();
  await canvas.screenshot({ path: `tests/puzzles/__screenshots__/${name}.png` });
}

/**
 * Full workflow: navigate, load level, build circuit, verify, snapshot.
 */
export async function solvePuzzle(page, baseURL, levelId, variant, gates, wires, snapshotName) {
  await navigateToHome(page, baseURL);
  await loadLevelDirect(page, levelId, variant);
  const result = await buildAndVerify(page, gates, wires);
  expect(result.valid, `Puzzle ${snapshotName} should be solvable. Failures: ${JSON.stringify(result.failedCases || result.failedSteps || [])}`).toBe(true);
  await takeSnapshot(page, snapshotName);
  return result;
}
