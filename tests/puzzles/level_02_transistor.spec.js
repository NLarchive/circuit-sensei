// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 02 – The Transistor', () => {
  test('Easy: transistor as switch', async ({ page, baseURL }) => {
    // 2 inputs, 1 output. Transistor: in0=control, in1=supply → out = control AND supply
    // Input0=A (control), Input1=B (supply)
    await solvePuzzle(page, baseURL, 'level_02', 'easy',
      [{ type: 'transistor', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 }, // A → control
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 }, // B → supply
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_02_easy'
    );
  });

  test('Medium: controlled switch', async ({ page, baseURL }) => {
    // 3-input AND using two transistor switches in series-equivalent control.
    await solvePuzzle(page, baseURL, 'level_02', 'medium',
      [
        { type: 'transistor', x: 350, y: 150 },
        { type: 'transistor', x: 500, y: 150 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 }, // A -> T0.control
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 }, // B -> T0.supply
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 1 },  // gated(A,B) -> T1.supply
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 0 }, // C -> T1.control
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_02_medium'
    );
  });

  test('Hard: gated signal pair', async ({ page, baseURL }) => {
    // 3 inputs (A,B,C), 2 outputs. Out1 = A·C, Out2 = B·C
    // Transistor1: control=C(input_2), supply=A(input_0) → output_0
    // Transistor2: control=C(input_2), supply=B(input_1) → output_1
    await solvePuzzle(page, baseURL, 'level_02', 'hard',
      [
        { type: 'transistor', x: 400, y: 100 },
        { type: 'transistor', x: 400, y: 300 },
      ],
      [
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 0 }, // C → T1.control
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 }, // A → T1.supply
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 0 }, // C → T2.control
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 }, // B → T2.supply
        { from: 'gate_1', fromPin: 0, to: 'output_1', toPin: 0 },
      ],
      'level_02_hard'
    );
  });

  test('Expert: 4-input AND chain', async ({ page, baseURL }) => {
    // 4 inputs (A,B,C,D), 1 output. Chain 3 transistors: T(A,B)→T(C,AB)→T(D,ABC)
    await solvePuzzle(page, baseURL, 'level_02', 'expert',
      [
        { type: 'transistor', x: 300, y: 150 },  // gate_0: T(ctrl=A, data=B) → A·B
        { type: 'transistor', x: 450, y: 150 },  // gate_1: T(ctrl=C, data=AB)
        { type: 'transistor', x: 600, y: 150 },  // gate_2: T(ctrl=D, data=ABC)
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A→ctrl
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // B→data
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 0 },  // C→ctrl
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 },  // AB→data
        { from: 'input_3', fromPin: 0, to: 'gate_2', toPin: 0 },  // D→ctrl
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },  // ABC→data
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 }, // ABCD
      ],
      'level_02_expert'
    );
  });
});
