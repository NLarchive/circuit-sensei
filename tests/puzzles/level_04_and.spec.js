// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 04 – AND Gate', () => {
  test('Easy: single AND gate', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_04', 'easy',
      [{ type: 'and', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_04_easy'
    );
  });

  test('Medium: 3-input AND cascade', async ({ page, baseURL }) => {
    // AND(A,B) → AND(result, C)
    await solvePuzzle(page, baseURL, 'level_04', 'medium',
      [
        { type: 'and', x: 350, y: 150 },
        { type: 'and', x: 500, y: 200 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_04_medium'
    );
  });

  test('Hard: build NAND gate', async ({ page, baseURL }) => {
    // NAND = NOT(AND(A,B))
    await solvePuzzle(page, baseURL, 'level_04', 'hard',
      [
        { type: 'and', x: 350, y: 150 },
        { type: 'not', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_04_hard'
    );
  });
});
