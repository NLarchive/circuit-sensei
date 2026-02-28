// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 15 – D Flip-Flop', () => {
  test('Easy: D flip-flop', async ({ page, baseURL }) => {
    // 2 inputs (D, CLK), 2 outputs (Q, Q̅). Single dFlipFlop component.
    await solvePuzzle(page, baseURL, 'level_15', 'easy',
      [{ type: 'dFlipFlop', x: 400, y: 150 }],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // D
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 }, // Q
        { from: 'gate_0', fromPin: 1, to: 'output_1', toPin: 0 }, // Q̅
      ],
      'level_15_easy'
    );
  });

  test('Medium: D flip-flop with enable', async ({ page, baseURL }) => {
    // 3 inputs (D, CLK, EN), 1 output (Q)
    // Use MUX: when EN=1 pass D, when EN=0 feed back Q → D-FF
    // gate_0: mux2to1(Q_feedback, D, EN) → D-FF input
    // gate_1: dFlipFlop(mux_out, CLK)
    // But we need Q feedback from gate_1 to gate_0. Circuit handles feedback.
    await solvePuzzle(page, baseURL, 'level_15', 'medium',
      [
        { type: 'mux2to1',   x: 350, y: 150 },  // gate_0: MUX(Q, D, EN)
        { type: 'dFlipFlop', x: 550, y: 150 },   // gate_1: D-FF
      ],
      [
        // MUX: data0=Q (feedback), data1=D, sel=EN
        { from: 'gate_1',  fromPin: 0, to: 'gate_0', toPin: 0 },  // Q→MUX.data0 (feedback)
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // D→MUX.data1
        { from: 'input_2', fromPin: 0, to: 'gate_0', toPin: 2 },  // EN→MUX.sel
        // D-FF
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 0 },  // MUX.out→D-FF.D
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 1 },  // CLK
        // Output
        { from: 'gate_1',  fromPin: 0, to: 'output_0', toPin: 0 }, // Q
      ],
      'level_15_medium'
    );
  });

  test('Hard: rising edge detector', async ({ page, baseURL }) => {
    // 2 inputs (In, CLK), 1 output
    // Output = In AND NOT(Q), where Q is In delayed by D-FF
    // gate_0: dFlipFlop(In, CLK) → Q (delayed In)
    // gate_1: NOT(Q)
    // gate_2: AND(In, NOT_Q) → output (1 only when In rises)
    await solvePuzzle(page, baseURL, 'level_15', 'hard',
      [
        { type: 'dFlipFlop', x: 350, y: 150 },  // gate_0: D-FF
        { type: 'not',       x: 500, y: 200 },   // gate_1: NOT(Q)
        { type: 'and',       x: 600, y: 150 },   // gate_2: AND(In, NOT_Q)
      ],
      [
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },  // In→D
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        { from: 'gate_0',  fromPin: 0, to: 'gate_1', toPin: 0 },  // Q→NOT
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 0 },  // In
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },  // NOT_Q
        { from: 'gate_2',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_15_hard'
    );
  });

  test('Expert: 2-bit shift register (SIPO)', async ({ page, baseURL }) => {
    // 2 inputs (CLK,Din), 2 outputs (Q₁,Q₀). Two DFFs in series.
    // Gate order: DFF₂ before DFF₁ so DFF₂ captures old Q₀
    await solvePuzzle(page, baseURL, 'level_15', 'expert',
      [
        { type: 'dFlipFlop', x: 550, y: 100 },  // gate_0: DFF₂ (D=Q₀, CLK) → Q₁
        { type: 'dFlipFlop', x: 400, y: 100 },  // gate_1: DFF₁ (D=Din, CLK) → Q₀
      ],
      [
        { from: 'gate_1',  fromPin: 0, to: 'gate_0', toPin: 0 },  // Q₀→DFF₂.D
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },  // Din→DFF₁.D
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },  // CLK
        { from: 'gate_0',  fromPin: 0, to: 'output_0', toPin: 0 }, // Q₁
        { from: 'gate_1',  fromPin: 0, to: 'output_1', toPin: 0 }, // Q₀
      ],
      'level_15_expert'
    );
  });
});
