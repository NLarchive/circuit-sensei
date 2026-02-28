// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 08 – XOR (Exclusive OR)', () => {
  test('Easy: single XOR gate', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_08', 'easy',
      [{ type: 'xor', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_08_easy'
    );
  });

  test('Medium: XNOR equality detector', async ({ page, baseURL }) => {
    // XNOR = (A·B) + (Ā·B̄), no XOR available
    // Available: transistor, not, and, or, nand, nor
    // Solution: NOT(A) → Ā, NOT(B) → B̄, AND(A,B), AND(Ā,B̄), OR(AB, ĀB̄)
    // 5 gates: 2 NOT + 2 AND + 1 OR
    await solvePuzzle(page, baseURL, 'level_08', 'medium',
      [
        { type: 'not', x: 250, y: 100 },  // gate_0: NOT(A) = Ā
        { type: 'not', x: 250, y: 300 },  // gate_1: NOT(B) = B̄
        { type: 'and', x: 400, y: 100 },  // gate_2: AND(A, B)
        { type: 'and', x: 400, y: 300 },  // gate_3: AND(Ā, B̄)
        { type: 'or',  x: 550, y: 200 },  // gate_4: OR(gate_2, gate_3)
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A→NOT
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },  // B→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // A→AND.in0
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },  // B→AND.in1
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 0 },  // Ā→AND.in0
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 1 },  // B̄→AND.in1
        { from: 'gate_2',  fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 1 },
        { from: 'gate_4',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_08_medium'
    );
  });

  test('Hard: parity generator (3-bit)', async ({ page, baseURL }) => {
    // (A XOR B) XOR C — chain two XOR gates
    await solvePuzzle(page, baseURL, 'level_08', 'hard',
      [
        { type: 'xor', x: 350, y: 150 },
        { type: 'xor', x: 500, y: 200 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'gate_1',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_08_hard'
    );
  });
});
