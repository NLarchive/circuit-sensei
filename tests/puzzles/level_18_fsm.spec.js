// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 18 – Finite State Machines', () => {
  test('Easy: traffic light FSM', async ({ page, baseURL }) => {
    // Use 2-bit binary phase counter and decode lights so GREEN lasts first 2 phases.
    // Counter: D0=NOT(Q0), D1=Q1 XOR Q0   (00→01→10→11→00)
    // Decode:
    //   GREEN  = NOT(Q1)
    //   YELLOW = Q1 AND NOT(Q0)
    //   RED    = Q1 AND Q0
    await solvePuzzle(page, baseURL, 'level_18', 'easy',
      [
        { type: 'dFlipFlop', x: 350, y: 100 },
        { type: 'dFlipFlop', x: 350, y: 250 },
        { type: 'not',       x: 200, y: 100 },
        { type: 'xor',       x: 200, y: 250 },
        { type: 'not',       x: 500, y: 50 },
        { type: 'and',       x: 520, y: 200 },
        { type: 'and',       x: 520, y: 350 },
      ],
      [
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_0', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },

        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_3', toPin: 1 },
        { from: 'gate_3',  fromPin: 0, to: 'gate_1', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },

        { from: 'gate_1',  fromPin: 0, to: 'gate_4', toPin: 0 }, // NOT(Q1) => GREEN
        { from: 'gate_1',  fromPin: 0, to: 'gate_5', toPin: 0 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_5', toPin: 1 }, // Q1 AND NOT(Q0) => YELLOW
        { from: 'gate_1',  fromPin: 0, to: 'gate_6', toPin: 0 },
        { from: 'gate_0',  fromPin: 0, to: 'gate_6', toPin: 1 }, // Q1 AND Q0 => RED

        { from: 'gate_4', fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'gate_5', fromPin: 0, to: 'output_1', toPin: 0 },
        { from: 'gate_6', fromPin: 0, to: 'output_2', toPin: 0 },
      ],
      'level_18_easy'
    );
  });

  test('Medium: ring counter', async ({ page, baseURL }) => {
    // 3-state one-hot rotor over rising edges: 001→010→100→001...
    // Use two FFs as state, with transitions 00→01→10→00.
    // D1 = Q0, D0 = NOR(Q1,Q0). Output decode: [Q1, Q0, NOR(Q1,Q0)].
    await solvePuzzle(page, baseURL, 'level_18', 'medium',
      [
        { type: 'dFlipFlop', x: 350, y: 250 },
        { type: 'dFlipFlop', x: 350, y: 100 },
        { type: 'nor',       x: 220, y: 180 },
      ],
      [
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 0 },
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 1 },

        { from: 'gate_1',  fromPin: 0, to: 'gate_0', toPin: 0 }, // D1 = Q0
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },
        { from: 'gate_2',  fromPin: 0, to: 'gate_1', toPin: 0 }, // D0 = NOR(Q1,Q0)
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },

        { from: 'gate_0', fromPin: 0, to: 'output_0', toPin: 0 },
        { from: 'gate_1', fromPin: 0, to: 'output_1', toPin: 0 },
        { from: 'gate_2', fromPin: 0, to: 'output_2', toPin: 0 },
      ],
      'level_18_medium'
    );
  });

  test('Hard: sequence detector (101)', async ({ page, baseURL }) => {
    // 2 inputs (CLK, In), 1 output. Mealy FSM detecting 101.
    // States: S0(idle), S1(seen 1), S10(seen 10)
    // S0→1→S1, S0→0→S0
    // S1→0→S10, S1→1→S1
    // S10→1→S1(output=1), S10→0→S0
    // 2 state bits Q1,Q0: S0=00, S1=01, S10=10
    // Next state:
    //   Q1Q0=00,In=0: D1D0=00; Q1Q0=00,In=1: D1D0=01
    //   Q1Q0=01,In=0: D1D0=10; Q1Q0=01,In=1: D1D0=01
    //   Q1Q0=10,In=0: D1D0=00; Q1Q0=10,In=1: D1D0=01
    //   Q1Q0=11: don't care → 00
    // D0 = In (always advance to S1 when input is 1)
    // D1 = Q0 AND NOT(In) (advance to S10 only from S1 with input 0)
    // Output pulse on detect edge:
    // detect_pre = Q1 AND NOT(Q0) AND In (true during setup before detect edge)
    // pulse_ff captures detect_pre on CLK rising edge
    // output = pulse_ff.Q AND CLK
    await solvePuzzle(page, baseURL, 'level_18', 'hard',
      [
        { type: 'dFlipFlop', x: 350, y: 100 },  // gate_0: FF0 (Q0)
        { type: 'dFlipFlop', x: 350, y: 300 },  // gate_1: FF1 (Q1)
        { type: 'nor',       x: 220, y: 300 },   // gate_2: D1 = NOR(In, NOT(Q0)) = Q0 AND NOT(In)
        { type: 'dFlipFlop', x: 700, y: 220 },   // gate_3: pulse FF
        { type: 'not',       x: 500, y: 80 },    // gate_4: NOT(Q0)
        { type: 'and',       x: 560, y: 180 },   // gate_5: Q1 AND NOT(Q0)
        { type: 'and',       x: 660, y: 180 },   // gate_6: detect_pre = gate_5 AND In
        { type: 'and',       x: 820, y: 220 },   // gate_7: output = pulse_ff.Q AND CLK
      ],
      [
        // D0 = In
        { from: 'input_1', fromPin: 0, to: 'gate_0', toPin: 0 },  // In→D0
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK

        // D1 = NOR(In, NOT(Q0)) = Q0 AND NOT(In)
        { from: 'gate_0',  fromPin: 0, to: 'gate_4', toPin: 0 },  // Q0 -> NOT
        { from: 'input_1', fromPin: 0, to: 'gate_2', toPin: 0 },  // In
        { from: 'gate_4',  fromPin: 0, to: 'gate_2', toPin: 1 },  // NOT(Q0)
        { from: 'gate_2',  fromPin: 0, to: 'gate_1', toPin: 0 },  // -> D1
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },  // CLK

        { from: 'gate_1',  fromPin: 0, to: 'gate_5', toPin: 0 },  // Q1
        { from: 'gate_4',  fromPin: 0, to: 'gate_5', toPin: 1 },  // NOT(Q0)
        { from: 'gate_5',  fromPin: 0, to: 'gate_6', toPin: 0 },
        { from: 'input_1', fromPin: 0, to: 'gate_6', toPin: 1 },  // In

        // Pulse FF captures detect_pre on CLK rising edge
        { from: 'gate_6',  fromPin: 0, to: 'gate_3', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_3', toPin: 1 },

        // Output pulse only during CLK=1
        { from: 'gate_3',  fromPin: 0, to: 'gate_7', toPin: 0 },
        { from: 'input_0', fromPin: 0, to: 'gate_7', toPin: 1 },  // CLK
        { from: 'gate_7',  fromPin: 0, to: 'output_0', toPin: 0 },
      ],
      'level_18_hard'
    );
  });

  test('Expert: modulo-3 counter', async ({ page, baseURL }) => {
    // 1 input (CLK), 2 outputs (Q₁,Q₀). Cycles: 00→01→10→00
    // D₀ = Q₁ NOR Q₀, D₁ = NOT(Q₁) AND Q₀
    await solvePuzzle(page, baseURL, 'level_18', 'expert',
      [
        { type: 'dFlipFlop', x: 450, y: 100 },  // gate_0: FF0 (Q₀)
        { type: 'dFlipFlop', x: 450, y: 300 },  // gate_1: FF1 (Q₁)
        { type: 'nor',       x: 300, y: 100 },   // gate_2: NOR(Q₁,Q₀) → D₀
        { type: 'not',       x: 300, y: 250 },   // gate_3: NOT(Q₁)
        { type: 'and',       x: 350, y: 320 },   // gate_4: AND(NOT_Q₁,Q₀) → D₁
      ],
      [
        // D₀ = NOR(Q₁,Q₀)
        { from: 'gate_1',  fromPin: 0, to: 'gate_2', toPin: 0 },  // Q₁
        { from: 'gate_0',  fromPin: 0, to: 'gate_2', toPin: 1 },  // Q₀
        { from: 'gate_2',  fromPin: 0, to: 'gate_0', toPin: 0 },  // NOR→D₀
        { from: 'input_0', fromPin: 0, to: 'gate_0', toPin: 1 },  // CLK
        // D₁ = NOT(Q₁) AND Q₀
        { from: 'gate_1',  fromPin: 0, to: 'gate_3', toPin: 0 },  // Q₁→NOT
        { from: 'gate_3',  fromPin: 0, to: 'gate_4', toPin: 0 },  // NOT_Q₁
        { from: 'gate_0',  fromPin: 0, to: 'gate_4', toPin: 1 },  // Q₀
        { from: 'gate_4',  fromPin: 0, to: 'gate_1', toPin: 0 },  // AND→D₁
        { from: 'input_0', fromPin: 0, to: 'gate_1', toPin: 1 },  // CLK
        // Outputs
        { from: 'gate_1', fromPin: 0, to: 'output_0', toPin: 0 }, // Q₁
        { from: 'gate_0', fromPin: 0, to: 'output_1', toPin: 0 }, // Q₀
      ],
      'level_18_expert'
    );
  });
});
