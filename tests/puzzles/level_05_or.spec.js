// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 05 – OR Gate', () => {
  test('Easy: single OR gate', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_05', 'easy',
      [{ type: 'or', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_05_easy'
    );
  });

  test('Medium: 3-input OR cascade', async ({ page, baseURL }) => {
    // OR(A,B) → OR(result, C)
    await solvePuzzle(page, baseURL, 'level_05', 'medium',
      [
        { type: 'or', x: 350, y: 150 },
        { type: 'or', x: 500, y: 200 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_05_medium'
    );
  });

  test('Hard: majority gate (2-of-3)', async ({ page, baseURL }) => {
    // Majority = (A·B) + (B·C) + (A·C)
    // gate_0: AND(A,B), gate_1: AND(B,C), gate_2: AND(A,C)
    // gate_3: OR(gate_0, gate_1), gate_4: OR(gate_3, gate_2)
    await solvePuzzle(page, baseURL, 'level_05', 'hard',
      [
        { type: 'and', x: 300, y: 100 },  // gate_0: A·B
        { type: 'and', x: 300, y: 250 },  // gate_1: B·C
        { type: 'and', x: 300, y: 400 },  // gate_2: A·C
        { type: 'or',  x: 500, y: 175 },  // gate_3: OR(AB, BC)
        { type: 'or',  x: 600, y: 250 },  // gate_4: OR(gate_3, AC)
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 }, // A→AND0.in0
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 }, // B→AND0.in1
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 }, // B→AND1.in0
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 }, // C→AND1.in1
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 }, // A→AND2.in0
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 1 }, // C→AND2.in1
        { from: 'gate_0', fromPin: 0, to: 'gate_3', toPin: 0 },  // AB→OR.in0
        { from: 'gate_1', fromPin: 0, to: 'gate_3', toPin: 1 },  // BC→OR.in1
        { from: 'gate_3', fromPin: 0, to: 'gate_4', toPin: 0 },  // (AB+BC)→OR.in0
        { from: 'gate_2', fromPin: 0, to: 'gate_4', toPin: 1 },  // AC→OR.in1
        { from: 'gate_4', fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_05_hard'
    );
  });

  test('Expert: hazard-free consensus logic', async ({ page, baseURL }) => {
    // 3 inputs (A,B,C), 4 outputs: AB, ĀC, BC, F=AB+ĀC+BC
    await solvePuzzle(page, baseURL, 'level_05', 'expert',
      [
        { type: 'not', x: 250, y: 200 },  // gate_0: NOT(A)
        { type: 'and', x: 400, y: 80 },   // gate_1: AND(A,B) → AB
        { type: 'and', x: 400, y: 200 },  // gate_2: AND(NOT_A,C) → ĀC
        { type: 'and', x: 400, y: 350 },  // gate_3: AND(B,C) → BC
        { type: 'or',  x: 550, y: 140 },  // gate_4: OR(AB, ĀC)
        { type: 'or',  x: 650, y: 250 },  // gate_5: OR(gate_4, BC) → F
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // A
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },  // B
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },  // NOT_A
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 1 },  // C
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 0 },  // B
        { from: 'input_2', fromPin: 0, to: 'gate_3', toPin: 1 },  // C
        { from: 'gate_1',  fromPin: 0, to: 'gate_4', toPin: 0 },  // AB
        { from: 'gate_2',  fromPin: 0, to: 'gate_4', toPin: 1 },  // ĀC
        { from: 'gate_4',  fromPin: 0, to: 'gate_5', toPin: 0 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_5', toPin: 1 },  // BC
        { from: 'gate_1',  fromPin: 0, to: 'output_0', toPin: 0 }, // AB
        { from: 'gate_2',  fromPin: 0, to: 'output_1', toPin: 0 }, // ĀC
        { from: 'gate_3',  fromPin: 0, to: 'output_2', toPin: 0 }, // BC
        { from: 'gate_5',  fromPin: 0, to: 'output_3', toPin: 0 }, // F
      ],
      'level_05_expert'
    );
  });
});
