// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 17 – Counters', () => {
  test('Easy: 2-bit ripple counter', async ({ page, baseURL }) => {
    // 1 input (CLK), 2 outputs (Q0, Q1)
    // Binary up-counter: 00→01→10→11→00
    // D0 = NOT(Q0), D1 = Q1 XOR Q0
    await solvePuzzle(page, baseURL, 'level_17', 'easy',
      [
        { type: 'dFlipFlop', x: 450, y: 100 },
        { type: 'dFlipFlop', x: 450, y: 300 },
        { type: 'not',       x: 300, y: 100 },
        { type: 'xor',       x: 300, y: 300 },
      ],
      [
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK

        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },

        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 }, // Q0
        { from: 'gate_1', fromPin: 0, to: 'output_1', toPin: 0 }, // Q1
      ],
      'level_17_easy'
    );
  });

  test('Medium: Gray code counter', async ({ page, baseURL }) => {
    // Build internal binary counter then output Gray bits.
    // Binary: b1b0 = 00→01→10→11; Gray output: g1=b1, g0=b1 XOR b0 => 00→01→11→10
    await solvePuzzle(page, baseURL, 'level_17', 'medium',
      [
        { type: 'dFlipFlop', x: 450, y: 100 },
        { type: 'dFlipFlop', x: 450, y: 300 },
        { type: 'not',       x: 300, y: 100 },
        { type: 'xor',       x: 300, y: 300 },
        { type: 'xor',       x: 620, y: 200 },
      ],
      [
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },

        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },

        { from: 'gate_1', fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_0', fromPin: 0, to: 'gate_4', toPin: 1 },

        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 }, // g1 = b1
        { from: 'gate_4', fromPin: 0, to: 'output_1', toPin: 0 }, // g0 = b1 XOR b0
      ],
      'level_17_medium'
    );
  });

  test('Hard: synchronous 2-bit counter', async ({ page, baseURL }) => {
    // 1 input (CLK), 2 outputs (Q1, Q0). Binary: 00→01→10→11→00
    // D0 = NOT(Q0), D1 = Q1 XOR Q0
    // gate_0: dFlipFlop (Q0), gate_1: dFlipFlop (Q1)
    // gate_2: NOT(Q0) → D0, gate_3: XOR(Q1, Q0) → D1
    await solvePuzzle(page, baseURL, 'level_17', 'hard',
      [
        { type: 'dFlipFlop', x: 450, y: 100 },  // gate_0: FF0 (Q0)
        { type: 'dFlipFlop', x: 450, y: 300 },  // gate_1: FF1 (Q1)
        { type: 'not',       x: 300, y: 100 },   // gate_2: NOT(Q0) → D0
        { type: 'xor',       x: 300, y: 300 },   // gate_3: XOR(Q1, Q0) → D1
      ],
      [
        // D0 = NOT(Q0)
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },  // Q0→NOT
        { from: 'gate_2',  fromPin: 0, to: 'gate_0', toPin: 0 },  // NOT(Q0)→D0
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        // D1 = Q1 XOR Q0
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },  // Q1
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 1 },  // Q0
        { from: 'gate_3',  fromPin: 0, to: 'gate_1', toPin: 0 },  // XOR→D1
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },  // CLK
        // Outputs
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 }, // Q1
        { from: 'gate_0', fromPin: 0, to: 'output_1', toPin: 0 }, // Q0
      ],
      'level_17_hard'
    );
  });
});
