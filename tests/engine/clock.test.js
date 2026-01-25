import { describe, it, expect, beforeEach } from 'vitest';
import { Circuit } from '../../src/core/Circuit.js';
import { Clock } from '../../src/core/Gates.js';

describe('Clock Component', () => {
    let circuit;
    let clock;

    beforeEach(() => {
        circuit = new Circuit();
        clock = new Clock('clk1', 0, 0, 1); // 1 Hz = 1000ms period
        circuit.gates.set(clock.id, clock);
    });

    it('should initialize with value 0', () => {
        expect(clock.value).toBe(0);
        expect(clock.outputs[0]).toBe(0);
    });

    it('should not toggle if time delta is small', () => {
        const changed = clock.update(100); // 100ms
        expect(changed).toBe(false);
        expect(clock.value).toBe(0);
    });

    it('should toggle after half period (500ms)', () => {
        // Accumulate 500ms
        clock.update(400);
        const changed = clock.update(100);
        
        expect(changed).toBe(true);
        expect(clock.value).toBe(1);
    });

    it('should continue toggling', () => {
        clock.update(500); // 0 -> 1
        expect(clock.value).toBe(1);
        
        clock.update(500); // 1 -> 0
        expect(clock.value).toBe(0);
        
        clock.update(500); // 0 -> 1
        expect(clock.value).toBe(1);
    });

    it('should drive circuit simulation via tick', () => {
        // Setup Clock -> Wire -> Output
        // circuit.tick() calls clock.update()
        
        const changed = circuit.tick(600); // Should trigger toggle (500ms threshold)
        expect(changed).toBe(true);
        expect(clock.value).toBe(1);
        
        const changed2 = circuit.tick(100); // No toggle
        expect(changed2).toBe(false);
    });
});