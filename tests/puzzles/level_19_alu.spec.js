// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 19 – ALU & Comparator', () => {
  test('Easy: simple ALU (add/sub)', async ({ page, baseURL }) => {
    // 3 inputs (A, B, Op), 2 outputs (Result, Carry)
    // Op=0: ADD (A+B using full adder with Cin=0)
    // Op=1: SUB (A + NOT(B) + 1, i.e., full adder with B XOR Op & Cin=Op)
    // Implementation: B_effective = B XOR Op, Cin = Op
    // fullAdder(A, B_eff, Op) → [Sum, Carry]
    // gate_0: XOR(B, Op) → B_effective
    // gate_1: fullAdder(A, B_eff, Op) → [Result, Carry]
    await solvePuzzle(page, baseURL, 'level_19', 'easy',
      [
        { type: 'xor',       x: 300, y: 200 },  // gate_0: XOR(B, Op)
        { type: 'fullAdder', x: 500, y: 200 },   // gate_1: FA(A, B_eff, Op)
      ],
      [
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },  // B
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 1 },  // Op
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },  // A
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 1 },  // B_eff
        { from: 'input_2', fromPin: 0, to: 'gate_1', toPin: 2 },  // Cin = Op
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 }, // Result (Sum)
        { from: 'gate_1', fromPin: 1, to: 'output_1', toPin: 0 }, // Carry
      ],
      'level_19_easy'
    );
  });

  test('Medium: 1-bit ALU (ADD or AND)', async ({ page, baseURL }) => {
    // 3 inputs (A, B, Op), 2 outputs (Result, Carry)
    // Op=0: ADD (fullAdder, Cin=0), Op=1: AND(A,B), Carry=0
    // Implementation: compute both, use MUX to select by Op
    // gate_0: fullAdder(A, B, 0) → [Sum, Carry_add]
    // gate_1: AND(A, B) → AND_result
    // gate_2: mux2to1(Sum, AND_result, Op) → Result
    // gate_3: mux2to1(Carry_add, 0, Op) → Carry (when Op=1, carry=0)
    // But fullAdder 3rd input not connected → defaults to 0 (Cin=0) ✓
    await solvePuzzle(page, baseURL, 'level_19', 'medium',
      [
        { type: 'fullAdder', x: 300, y: 100 },  // gate_0: FA(A,B,0)
        { type: 'and',       x: 300, y: 300 },  // gate_1: AND(A,B)
        { type: 'mux2to1',   x: 500, y: 100 },  // gate_2: MUX→Result
        { type: 'mux2to1',   x: 500, y: 300 },  // gate_3: MUX→Carry
      ],
      [
        // Full adder
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // B
        // Pin 2 (Cin) left unconnected → 0
        // AND
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },
        // MUX for Result: data0=Sum(ADD), data1=AND_result, sel=Op
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },  // Sum
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },  // AND
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 2 },  // Op
        // MUX for Carry: data0=Carry(ADD), data1=0 (unconnected), sel=Op
        { from: 'gate_0',  fromPin: 1, to: 'gate_3', toPin: 0 },  // Carry
        // Pin 1 (data1) unconnected → 0 when Op=1
        { from: 'input_2', fromPin: 0, to: 'gate_3', toPin: 2 },  // Op
        // Outputs
        { from: 'gate_2', fromPin: 0, to: 'output_0', toPin: 0 }, // Result
        { from: 'gate_3', fromPin: 0, to: 'output_1', toPin: 0 }, // Carry
      ],
      'level_19_medium'
    );
  });

  test('Hard: magnitude comparator', async ({ page, baseURL }) => {
    // 4 inputs (A1, A0, B1, B0), 3 outputs (GT, EQ, LT)
    // EQ = (A1 XNOR B1) AND (A0 XNOR B0) = NOT(A1⊕B1) · NOT(A0⊕B0)
    // GT = A1·NOT(B1) + EQ_high · A0 · NOT(B0)
    //    where EQ_high = NOT(A1⊕B1)
    // LT = NOT(GT) AND NOT(EQ) -- or directly: NOT(A1)·B1 + EQ_high·NOT(A0)·B0
    // Simpler with available gates:
    // gate_0: XOR(A1,B1), gate_1: XOR(A0,B0)
    // gate_2: NOT(gate_0) = XNOR(A1,B1) = EQ_high
    // gate_3: NOT(gate_1) = XNOR(A0,B0) = EQ_low
    // gate_4: AND(gate_2, gate_3) → EQ
    // gate_5: NOT(B1), gate_6: AND(A1, NOT_B1) → GT_high
    // gate_7: NOT(B0), gate_8: AND(A0, NOT_B0) → GT_low_cond
    // gate_9: AND(gate_2, gate_8) → GT_low (only when high bits equal)
    // gate_10: OR(GT_high, GT_low) → GT
    // gate_11: NOR(GT, EQ) → LT  (or NOT + AND)
    // That's 12 gates which matches maxGates
    await solvePuzzle(page, baseURL, 'level_19', 'hard',
      [
        { type: 'xor', x: 250, y: 80 },   // gate_0: A1⊕B1
        { type: 'xor', x: 250, y: 200 },  // gate_1: A0⊕B0
        { type: 'not', x: 350, y: 80 },   // gate_2: NOT(A1⊕B1) = EQ_high
        { type: 'not', x: 350, y: 200 },  // gate_3: NOT(A0⊕B0) = EQ_low
        { type: 'and', x: 500, y: 200 },  // gate_4: EQ = EQ_high · EQ_low
        { type: 'not', x: 250, y: 350 },  // gate_5: NOT(B1)
        { type: 'and', x: 400, y: 350 },  // gate_6: A1 · NOT(B1) → GT_high
        { type: 'not', x: 250, y: 450 },  // gate_7: NOT(B0)
        { type: 'and', x: 400, y: 450 },  // gate_8: A0 · NOT(B0)
        { type: 'and', x: 500, y: 450 },  // gate_9: EQ_high · gate_8 → GT_low
        { type: 'or',  x: 600, y: 80 },   // gate_10: GT = GT_high + GT_low
        { type: 'nor', x: 600, y: 400 },  // gate_11: LT = NOR(GT, EQ)
      ],
      [
        // XOR for equality bits
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A1
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 1 },  // B1
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },  // A0
        { from: 'input_3', fromPin: 0, to: 'gate_1', toPin: 1 },  // B0
        // XNOR (NOT XOR)
        { from: 'gate_0', fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'gate_3', toPin: 0 },
        // EQ = EQ_high AND EQ_low
        { from: 'gate_2', fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_3', fromPin: 0, to: 'gate_4', toPin: 1 },
        // GT: NOT(B1), A1·NOT(B1)
        { from: 'input_2', fromPin: 0, to: 'gate_5', toPin: 0 },  // B1→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_6', toPin: 0 },  // A1
        { from: 'gate_5',  fromPin: 0, to: 'gate_6', toPin: 1 },  // NOT(B1)
        // NOT(B0), A0·NOT(B0)
        { from: 'input_3', fromPin: 0, to: 'gate_7', toPin: 0 },  // B0→NOT
        { from: 'input_1', fromPin: 0, to: 'gate_8', toPin: 0 },  // A0
        { from: 'gate_7',  fromPin: 0, to: 'gate_8', toPin: 1 },  // NOT(B0)
        // GT_low = EQ_high AND (A0·NOT(B0))
        { from: 'gate_2', fromPin: 0, to: 'gate_9', toPin: 0 },   // EQ_high
        { from: 'gate_8', fromPin: 0, to: 'gate_9', toPin: 1 },
        // GT = GT_high OR GT_low
        { from: 'gate_6',  fromPin: 0, to: 'gate_10', toPin: 0 },
        { from: 'gate_9',  fromPin: 0, to: 'gate_10', toPin: 1 },
        // LT = NOR(GT, EQ) = NOT(GT OR EQ)
        { from: 'gate_10', fromPin: 0, to: 'gate_11', toPin: 0 },
        { from: 'gate_4',  fromPin: 0, to: 'gate_11', toPin: 1 },
        // Outputs
        { from: 'gate_10', fromPin: 0, to: 'output_0', toPin: 0 }, // GT
        { from: 'gate_4',  fromPin: 0, to: 'output_1', toPin: 0 }, // EQ
        { from: 'gate_11', fromPin: 0, to: 'output_2', toPin: 0 }, // LT
      ],
      'level_19_hard'
    );
  });

  test('Expert: signed overflow detector', async ({ page, baseURL }) => {
    // 3 inputs (A_msb,B_msb,S_msb), 1 output (overflow)
    // V = NOT(A⊕B) · (A⊕S)
    await solvePuzzle(page, baseURL, 'level_19', 'expert',
      [
        { type: 'xor', x: 300, y: 100 },  // gate_0: XOR(A,B)
        { type: 'not', x: 400, y: 100 },  // gate_1: NOT(A⊕B) = same sign
        { type: 'xor', x: 300, y: 250 },  // gate_2: XOR(A,S) = result differs
        { type: 'and', x: 500, y: 175 },  // gate_3: AND → overflow
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // A
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // B
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 0 },  // A⊕B→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // A
        { from: 'input_2', fromPin: 0, to: 'gate_2', toPin: 1 },  // S
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },  // NOT(A⊕B)
        { from: 'gate_2',  fromPin: 0, to: 'gate_3', toPin: 1 },  // A⊕S
        { from: 'gate_3',  fromPin: 0, to: 'output_0', toPin: 0 }, // V
      ],
      'level_19_expert'
    );
  });
});
