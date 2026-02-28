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

  test('Expert: material implication gate', async ({ page, baseURL }) => {
    // A→B = NOT(A AND NOT(B)). 2 inputs, 1 output.
    await solvePuzzle(page, baseURL, 'level_04', 'expert',
      [
        { type: 'not', x: 300, y: 150 },  // gate_0: NOT(B)
        { type: 'and', x: 400, y: 200 },  // gate_1: AND(A, NOT_B)
        { type: 'not', x: 550, y: 200 },  // gate_2: NOT(AND) → A→B
      ],
      [
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },  // B→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // A
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 },  // NOT_B
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 0 },  // AND→NOT
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 }, // A→B
      ],
      'level_04_expert'
    );
  });
});
