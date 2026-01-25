import { describe, it, expect, beforeEach } from 'vitest';
import { Circuit } from '../src/core/Circuit.js';
import { Validator } from '../src/core/Validator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all levels from manifest
const manifestPath = path.resolve(__dirname, '../story/levels-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const levels = manifest.levels.filter(l => l.id !== 'level_00').sort((a, b) => {
  const idA = a.id.match(/\d+/) ? parseInt(a.id.match(/\d+/)[0]) : 999;
  const idB = b.id.match(/\d+/) ? parseInt(b.id.match(/\d+/)[0]) : 999;
  return idA - idB;
});

describe('Circuit Simulation & Level Validation', () => {
    let circuit;

    beforeEach(() => {
        circuit = new Circuit();
    });

    it('should have loaded levels', () => {
        expect(levels.length).toBeGreaterThan(0);
    });

    it('should validate Level 03: NOT Gate', () => {
        const level = levels.find(l => l.id === 'level_03');
        circuit.setupLevel(level);
        
        // Build solution: Input -> NOT -> Output
        const input = circuit.inputs[0];
        const output = circuit.outputs[0];
        const notGate = circuit.addGate('not', 300, 150);
        
        circuit.connect(input.id, 0, notGate.id, 0);
        circuit.connect(notGate.id, 0, output.id, 0);
        
        const result = Validator.validate(circuit, level);
        expect(result.valid).toBe(true);
    });

    it('should validate Level 04: AND Gate', () => {
        const level = levels.find(l => l.id === 'level_04');
        circuit.setupLevel(level);
        
        const in1 = circuit.inputs[0];
        const in2 = circuit.inputs[1];
        const out = circuit.outputs[0];
        const andGate = circuit.addGate('and', 300, 150);
        
        circuit.connect(in1.id, 0, andGate.id, 0);
        circuit.connect(in2.id, 0, andGate.id, 1);
        circuit.connect(andGate.id, 0, out.id, 0);
        
        const result = Validator.validate(circuit, level);
        expect(result.valid).toBe(true);
    });

    it('should validate Level 08: XOR Gate', () => {
        const level = levels.find(l => l.id === 'level_08');
        circuit.setupLevel(level);
        
        const in1 = circuit.inputs[0];
        const in2 = circuit.inputs[1];
        const out = circuit.outputs[0];
        const xorGate = circuit.addGate('xor', 300, 150);
        
        circuit.connect(in1.id, 0, xorGate.id, 0);
        circuit.connect(in2.id, 0, xorGate.id, 1);
        circuit.connect(xorGate.id, 0, out.id, 0);
        
        const result = Validator.validate(circuit, level);
        expect(result.valid).toBe(true);
    });

    it('should validate Level 14: SR Latch (Sequential)', () => {
        const level = levels.find(l => l.id === 'level_14');
        circuit.setupLevel(level);
        
        const s = circuit.inputs[0];
        const r = circuit.inputs[1];
        const q = circuit.outputs[0];
        const qNot = circuit.outputs[1];
        
        const latch = circuit.addGate('srlatch', 300, 150);
        
        circuit.connect(s.id, 0, latch.id, 0);
        circuit.connect(r.id, 0, latch.id, 1);
        circuit.connect(latch.id, 0, q.id, 0);
        circuit.connect(latch.id, 1, qNot.id, 0);
        
        // Level 14 now uses targetSequence for sequential validation
        const result = Validator.validate(circuit, level);
        expect(result.valid).toBe(true);
    });

    it('should validate Level 13: Full Adder', () => {
        const level = levels.find(l => l.id === 'level_13');
        circuit.setupLevel(level);
        
        const a = circuit.inputs[0];
        const b = circuit.inputs[1];
        const cin = circuit.inputs[2];
        const sum = circuit.outputs[0];
        const cout = circuit.outputs[1];
        
        const fa = circuit.addGate('fulladder', 300, 150);
        
        circuit.connect(a.id, 0, fa.id, 0);
        circuit.connect(b.id, 0, fa.id, 1);
        circuit.connect(cin.id, 0, fa.id, 2);
        circuit.connect(fa.id, 0, sum.id, 0);
        circuit.connect(fa.id, 1, cout.id, 0);
        
        const result = Validator.validate(circuit, level);
        expect(result.valid).toBe(true);
    });

    it('should fail an incorrect circuit', () => {
        const level = levels.find(l => l.id === 'level_04');
        circuit.setupLevel(level);
        
        const in1 = circuit.inputs[0];
        const in2 = circuit.inputs[1];
        const out = circuit.outputs[0];
        const orGate = circuit.addGate('or', 300, 150); // Wrong gate!
        
        circuit.connect(in1.id, 0, orGate.id, 0);
        circuit.connect(in2.id, 0, orGate.id, 1);
        circuit.connect(orGate.id, 0, out.id, 0);
        
        const result = Validator.validate(circuit, level);
        expect(result.valid).toBe(false);
    });

    it('should detect SR Latch forbidden state as metastable', () => {
        circuit.clear();
        
        const s = circuit.addGate('input', 100, 150);
        const r = circuit.addGate('input', 100, 250);
        const latch = circuit.addGate('srlatch', 300, 200);
        const qOut = circuit.addGate('output', 500, 150);
        const qNotOut = circuit.addGate('output', 500, 250);
        
        circuit.connect(s.id, 0, latch.id, 0);
        circuit.connect(r.id, 0, latch.id, 1);
        circuit.connect(latch.id, 0, qOut.id, 0);
        circuit.connect(latch.id, 1, qNotOut.id, 0);
        
        // Set both S and R high (forbidden state)
        circuit.setInputs([1, 1]);
        circuit.simulate();
        
        // Check that metastability is detected
        expect(circuit.lastSimulationInfo.hasMetastability).toBe(true);
        expect(circuit.lastSimulationInfo.metastableNodes).toContain(latch.id);
        expect(latch.isMetastable).toBe(true);
    });

    it('should track simulation convergence info', () => {
        // Use a fresh circuit for this test
        const freshCircuit = new Circuit();
        
        const inp = freshCircuit.addGate('input', 100, 150);
        const notGate = freshCircuit.addGate('not', 200, 150);
        const out = freshCircuit.addGate('output', 400, 150);
        
        freshCircuit.connect(inp.id, 0, notGate.id, 0);
        freshCircuit.connect(notGate.id, 0, out.id, 0);
        
        freshCircuit.setInputs([1]);
        freshCircuit.simulate();
        
        expect(freshCircuit.lastSimulationInfo.converged).toBe(true);
        expect(freshCircuit.lastSimulationInfo.oscillating).toBe(false);
        expect(freshCircuit.lastSimulationInfo.passes).toBeGreaterThan(0);
        expect(freshCircuit.lastSimulationInfo.physicsNote).toBe('Circuit reached stable state');
    });
});
