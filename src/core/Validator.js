import { globalEvents, Events } from '../game/EventBus.js';

/**
 * Validator - Verifies circuit behavior against truth tables
 * Does NOT check circuit structure, only behavior (allows creative solutions)
 */
export class Validator {
    /**
     * Validate a circuit against a target truth table OR sequence
     * @param {Circuit} circuit - The user circuit to validate
     * @param {Object} levelData - The level data containing targetTruthTable or targetSequence
     * @returns {Object} { valid: boolean, results: Array, failedCases: Array }
     */
    static validate(circuit, levelData) {
        if (levelData.targetSequence) {
            return this.validateSequential(circuit, levelData.targetSequence);
        }
        
        const truthTable = levelData.targetTruthTable || [];
        const results = [];
        const failedCases = [];

        truthTable.forEach((row, index) => {
            // Set the inputs on the circuit
            circuit.setInputs(row.in);

            // Propagate signals
            circuit.simulate();

            // Get actual output
            const actualOutput = circuit.getOutputs();

            // Compare with expected (handle both single value and array)
            const expectedOutput = Array.isArray(row.out) ? row.out : [row.out];
            const matches = this.arraysEqual(actualOutput, expectedOutput);

            results.push({
                inputs: [...row.in],
                expected: expectedOutput,
                actual: actualOutput,
                passed: matches
            });

            if (!matches) {
                failedCases.push({
                    case: index,
                    inputs: row.in,
                    expected: expectedOutput,
                    actual: actualOutput
                });
            }
        });

        const valid = failedCases.length === 0;

        globalEvents.emit(Events.PUZZLE_VERIFIED, {
            valid,
            results,
            failedCases,
            score: this.calculateScore(results)
        });

        return { valid, results, failedCases };
    }

    /**
     * Validate a circuit against a timed sequence of inputs
     * @param {Circuit} circuit 
     * @param {Array} sequence 
     */
    static validateSequential(circuit, sequence) {
        const results = [];
        const failedCases = [];

        // Reset circuit to initial state for sequence validation
        circuit.reset();

        sequence.forEach((step, index) => {
            // Set inputs
            circuit.setInputs(step.in);

            // Propagate - sequential circuits might need multiple passes or ticks
            // For now, we simulate until stable or max passes
            circuit.simulate();

            // Get output
            const actualOutput = circuit.getOutputs();
            const expectedOutput = Array.isArray(step.out) ? step.out : [step.out];
            const matches = this.arraysEqual(actualOutput, expectedOutput);

            results.push({
                step: index,
                description: step.desc || `Step ${index}`,
                inputs: [...step.in],
                expected: expectedOutput,
                actual: actualOutput,
                passed: matches
            });

            if (!matches) {
                failedCases.push({
                    case: index,
                    description: step.desc || `Step ${index}`,
                    inputs: step.in,
                    expected: expectedOutput,
                    actual: actualOutput
                });
            }
        });

        const valid = failedCases.length === 0;

        globalEvents.emit(Events.PUZZLE_VERIFIED, {
            valid,
            results,
            failedCases,
            score: this.calculateScore(results)
        });

        return { valid, results, failedCases };
    }

    /**
     * Compare two arrays for equality
     */
    static arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Calculate score based on correct cases
     */
    static calculateScore(results) {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        return Math.round((passed / total) * 100);
    }

    /**
     * Generate all possible input combinations for n inputs
     */
    static generateInputCombinations(inputCount) {
        const combinations = [];
        const total = Math.pow(2, inputCount);

        for (let i = 0; i < total; i++) {
            const combination = [];
            for (let bit = inputCount - 1; bit >= 0; bit--) {
                combination.push((i >> bit) & 1);
            }
            combinations.push(combination);
        }

        return combinations;
    }

    /**
     * Compute truth table from a working circuit (for generating puzzles)
     */
    static computeTruthTable(circuit) {
        const inputCount = circuit.inputs.length;
        const combinations = this.generateInputCombinations(inputCount);
        const truthTable = [];

        combinations.forEach(inputs => {
            circuit.setInputs(inputs);
            circuit.simulate();
            truthTable.push({
                in: inputs,
                out: [...circuit.getOutputs()]
            });
        });

        return truthTable;
    }
}
