import { MathUtils } from '../../utils/MathUtils.js';

export class LevelGenerator {
    static generate(difficulty = 1) {
        const inputs = MathUtils.randomInt(1, Math.min(4, difficulty + 1));
        const gateCount = MathUtils.randomInt(difficulty, difficulty * 2);
        
        // Simple truth table generation for a random logic function
        // This is a placeholder for a more complex logic synthesizer
        const targetTruthTable = this.generateRandomTruthTable(inputs);

        return {
            id: `endless_${Date.now()}`,
            title: `Challenge Level ${difficulty}`,
            description: `Synthesize a circuit for the given truth table using ${gateCount} gates or less.`,
            inputs: inputs,
            targetTruthTable: targetTruthTable,
            availableGates: ['and', 'or', 'not', 'nand', 'nor', 'xor'],
            maxGates: gateCount + 2,
            xpReward: difficulty * 20
        };
    }

    static generateRandomTruthTable(inputCount) {
        const table = [];
        const rows = 2 ** inputCount;
        
        for (let i = 0; i < rows; i++) {
            const inputValues = i.toString(2).padStart(inputCount, '0').split('').map(Number);
            const outputValue = Math.random() > 0.5 ? 1 : 0;
            table.push({ in: inputValues, out: [outputValue] });
        }
        
        return table;
    }
}
