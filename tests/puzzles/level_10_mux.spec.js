// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 10 – Multiplexer (MUX)', () => {
  test('Easy: 2:1 multiplexer', async ({ page, baseURL }) => {
    // Inputs: [A, B, S]. Y = (A AND NOT S) OR (B AND S)
    // gate_0: NOT(S), gate_1: AND(A, NOT_S), gate_2: AND(B, S), gate_3: OR(gate_1, gate_2)
    await solvePuzzle(page, baseURL, 'level_10', 'easy',
      [
        { type: 'not', x: 300, y: 350 },  // gate_0: NOT(S)
        { type: 'and', x: 450, y: 100 },  // gate_1: AND(A, NOT_S)
        { type: 'and', x: 450, y: 300 },  // gate_2: AND(B, S)
        { type: 'or',  x: 600, y: 200 },  // gate_3: OR
      ],
      [
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 0 },  // S→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // A
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 },  // NOT_S
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 0 },  // B
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 1 },  // S
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_10_easy'
    );
  });

  test('Medium: MUX as universal gate (AND)', async ({ page, baseURL }) => {
    // 2 inputs (A,B). Use a single mux2to1: data0=0(ground), data1=B, sel=A
    // mux2to1 inputs: [a=data0, b=data1, sel]
    // When A=0→output data0=0, when A=1→output data1=B → AND behavior
    // But we need a 0 constant. The trick is: don't connect pin 0 (it defaults to 0).
    // mux2to1(unused/0, B, A) → AND(A,B)
    await solvePuzzle(page, baseURL, 'level_10', 'medium',
      [{ type: 'mux2to1', x: 400, y: 150 }],
      [
        // Pin 0 (data0) left unconnected = 0
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // B→data1
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 2 },  // A→sel
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_10_medium'
    );
  });

  test('Hard: 4:1 MUX from 2:1 MUXes', async ({ page, baseURL }) => {
    // 6 inputs: [D0, D1, D2, D3, S1, S0]
    // gate_0: MUX(D0, D1, S0) — selects D0/D1 based on S0
    // gate_1: MUX(D2, D3, S0) — selects D2/D3 based on S0
    // gate_2: MUX(gate_0, gate_1, S1) — selects between the two results
    await solvePuzzle(page, baseURL, 'level_10', 'hard',
      [
        { type: 'mux2to1', x: 350, y: 100 },  // gate_0: MUX(D0,D1,S0)
        { type: 'mux2to1', x: 350, y: 300 },  // gate_1: MUX(D2,D3,S0)
        { type: 'mux2to1', x: 550, y: 200 },  // gate_2: MUX(g0,g1,S1)
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // D0
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // D1
        { from: 'input_5', fromPin: 0, to: 'gate_0', toPin: 2 },  // S0
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 0 },  // D2
        { from: 'input_3', fromPin: 0, to: 'gate_1', toPin: 1 },  // D3
        { from: 'input_5', fromPin: 0, to: 'gate_1', toPin: 2 },  // S0
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },  // result01
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },  // result23
        { from: 'input_4', fromPin: 0, to: 'gate_2', toPin: 2 },  // S1
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_10_hard'
    );
  });
});
