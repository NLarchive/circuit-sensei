// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 07 – Logic from NAND', () => {
  test('Easy: NOT from NAND', async ({ page, baseURL }) => {
    // NAND(A,A) = NOT(A)
    await solvePuzzle(page, baseURL, 'level_07', 'easy',
      [{ type: 'nand', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_07_easy'
    );
  });

  test('Medium: AND from NAND', async ({ page, baseURL }) => {
    // gate_0: NAND(A,B) → X,  gate_1: NAND(X,X) → AND
    await solvePuzzle(page, baseURL, 'level_07', 'medium',
      [
        { type: 'nand', x: 350, y: 150 },
        { type: 'nand', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_07_medium'
    );
  });

  test('Hard: XOR from NAND only', async ({ page, baseURL }) => {
    // Classic 4-NAND XOR:
    // gate_0: NAND(A,B) → X
    // gate_1: NAND(A,X) → Y
    // gate_2: NAND(B,X) → Z
    // gate_3: NAND(Y,Z) → Out
    await solvePuzzle(page, baseURL, 'level_07', 'hard',
      [
        { type: 'nand', x: 300, y: 200 },  // gate_0: NAND(A,B)
        { type: 'nand', x: 450, y: 100 },  // gate_1: NAND(A,X)
        { type: 'nand', x: 450, y: 300 },  // gate_2: NAND(B,X)
        { type: 'nand', x: 600, y: 200 },  // gate_3: NAND(Y,Z)
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 }, // A→NAND0
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 }, // B→NAND0
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 }, // A→NAND1.in0
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 }, // X→NAND1.in1
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 0 }, // B→NAND2.in0
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 1 }, // X→NAND2.in1
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 }, // Y→NAND3.in0
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 1 }, // Z→NAND3.in1
        { from: 'gate_3',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_07_hard'
    );
  });
});
