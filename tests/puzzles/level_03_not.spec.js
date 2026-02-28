// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 03 – The Inverter (NOT)', () => {
  test('Easy: NOT gate', async ({ page, baseURL }) => {
    // 1 input → NOT → 1 output
    await solvePuzzle(page, baseURL, 'level_03', 'easy',
      [{ type: 'not', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_03_easy'
    );
  });

  test('Medium: double negation', async ({ page, baseURL }) => {
    // NOT(NOT(A)) = A. Two NOT gates in series.
    await solvePuzzle(page, baseURL, 'level_03', 'medium',
      [
        { type: 'not', x: 350, y: 150 },
        { type: 'not', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_03_medium'
    );
  });

  test('Hard: controlled inverter', async ({ page, baseURL }) => {
    // 2 inputs (A, Enable), 1 output
    // Output = NOT(A) AND Enable = NOT(A) · EN
    // Solution: NOT gate on A, then transistor(control=EN, supply=NOT_A)
    await solvePuzzle(page, baseURL, 'level_03', 'hard',
      [
        { type: 'not', x: 300, y: 100 },
        { type: 'transistor', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },     // A → NOT
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },     // EN → transistor.control
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 1 },      // NOT_A → transistor.supply
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_03_hard'
    );
  });

  test('Expert: dual inhibit gate', async ({ page, baseURL }) => {
    // 2 inputs (A,B), 2 outputs: Out0=A·B̄, Out1=B·Ā
    // 2 NOT + 2 transistor gates
    await solvePuzzle(page, baseURL, 'level_03', 'expert',
      [
        { type: 'not',       x: 300, y: 100 },  // gate_0: NOT(B)
        { type: 'not',       x: 300, y: 300 },  // gate_1: NOT(A)
        { type: 'transistor', x: 450, y: 100 },  // gate_2: T(ctrl=A, data=NOT_B) → A·B̄
        { type: 'transistor', x: 450, y: 300 },  // gate_3: T(ctrl=B, data=NOT_A) → B·Ā
      ],
      [
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },  // B→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // A→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // A→ctrl
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 1 },  // NOT_B→data
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 0 },  // B→ctrl
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 1 },  // NOT_A→data
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 }, // A·B̄
        { from: 'gate_3',  fromPin: 0, to: 'output_1', toPin: 0 }, // B·Ā
      ],
      'level_03_expert'
    );
  });
});
