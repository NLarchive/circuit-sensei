// @ts-check
import { test, expect } from '@playwright/test';
import { solvePuzzle } from './puzzle-helpers.js';

test.describe('Level 01 – The Simple Wire', () => {
  test('Easy: direct wire connection', async ({ page, baseURL }) => {
    // 1 input → 1 output. No gates needed, just wire input_0 → output_0.
    await solvePuzzle(page, baseURL, 'level_01', 'easy', [], [
      { from: 'input_0', fromPin: 0, to: 'output_0', toPin: 0 },
    ], 'level_01_easy');
  });

  test('Medium: dual wire bus', async ({ page, baseURL }) => {
    // 2 inputs → 2 outputs. Wire A→A, B→B.
    await solvePuzzle(page, baseURL, 'level_01', 'medium', [], [
      { from: 'input_0', fromPin: 0, to: 'output_0', toPin: 0 },
      { from: 'input_1', fromPin: 0, to: 'output_1', toPin: 0 },
    ], 'level_01_medium');
  });

  test('Hard: signal fan-out', async ({ page, baseURL }) => {
    // 1 input → 3 outputs.
    await solvePuzzle(page, baseURL, 'level_01', 'hard', [], [
      { from: 'input_0', fromPin: 0, to: 'output_0', toPin: 0 },
      { from: 'input_0', fromPin: 0, to: 'output_1', toPin: 0 },
      { from: 'input_0', fromPin: 0, to: 'output_2', toPin: 0 },
    ], 'level_01_hard');
  });

  test('Expert: crossbar routing', async ({ page, baseURL }) => {
    // 2 inputs (A,B), 4 outputs: Out0=A, Out1=B, Out2=B, Out3=A
    // No gates — pure crossbar wiring pattern
    await solvePuzzle(page, baseURL, 'level_01', 'expert',
      [],
      [
        { from: 'input_0', fromPin: 0, to: 'output_0', toPin: 0 },  // A→Out0
        { from: 'input_1', fromPin: 0, to: 'output_1', toPin: 0 },  // B→Out1
        { from: 'input_1', fromPin: 0, to: 'output_2', toPin: 0 },  // B→Out2
        { from: 'input_0', fromPin: 0, to: 'output_3', toPin: 0 },  // A→Out3
      ],
      'level_01_expert'
    );
  });
});
