// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 16 – Toggle & JK Flip-Flop', () => {
  test('Easy: T flip-flop (toggle)', async ({ page, baseURL }) => {
    // 1 input (CLK), 1 output (Q). Use dFlipFlop with Q̅ feedback to D.
    // D-FF: D = Q̅ (output pin 1), CLK = input
    // When CLK rises: captures Q̅ → toggles Q
    await solvePuzzle(page, baseURL, 'level_16', 'easy',
      [{ type: 'dFlipFlop', x: 400, y: 150 }],
      [
        { from: 'gate_0',  fromPin: 1, to: 'gate_0', toPin: 0 },  // Q̅→D (feedback)
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 }, // Q
      ],
      'level_16_easy'
    );
  });

  test('Medium: frequency divider', async ({ page, baseURL }) => {
    // 1 input (CLK), 1 output (Q). Same as T flip-flop: Q̅ → D
    // Output is half the clock frequency
    await solvePuzzle(page, baseURL, 'level_16', 'medium',
      [{ type: 'dFlipFlop', x: 400, y: 150 }],
      [
        { from: 'gate_0',  fromPin: 1, to: 'gate_0', toPin: 0 },  // Q̅→D
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 }, // Q
      ],
      'level_16_medium'
    );
  });

  test('Hard: JK flip-flop', async ({ page, baseURL }) => {
    // 3 inputs (J, K, CLK), 1 output (Q)
    // D = (J AND NOT Q) OR (NOT K AND Q)
    // gate_0: NOT(K) [from Q feedback, actually NOT(Q)]... 
    // Let me re-derive: D = J·Q̅ + K̅·Q
    // gate_0: dFlipFlop — the FF itself
    // gate_1: AND(J, Q̅) — J AND NOT Q
    // gate_2: NOT(K)
    // gate_3: AND(NOT_K, Q) — NOT K AND Q
    // gate_4: OR(gate_1, gate_3) — D input
    await solvePuzzle(page, baseURL, 'level_16', 'hard',
      [
        { type: 'dFlipFlop', x: 550, y: 200 },  // gate_0: D-FF
        { type: 'and',       x: 350, y: 100 },   // gate_1: J AND Q̅
        { type: 'not',       x: 250, y: 300 },   // gate_2: NOT(K)
        { type: 'and',       x: 350, y: 300 },   // gate_3: NOT(K) AND Q
        { type: 'or',        x: 450, y: 200 },   // gate_4: OR → D
      ],
      [
        // J AND Q̅
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // J
        { from: 'gate_0',  fromPin: 1, to: 'gate_1', toPin: 1 },  // Q̅ (pin 1 of D-FF)
        // NOT(K)
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 0 },  // K
        // NOT(K) AND Q
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 0 },  // NOT_K
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 1 },  // Q (feedback)
        // OR → D
        { from: 'gate_1', fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_3', fromPin: 0, to: 'gate_4', toPin: 1 },
        // D-FF connections
        { from: 'gate_4',  fromPin: 0, to: 'gate_0', toPin: 0 },  // D
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        // Output
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_16_hard'
    );
  });
});
