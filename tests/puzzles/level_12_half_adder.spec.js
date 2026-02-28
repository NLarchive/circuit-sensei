// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 12 – Half Adder & Subtractor', () => {
  test('Easy: half adder', async ({ page, baseURL }) => {
    // Sum = A XOR B → output_0, Carry = A AND B → output_1
    await solvePuzzle(page, baseURL, 'level_12', 'easy',
      [
        { type: 'xor', x: 400, y: 100 },  // gate_0: Sum
        { type: 'and', x: 400, y: 300 },  // gate_1: Carry
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'output_1', toPin: 0 },
      ],
      'level_12_easy'
    );
  });

  test('Medium: half subtractor', async ({ page, baseURL }) => {
    // Diff = A XOR B → output_0, Borrow = NOT(A) AND B → output_1
    await solvePuzzle(page, baseURL, 'level_12', 'medium',
      [
        { type: 'xor', x: 400, y: 100 },  // gate_0: Diff
        { type: 'not', x: 300, y: 300 },  // gate_1: NOT(A)
        { type: 'and', x: 450, y: 300 },  // gate_2: Borrow
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // A→NOT
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 0 },  // NOT_A
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },  // B
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'output_1', toPin: 0 },
      ],
      'level_12_medium'
    );
  });

  test('Hard: Apollo NOR half adder', async ({ page, baseURL }) => {
    // Half adder from NOR only. Sum=A XOR B, Carry=A AND B.
    // NOR-only construction (6 gates):
    //   n0 = NOR(A,B)
    //   n1 = NOR(A,n0)
    //   n2 = NOR(B,n0)
    //   n3 = NOR(n1,n2)   -> XNOR
    //   n4 = NOR(n3,n3)   -> XOR (Sum)
    //   n5 = NOR(n4,n0)   -> AND (Carry)
    await solvePuzzle(page, baseURL, 'level_12', 'hard',
      [
        { type: 'nor', x: 300, y: 150 },
        { type: 'nor', x: 420, y: 80 },
        { type: 'nor', x: 420, y: 220 },
        { type: 'nor', x: 550, y: 150 },
        { type: 'nor', x: 650, y: 150 },
        { type: 'nor', x: 550, y: 320 },
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 1 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 1 },
        { from: 'gate_4',  fromPin: 0, to: 'gate_5', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_5', toPin: 1 },
        { from: 'gate_4',  fromPin: 0, to: 'output_0', toPin: 0 }, // Sum
        { from: 'gate_5',  fromPin: 0, to: 'output_1', toPin: 0 }, // Carry
      ],
      'level_12_hard'
    );
  });

  test('Expert: XOR from NOR only', async ({ page, baseURL }) => {
    // 2 inputs (A,B), 1 output. 5 NOR gates: Apollo AGC construction.
    // A'=NOR(A,A), B'=NOR(B,B), R=NOR(A,B), S=NOR(A',B')=AB, XOR=NOR(R,S)
    await solvePuzzle(page, baseURL, 'level_12', 'expert',
      [
        { type: 'nor', x: 300, y: 80 },   // gate_0: NOR(A,A) = A'
        { type: 'nor', x: 300, y: 220 },  // gate_1: NOR(B,B) = B'
        { type: 'nor', x: 300, y: 350 },  // gate_2: NOR(A,B) = R
        { type: 'nor', x: 450, y: 150 },  // gate_3: NOR(A',B') = AB
        { type: 'nor', x: 550, y: 250 },  // gate_4: NOR(R,S) = XOR
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // A'
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },  // B'
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // A
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },  // B
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 0 },  // A'
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 1 },  // B'
        { from: 'gate_2',  fromPin: 0, to: 'gate_4', toPin: 0 },  // R
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 1 },  // S
        { from: 'gate_4',  fromPin: 0, to: 'output_0', toPin: 0 }, // XOR
      ],
      'level_12_expert'
    );
  });
});
