// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 14 – SR Latch', () => {
  test('Easy: SR latch', async ({ page, baseURL }) => {
    // 2 inputs (S,R), 2 outputs (Q,Q̅). Use srLatch component directly.
    // srLatch has 2 inputs [S, R] and 2 outputs [Q, Q̅]
    await solvePuzzle(page, baseURL, 'level_14', 'easy',
      [{ type: 'srLatch', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // S
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // R
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 }, // Q
        { from: 'gate_0', fromPin: 1, to: 'output_1', toPin: 0 }, // Q̅
      ],
      'level_14_easy'
    );
  });

  test('Medium: gated SR latch', async ({ page, baseURL }) => {
    // 3 inputs (S, R, EN), 2 outputs (Q, Q̅)
    // S_gated = S AND EN → srLatch.S
    // R_gated = R AND EN → srLatch.R
    await solvePuzzle(page, baseURL, 'level_14', 'medium',
      [
        { type: 'and',     x: 300, y: 100 },  // gate_0: S AND EN
        { type: 'and',     x: 300, y: 300 },  // gate_1: R AND EN
        { type: 'srLatch', x: 500, y: 200 },  // gate_2: SR Latch
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // S
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 1 },  // EN
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },  // R
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 },  // EN
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },  // S_gated
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },  // R_gated
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 }, // Q
        { from: 'gate_2',  fromPin: 1, to: 'output_1', toPin: 0 }, // Q̅
      ],
      'level_14_medium'
    );
  });

  test('Hard: D latch from gates', async ({ page, baseURL }) => {
    // 2 inputs (D, EN), 2 outputs (Q, Q̅)
    // S = D AND EN, R = NOT(D) AND EN → SR Latch
    await solvePuzzle(page, baseURL, 'level_14', 'hard',
      [
        { type: 'not',     x: 250, y: 250 },  // gate_0: NOT(D)
        { type: 'and',     x: 400, y: 100 },  // gate_1: D AND EN → S
        { type: 'and',     x: 400, y: 300 },  // gate_2: NOT(D) AND EN → R
        { type: 'srLatch', x: 550, y: 200 },  // gate_3: SR Latch
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // D→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // D
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },  // EN
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },  // NOT(D)
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },  // EN
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },  // S
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 1 },  // R
        { from: 'gate_3',  fromPin: 0, to: 'output_0', toPin: 0 }, // Q
        { from: 'gate_3',  fromPin: 1, to: 'output_1', toPin: 0 }, // Q̅
      ],
      'level_14_hard'
    );
  });
});
