// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level Boss – Microprocessor Challenge', () => {
  /**
   * Boss Easy – Microprocessor Core (Sequential)
   * Inputs: CLK(0), Reset(1)  —  Output: 1 output
   *
   * Sequence:
   *   [0,1]→[0]  Reset
   *   [0,0]→[0]  Ready
   *   [1,0]→[0]  Clock 1: Fetch
   *   [0,0]→[0]  Hold
   *   [1,0]→[1]  Clock 2: Execute & Writeback
   *
   * Strategy: 3-DFF pipeline with inverted clock on middle DFF.
   *   DFF1 captures NOT(Reset) on CLK rising edge.
   *   DFF2 captures DFF1.Q on NOT(CLK) rising edge (= CLK falling edge).
   *   DFF3 captures DFF2.Q on CLK rising edge.
   * This creates a 2-clock-edge delay from input to output.
   */
  test('Easy: microprocessor core', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_boss', 'easy',
      [
        { type: 'not',        x: 250, y: 300 },  // gate_0: NOT(Reset)
        { type: 'not',        x: 250, y: 150 },  // gate_1: NOT(CLK) → inverted clock
        { type: 'dFlipFlop',  x: 400, y: 150 },  // gate_2: DFF1 (D=NOT_Reset, CLK=CLK)
        { type: 'dFlipFlop',  x: 500, y: 150 },  // gate_3: DFF2 (D=Q1, CLK=NOT_CLK)
        { type: 'dFlipFlop',  x: 600, y: 150 },  // gate_4: DFF3 (D=Q2, CLK=CLK)
      ],
      [
        // NOT gates
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },   // Reset → NOT
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },   // CLK → NOT

        // DFF1: D = NOT(Reset), CLK = CLK
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },   // NOT_Reset → D
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 1 },   // CLK → CLK

        // DFF2: D = Q1, CLK = NOT(CLK)
        { from: 'gate_2', fromPin: 0, to: 'gate_3', toPin: 0 },    // Q1 → D
        { from: 'gate_1', fromPin: 0, to: 'gate_3', toPin: 1 },    // NOT_CLK → CLK

        // DFF3: D = Q2, CLK = CLK
        { from: 'gate_3', fromPin: 0, to: 'gate_4', toPin: 0 },    // Q2 → D
        { from: 'input_0', fromPin: 0, to: 'gate_4', toPin: 1 },   // CLK → CLK

        // Output
        { from: 'gate_4', fromPin: 0, to: 'output_0', toPin: 0 },  // Q3 → Output
      ],
      'level_boss_easy'
    );
  });

  /**
   * Boss Medium – Instruction Decoder (Combinational)
   * Inputs: Op1(0), Op0(1)
   * Outputs: ALU_Sub(0), RegWrite(1), MemRead(2), MemWrite(3)
   *
   * Truth table:
   *   [0,0] → [0,1,0,0]  ADD
   *   [0,1] → [1,1,0,0]  SUB
   *   [1,0] → [0,1,1,0]  LOAD
   *   [1,1] → [0,0,0,1]  STORE
   *
   * Boolean expressions:
   *   ALU_Sub  = NOT(Op1) · Op0
   *   RegWrite = NAND(Op1, Op0)
   *   MemRead  = Op1 · NOT(Op0)
   *   MemWrite = Op1 · Op0
   */
  test('Medium: instruction decoder', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_boss', 'medium',
      [
        { type: 'not',  x: 250, y: 100 },  // gate_0: NOT(Op1)
        { type: 'not',  x: 250, y: 300 },  // gate_1: NOT(Op0)
        { type: 'and',  x: 400, y: 100 },  // gate_2: AND(NOT_Op1, Op0) → ALU_Sub
        { type: 'nand', x: 400, y: 250 },  // gate_3: NAND(Op1, Op0)   → RegWrite
        { type: 'and',  x: 400, y: 400 },  // gate_4: AND(Op1, NOT_Op0) → MemRead
        { type: 'and',  x: 400, y: 550 },  // gate_5: AND(Op1, Op0)     → MemWrite
      ],
      [
        // NOT gates
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 0 },   // Op1 → NOT
        { from: 'input_1', fromPin: 0, to: 'gate_1', toPin: 0 },   // Op0 → NOT

        // ALU_Sub = NOT(Op1) AND Op0
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 1 },

        // RegWrite = NAND(Op1, Op0)
        { from: 'input_0', fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_3', toPin: 1 },

        // MemRead = Op1 AND NOT(Op0)
        { from: 'input_0', fromPin: 0, to: 'gate_4', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_4', toPin: 1 },

        // MemWrite = Op1 AND Op0
        { from: 'input_0', fromPin: 0, to: 'gate_5', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_5', toPin: 1 },

        // Outputs
        { from: 'gate_2', fromPin: 0, to: 'output_0', toPin: 0 }, // ALU_Sub
        { from: 'gate_3', fromPin: 0, to: 'output_1', toPin: 0 }, // RegWrite
        { from: 'gate_4', fromPin: 0, to: 'output_2', toPin: 0 }, // MemRead
        { from: 'gate_5', fromPin: 0, to: 'output_3', toPin: 0 }, // MemWrite
      ],
      'level_boss_medium'
    );
  });

  /**
   * Boss Hard – 2-Stage Pipeline (Sequential)
   * Inputs: CLK(0), Reset(1)  —  Outputs: Execute(0), Fetch(1)
   *
   * Sequence:
   *   [0,1] → [0,0]  Reset
   *   [0,0] → [0,0]  Ready
   *   [1,0] → [0,1]  CLK1: Fetch I1
   *   [0,0] → [0,1]  Hold: I1 in IR
   *   [1,0] → [1,0]  CLK2: Execute I1, Fetch I2
   *   [0,0] → [1,0]  Hold: I2 in IR
   *   [1,0] → [1,1]  CLK3: Execute I2, Fetch I3
   *
   * Execute path: 3-DFF pipeline (same as boss easy)
   *   DFF1(NOT_Reset, CLK) → DFF2(Q1, NOT_CLK) → DFF3(Q2, CLK)
   *   Execute = Q3
   *
   * Fetch path: Toggle DFF with reset control
   *   NOT_Q_toggle → AND(NOT_Q, NOT_Reset) → DFF_toggle(D=AND, CLK=CLK)
   *   Fetch = Q_toggle
   */
  test('Hard: 2-stage pipeline', async ({ page, baseURL }) => {
    await solvePuzzle(page, baseURL, 'level_boss', 'hard',
      [
        // Execute path (gates 0-4)
        { type: 'not',        x: 220, y: 300 },  // gate_0: NOT(Reset) → NOT_Reset (shared)
        { type: 'not',        x: 220, y: 100 },  // gate_1: NOT(CLK)   → NOT_CLK
        { type: 'dFlipFlop',  x: 370, y: 100 },  // gate_2: DFF1 (D=NOT_Reset, CLK=CLK)
        { type: 'dFlipFlop',  x: 470, y: 100 },  // gate_3: DFF2 (D=Q1, CLK=NOT_CLK)
        { type: 'dFlipFlop',  x: 570, y: 100 },  // gate_4: DFF3 (D=Q2, CLK=CLK) → Execute

        // Fetch path (gates 5-7)
        { type: 'not',        x: 350, y: 400 },  // gate_5: NOT(Q_toggle)
        { type: 'and',        x: 450, y: 400 },  // gate_6: AND(NOT_Q, NOT_Reset)
        { type: 'dFlipFlop',  x: 570, y: 400 },  // gate_7: DFF_toggle (D=AND, CLK=CLK) → Fetch
      ],
      [
        // ─── Execute path wiring ───
        // NOT gates
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },   // Reset → NOT_Reset
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 0 },   // CLK → NOT_CLK

        // DFF1
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },   // NOT_Reset → D
        { from: 'input_0', fromPin: 0, to: 'gate_2', toPin: 1 },   // CLK → CLK

        // DFF2
        { from: 'gate_2', fromPin: 0, to: 'gate_3', toPin: 0 },    // Q1 → D
        { from: 'gate_1', fromPin: 0, to: 'gate_3', toPin: 1 },    // NOT_CLK → CLK

        // DFF3
        { from: 'gate_3', fromPin: 0, to: 'gate_4', toPin: 0 },    // Q2 → D
        { from: 'input_0', fromPin: 0, to: 'gate_4', toPin: 1 },   // CLK → CLK

        // Execute output
        { from: 'gate_4', fromPin: 0, to: 'output_0', toPin: 0 },  // Q3 → Execute

        // ─── Fetch path wiring ───
        // Feedback: Q_toggle → NOT
        { from: 'gate_7', fromPin: 0, to: 'gate_5', toPin: 0 },    // Q_toggle → NOT

        // AND(NOT_Q_toggle, NOT_Reset)
        { from: 'gate_5', fromPin: 0, to: 'gate_6', toPin: 0 },    // NOT(Q_toggle)
        { from: 'gate_0', fromPin: 0, to: 'gate_6', toPin: 1 },    // NOT_Reset (shared)

        // DFF_toggle
        { from: 'gate_6', fromPin: 0, to: 'gate_7', toPin: 0 },    // AND → D
        { from: 'input_0', fromPin: 0, to: 'gate_7', toPin: 1 },   // CLK → CLK

        // Fetch output
        { from: 'gate_7', fromPin: 0, to: 'output_1', toPin: 0 },  // Q_toggle → Fetch
      ],
      'level_boss_hard'
    );
  });
});
