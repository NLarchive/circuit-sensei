// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 13 – Full Adder & Subtractor', () => {
  test('Easy: full adder', async ({ page, baseURL }) => {
    // Sum  = A ⊕ B ⊕ Cin
    // Cout = (A·B) + (Cin·(A⊕B))
    // gate_0: XOR(A,B), gate_1: XOR(gate_0, Cin) → Sum
    // gate_2: AND(A,B), gate_3: AND(gate_0, Cin), gate_4: OR(gate_2, gate_3) → Cout
    await solvePuzzle(page, baseURL, 'level_13', 'easy',
      [
        { type: 'xor', x: 300, y: 100 },  // gate_0: A⊕B
        { type: 'xor', x: 450, y: 100 },  // gate_1: (A⊕B)⊕Cin → Sum
        { type: 'and', x: 300, y: 300 },  // gate_2: A·B
        { type: 'and', x: 450, y: 300 },  // gate_3: (A⊕B)·Cin
        { type: 'or',  x: 600, y: 300 },  // gate_4: Cout
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 },
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 1 },
        { from: 'gate_1',  fromPin: 0, to: 'output_0', toPin: 0 }, // Sum
        { from: 'gate_4',  fromPin: 0, to: 'output_1', toPin: 0 }, // Cout
      ],
      'level_13_easy'
    );
  });

  test('Medium: full subtractor', async ({ page, baseURL }) => {
    // Diff = A ⊕ B ⊕ Bin
    // Bout = (NOT(A)·B) + (NOT(A)·Bin) + (B·Bin)
    //      = (NOT(A)·(B OR Bin)) + (B·Bin)   ... or simpler:
    //      = ((NOT A) AND (B OR Bin)) OR (B AND Bin)
    // Also: Bout = NOT(A⊕B)·Bin + NOT(A)·B = Bin·NOT(A⊕B) + NOT(A)·B
    // Simplest using 7 gates:
    // gate_0: XOR(A,B), gate_1: XOR(gate_0, Bin) → Diff
    // gate_2: NOT(A), gate_3: AND(gate_2, B), gate_4: AND(gate_2, Bin)
    // gate_5: AND(B, Bin), gate_6: OR(gate_3, OR(gate_4, gate_5))
    // Actually: Bout = NOT(A)·B + Bin·NOT(A⊕B) ... let me use direct formula
    // Bout = (B·Bin) + (NOT(A)·B) + (NOT(A)·Bin)
    //      = B·Bin + NOT(A)·(B+Bin)
    // gate_2: NOT(A), gate_3: OR(B,Bin), gate_4: AND(NOT_A, OR(B,Bin))
    // gate_5: AND(B,Bin), gate_6: OR(gate_4, gate_5)
    await solvePuzzle(page, baseURL, 'level_13', 'medium',
      [
        { type: 'xor', x: 300, y: 100 },  // gate_0: A⊕B
        { type: 'xor', x: 450, y: 100 },  // gate_1: Diff = (A⊕B)⊕Bin
        { type: 'not', x: 250, y: 300 },  // gate_2: NOT(A)
        { type: 'or',  x: 350, y: 350 },  // gate_3: OR(B, Bin)
        { type: 'and', x: 500, y: 300 },  // gate_4: AND(NOT_A, OR(B,Bin))
        { type: 'and', x: 350, y: 480 },  // gate_5: AND(B, Bin)
        { type: 'or',  x: 600, y: 400 },  // gate_6: OR(gate_4, gate_5) → Bout
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 1 },  // Bin
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // NOT(A)
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 0 },  // B
        { from: 'input_2', fromPin: 0, to: 'gate_3', toPin: 1 },  // Bin
        { from: 'gate_2',  fromPin: 0, to: 'gate_4', toPin: 0 },  // NOT_A
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 1 },  // B+Bin
        { from: 'input_1', fromPin: 0, to: 'gate_5', toPin: 0 },  // B
        { from: 'input_2', fromPin: 0, to: 'gate_5', toPin: 1 },  // Bin
        { from: 'gate_4',  fromPin: 0, to: 'gate_6', toPin: 0 },
        { from: 'gate_5',  fromPin: 0, to: 'gate_6', toPin: 1 },
        { from: 'gate_1',  fromPin: 0, to: 'output_0', toPin: 0 }, // Diff
        { from: 'gate_6',  fromPin: 0, to: 'output_1', toPin: 0 }, // Bout
      ],
      'level_13_medium'
    );
  });

  test('Hard: 2-bit ripple carry adder', async ({ page, baseURL }) => {
    // 4 inputs: A1, A0, B1, B0. 3 outputs: Cout, S1, S0
    // Half adder for bit 0: S0=A0⊕B0, C0=A0·B0
    // Full adder for bit 1: S1=A1⊕B1⊕C0, Cout=(A1·B1)+(C0·(A1⊕B1))
    // gate_0: XOR(A0,B0) → S0
    // gate_1: AND(A0,B0) → C0
    // gate_2: XOR(A1,B1)
    // gate_3: XOR(gate_2, C0) → S1
    // gate_4: AND(A1,B1)
    // gate_5: AND(gate_2, C0)
    // gate_6: OR(gate_4, gate_5) → Cout
    // Inputs order: [A1=input_0, A0=input_1, B1=input_2, B0=input_3]
    // Outputs order: [Cout=output_0, S1=output_1, S0=output_2]
    await solvePuzzle(page, baseURL, 'level_13', 'hard',
      [
        { type: 'xor', x: 300, y: 400 },  // gate_0: XOR(A0,B0) → S0
        { type: 'and', x: 300, y: 550 },  // gate_1: AND(A0,B0) → C0
        { type: 'xor', x: 300, y: 100 },  // gate_2: XOR(A1,B1)
        { type: 'xor', x: 480, y: 200 },  // gate_3: XOR(gate_2,C0) → S1
        { type: 'and', x: 300, y: 250 },  // gate_4: AND(A1,B1)
        { type: 'and', x: 480, y: 350 },  // gate_5: AND(gate_2,C0)
        { type: 'or',  x: 600, y: 100 },  // gate_6: OR(gate_4,gate_5) → Cout
      ],
      [
        // Half adder for bit 0
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },  // A0
        { from: 'input_3', fromPin: 0, to: 'gate_0', toPin: 1 },  // B0
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },  // A0
        { from: 'input_3', fromPin: 0, to: 'gate_1', toPin: 1 },  // B0
        // Full adder for bit 1
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // A1
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 1 },  // B1
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 0 },  // A1⊕B1
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 1 },  // C0
        { from: 'input_0', fromPin: 0, to: 'gate_4', toPin: 0 },  // A1
        { from: 'input_2', fromPin: 0, to: 'gate_4', toPin: 1 },  // B1
        { from: 'gate_2',  fromPin: 0, to: 'gate_5', toPin: 0 },  // A1⊕B1
        { from: 'gate_1',  fromPin: 0, to: 'gate_5', toPin: 1 },  // C0
        { from: 'gate_4',  fromPin: 0, to: 'gate_6', toPin: 0 },
        { from: 'gate_5',  fromPin: 0, to: 'gate_6', toPin: 1 },
        // Outputs
        { from: 'gate_6',  fromPin: 0, to: 'output_0', toPin: 0 }, // Cout
        { from: 'gate_3',  fromPin: 0, to: 'output_1', toPin: 0 }, // S1
        { from: 'gate_0',  fromPin: 0, to: 'output_2', toPin: 0 }, // S0
      ],
      'level_13_hard'
    );
  });
});
