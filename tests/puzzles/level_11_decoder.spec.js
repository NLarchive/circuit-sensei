// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 11 – Decoder & Encoder', () => {
  test('Easy: 2-to-4 decoder', async ({ page, baseURL }) => {
    // 2 inputs (A1, A0), 4 outputs (O0, O1, O2, O3)
    // O0 = NOT(A1)·NOT(A0), O1 = NOT(A1)·A0, O2 = A1·NOT(A0), O3 = A1·A0
    // gate_0: NOT(A1), gate_1: NOT(A0)
    // gate_2: AND(NOT_A1, NOT_A0) → O0
    // gate_3: AND(NOT_A1, A0) → O1
    // gate_4: AND(A1, NOT_A0) → O2
    // gate_5: AND(A1, A0) → O3
    await solvePuzzle(page, baseURL, 'level_11', 'easy',
      [
        { type: 'not', x: 250, y: 100 },  // gate_0: NOT(A1)
        { type: 'not', x: 250, y: 300 },  // gate_1: NOT(A0)
        { type: 'and', x: 450, y: 50 },   // gate_2: O0
        { type: 'and', x: 450, y: 200 },  // gate_3: O1
        { type: 'and', x: 450, y: 350 },  // gate_4: O2
        { type: 'and', x: 450, y: 500 },  // gate_5: O3
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A1→NOT
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },  // A0→NOT
        // O0 = NOT_A1 · NOT_A0
        { from: 'gate_0', fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'gate_2', toPin: 1 },
        // O1 = NOT_A1 · A0
        { from: 'gate_0', fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 1 },
        // O2 = A1 · NOT_A0
        { from: 'input_0', fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'gate_4', toPin: 1 },
        // O3 = A1 · A0
        { from: 'input_0', fromPin: 0, to: 'gate_5', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_5', toPin: 1 },
        // Connect outputs
        { from: 'gate_2', fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'gate_3', fromPin: 0, to: 'output_1', toPin: 0 },
        { from: 'gate_4', fromPin: 0, to: 'output_2', toPin: 0 },
        { from: 'gate_5', fromPin: 0, to: 'output_3', toPin: 0 },
      ],
      'level_11_easy'
    );
  });

  test('Medium: decoder with enable', async ({ page, baseURL }) => {
    // 3 inputs (A1, A0, EN), 4 outputs. Same as above but each AND gets EN as extra input.
    // Since AND is 2-input, we need cascades: AND(decode, EN)
    // gate_0: NOT(A1), gate_1: NOT(A0)
    // gate_2: AND(NOT_A1, NOT_A0), gate_3: AND(NOT_A1, A0), gate_4: AND(A1, NOT_A0), gate_5: AND(A1, A0)
    // gate_6: AND(gate_2, EN)→O0, gate_7: AND(gate_3, EN)→O1
    // gate_8: AND(gate_4, EN)→O2, gate_9: AND(gate_5, EN)→O3
    await solvePuzzle(page, baseURL, 'level_11', 'medium',
      [
        { type: 'not', x: 230, y: 100 },  // gate_0: NOT(A1)
        { type: 'not', x: 230, y: 300 },  // gate_1: NOT(A0)
        { type: 'and', x: 380, y: 50 },   // gate_2: NOT_A1·NOT_A0
        { type: 'and', x: 380, y: 200 },  // gate_3: NOT_A1·A0
        { type: 'and', x: 380, y: 350 },  // gate_4: A1·NOT_A0
        { type: 'and', x: 380, y: 500 },  // gate_5: A1·A0
        { type: 'and', x: 550, y: 50 },   // gate_6: g2·EN→O0
        { type: 'and', x: 550, y: 200 },  // gate_7: g3·EN→O1
        { type: 'and', x: 550, y: 350 },  // gate_8: g4·EN→O2
        { type: 'and', x: 550, y: 500 },  // gate_9: g5·EN→O3
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'input_0', fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_4', toPin: 1 },
        { from: 'input_0', fromPin: 0, to: 'gate_5', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_5', toPin: 1 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_6', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_6', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_7', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_7', toPin: 1 },
        { from: 'gate_4',  fromPin: 0, to: 'gate_8', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_8', toPin: 1 },
        { from: 'gate_5',  fromPin: 0, to: 'gate_9', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_9', toPin: 1 },
        { from: 'gate_6',  fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'gate_7',  fromPin: 0, to: 'output_1', toPin: 0 },
        { from: 'gate_8',  fromPin: 0, to: 'output_2', toPin: 0 },
        { from: 'gate_9',  fromPin: 0, to: 'output_3', toPin: 0 },
      ],
      'level_11_medium'
    );
  });

  test('Hard: priority encoder', async ({ page, baseURL }) => {
    // 4 inputs (I3,I2,I1,I0), 2 outputs (O1,O0)
    // O1 = I3 OR I2
    // O0 = I3 OR (I1 AND NOT I2)
    // gate_0: NOT(I2), gate_1: AND(I1, NOT_I2), gate_2: OR(I3, I2) → O1
    // gate_3: OR(I3, gate_1) → O0
    await solvePuzzle(page, baseURL, 'level_11', 'hard',
      [
        { type: 'not', x: 300, y: 250 },  // gate_0: NOT(I2)
        { type: 'and', x: 400, y: 300 },  // gate_1: AND(I1, NOT_I2)
        { type: 'or',  x: 500, y: 100 },  // gate_2: OR(I3, I2) → O1
        { type: 'or',  x: 550, y: 300 },  // gate_3: OR(I3, gate_1) → O0
      ],
      [
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },   // I2→NOT
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 0 },   // I1
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 },   // NOT_I2
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },   // I3
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },   // I2
        { from: 'input_0', fromPin: 0, to: 'gate_3', toPin: 0 },   // I3
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 1 },   // AND(I1, NOT_I2)
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 }, // O1
        { from: 'gate_3',  fromPin: 0, to: 'output_1', toPin: 0 }, // O0
      ],
      'level_11_hard'
    );
  });
});
