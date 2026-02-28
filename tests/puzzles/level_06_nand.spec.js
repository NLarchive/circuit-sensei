// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 06 – NAND: The Universal', () => {
  test('Easy: single NAND gate', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_06', 'easy',
      [{ type: 'nand', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_06_easy'
    );
  });

  test('Medium: NOR (NOT + OR)', async ({ page, baseURL }) => {
    // NOR = NOT(A OR B)
    await solvePuzzle(page, baseURL, 'level_06', 'medium',
      [
        { type: 'or',  x: 350, y: 150 },
        { type: 'not', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_06_medium'
    );
  });

  test('Hard: NAND universality (NOT, AND, OR from NAND only)', async ({ page, baseURL }) => {
    // 3 outputs: [NOT_A, A_AND_B, A_OR_B]
    // gate_0: NAND(A,A) = NOT_A           → output_0
    // gate_1: NAND(A,B) = X
    // gate_2: NAND(X,X) = NOT(X) = AND    → output_1
    // gate_3: NAND(B,B) = NOT_B
    // gate_4: NAND(NOT_A, NOT_B) = OR     → output_2
    await solvePuzzle(page, baseURL, 'level_06', 'hard',
      [
        { type: 'nand', x: 300, y: 100 },  // gate_0: NAND(A,A) = NOT_A
        { type: 'nand', x: 300, y: 250 },  // gate_1: NAND(A,B)
        { type: 'nand', x: 500, y: 250 },  // gate_2: NAND(X,X) = AND
        { type: 'nand', x: 300, y: 400 },  // gate_3: NAND(B,B) = NOT_B
        { type: 'nand', x: 500, y: 400 },  // gate_4: NAND(NOT_A, NOT_B) = OR
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 }, // A
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 }, // A (tied)
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 }, // A
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 }, // B
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 0 }, // X
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 }, // X (tied)
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 0 }, // B
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 1 }, // B (tied)
        { from: 'gate_0',  fromPin: 0, to: 'gate_4', toPin: 0 }, // NOT_A
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 1 }, // NOT_B
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 }, // NOT_A
        { from: 'gate_2',  fromPin: 0, to: 'output_1', toPin: 0 }, // AND
        { from: 'gate_4',  fromPin: 0, to: 'output_2', toPin: 0 }, // OR
      ],
      'level_06_hard'
    );
  });
});
