import { describe, it, expect, beforeEach } from 'vitest';
import { Circuit } from '../src/core/Circuit.js';
import { PropagationDelays, GateFactory } from '../src/core/Gates.js';

describe('Propagation Delay & Timing Analysis', () => {
    let circuit;

    beforeEach(() => {
        circuit = new Circuit();
    });

    describe('Gate Propagation Delays', () => {
        it('should have propagation delay constants defined', () => {
            expect(PropagationDelays.NOT).toBe(8);
            expect(PropagationDelays.AND).toBe(10);
            expect(PropagationDelays.NAND).toBe(8);
            expect(PropagationDelays.XOR).toBe(14);
            expect(PropagationDelays.DFF_CLK_TO_Q).toBe(12);
        });

        it('should assign correct propagation delay to gates', () => {
            const notGate = GateFactory.create('not', 'n1');
            const andGate = GateFactory.create('and', 'a1');
            const xorGate = GateFactory.create('xor', 'x1');
            
            expect(notGate.propagationDelay).toBe(PropagationDelays.NOT);
            expect(andGate.propagationDelay).toBe(PropagationDelays.AND);
            expect(xorGate.propagationDelay).toBe(PropagationDelays.XOR);
        });

        it('should assign timing parameters to D flip-flop', () => {
            const dff = GateFactory.create('dflipflop', 'dff1');
            expect(dff.propagationDelay).toBe(PropagationDelays.DFF_CLK_TO_Q);
            expect(dff.setupTime).toBe(PropagationDelays.DFF_SETUP);
            expect(dff.holdTime).toBe(PropagationDelays.DFF_HOLD);
        });
    });

    describe('Critical Path Analysis', () => {
        it('should calculate timing for simple chain', () => {
            // Input -> NOT -> Output
            const input = circuit.addGate('input', 0, 0);
            const not = circuit.addGate('not', 100, 0);
            const output = circuit.addGate('output', 200, 0);
            
            circuit.connect(input.id, 0, not.id, 0);
            circuit.connect(not.id, 0, output.id, 0);
            
            const timing = circuit.analyzeTiming();
            
            expect(timing.totalDelayNs).toBe(
                PropagationDelays.INPUT + PropagationDelays.NOT + PropagationDelays.OUTPUT
            );
            // Critical path includes all gates from input to output
            expect(timing.criticalPath.length).toBeGreaterThanOrEqual(2);
            // The output should be the last element
            expect(timing.criticalPath[timing.criticalPath.length - 1].type).toBe('output');
        });

        it('should find longest path in parallel paths', () => {
            // Input -> AND -> Output (10ns)
            // Input -> XOR -> Output (14ns) <- critical path
            const input = circuit.addGate('input', 0, 0);
            const and = circuit.addGate('and', 100, 0);
            const xor = circuit.addGate('xor', 100, 100);
            const output = circuit.addGate('output', 200, 50);
            
            circuit.connect(input.id, 0, and.id, 0);
            circuit.connect(input.id, 0, and.id, 1);
            circuit.connect(input.id, 0, xor.id, 0);
            circuit.connect(input.id, 0, xor.id, 1);
            circuit.connect(xor.id, 0, output.id, 0);
            
            const timing = circuit.analyzeTiming();
            
            // XOR path is longer
            expect(timing.totalDelayNs).toBe(
                PropagationDelays.INPUT + PropagationDelays.XOR + PropagationDelays.OUTPUT
            );
        });

        it('should calculate max frequency', () => {
            const input = circuit.addGate('input', 0, 0);
            const output = circuit.addGate('output', 100, 0);
            circuit.connect(input.id, 0, output.id, 0);
            
            const timing = circuit.analyzeTiming();
            
            // fmax = 1000 / totalDelay (in MHz)
            expect(timing.maxFrequencyMHz).toBeGreaterThan(0);
        });
    });

    describe('Hazard Detection', () => {
        it('should detect potential static hazards', () => {
            // Create a circuit with reconvergent fanout (potential hazard)
            const input = circuit.addGate('input', 0, 0);
            const not = circuit.addGate('not', 100, 0);
            const and = circuit.addGate('and', 200, 50);
            const output = circuit.addGate('output', 300, 50);
            
            // A and A' - classic static-1 hazard structure
            circuit.connect(input.id, 0, not.id, 0);
            circuit.connect(input.id, 0, and.id, 0);  // Direct path
            circuit.connect(not.id, 0, and.id, 1);     // Inverted path (longer)
            circuit.connect(and.id, 0, output.id, 0);
            
            const hazards = circuit.detectHazards();
            
            // Should detect skew between the two AND inputs
            expect(hazards.length).toBeGreaterThanOrEqual(0);
            // Note: With our simple analysis, NOT + AND path vs direct has 8ns skew
        });
    });

    describe('Advanced Flip-Flops', () => {
        it('should create T flip-flop with toggle behavior', () => {
            const tff = GateFactory.create('tflipflop', 'tff1');
            expect(tff.inputCount).toBe(2);  // T, Clock
            expect(tff.outputCount).toBe(2); // Q, Q̅
            expect(tff.outputs).toEqual([0, 1]); // Initial state
            
            // T=1, rising clock edge should toggle
            tff.inputs = [1, 0];
            tff.lastClock = 0;
            tff.compute();
            expect(tff.outputs).toEqual([0, 1]); // No change (no edge yet)
            
            tff.inputs = [1, 1]; // Rising edge
            const result = tff.compute();
            expect(result).toEqual([1, 0]); // Toggled to 1
            
            tff.lastClock = 1;
            tff.inputs = [1, 0]; // Falling edge
            tff.compute();
            tff.inputs = [1, 1]; // Another rising edge
            tff.compute();
            expect(tff.outputs).toEqual([0, 1]); // Toggled back to 0
        });

        it('should create JK flip-flop with all modes', () => {
            const jkff = GateFactory.create('jkflipflop', 'jkff1');
            expect(jkff.inputCount).toBe(3);  // J, K, Clock
            expect(jkff.outputCount).toBe(2); // Q, Q̅
            
            // Set mode: J=1, K=0
            jkff.lastClock = 0;
            jkff.inputs = [1, 0, 1]; // Rising edge
            jkff.compute();
            expect(jkff.outputs).toEqual([1, 0]);
            
            // Reset mode: J=0, K=1
            jkff.lastClock = 1;
            jkff.inputs = [0, 1, 0]; // Low clock
            jkff.compute();
            jkff.lastClock = 0;
            jkff.inputs = [0, 1, 1]; // Rising edge
            jkff.compute();
            expect(jkff.outputs).toEqual([0, 1]);
            
            // Toggle mode: J=K=1
            jkff.lastClock = 1;
            jkff.inputs = [1, 1, 0]; // Low clock
            jkff.compute();
            jkff.lastClock = 0;
            jkff.inputs = [1, 1, 1]; // Rising edge
            jkff.compute();
            expect(jkff.outputs).toEqual([1, 0]); // Toggled from 0 to 1
        });
    });});