// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 09 – De Morgan Laws', () => {
  test('Easy: De Morgan\'s theorem (OR via inverted NAND)', async ({ page, baseURL }) => {
    // Output = A OR B. Hint: NAND(NOT A, NOT B) = A OR B
    // gate_0: NOT(A), gate_1: NOT(B), gate_2: NAND(NOT_A, NOT_B)
    await solvePuzzle(page, baseURL, 'level_09', 'easy',
      [
        { type: 'not',  x: 300, y: 100 },  // gate_0: NOT(A)
        { type: 'not',  x: 300, y: 250 },  // gate_1: NOT(B)
        { type: 'nand', x: 500, y: 150 },  // gate_2: NAND(NOT_A, NOT_B) = OR
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_09_easy'
    );
  });

  test('Medium: NOR to AND (NOR gates only)', async ({ page, baseURL }) => {
    // AND from NOR: NOR(NOR(A,A), NOR(B,B))
    // gate_0: NOR(A,A) = NOT(A), gate_1: NOR(B,B) = NOT(B), gate_2: NOR(NOT_A, NOT_B) = AND
    await solvePuzzle(page, baseURL, 'level_09', 'medium',
      [
        { type: 'nor', x: 300, y: 100 },
        { type: 'nor', x: 300, y: 250 },
        { type: 'nor', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_09_medium'
    );
  });

  test('Hard: 3-variable De Morgan (NAND equivalent)', async ({ page, baseURL }) => {
    // NOT(A·B·C) = A'+B'+C'. Using NOT and OR only.
    // gate_0: NOT(A), gate_1: NOT(B), gate_2: NOT(C)
    // gate_3: OR(NOT_A, NOT_B), gate_4: OR(gate_3, NOT_C)
    await solvePuzzle(page, baseURL, 'level_09', 'hard',
      [
        { type: 'not', x: 250, y: 100 },
        { type: 'not', x: 250, y: 250 },
        { type: 'not', x: 250, y: 400 },
        { type: 'or',  x: 450, y: 150 },
        { type: 'or',  x: 600, y: 250 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_4', toPin: 1 },
        { from: 'gate_4',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_09_hard'
    );
  });
});
