import { MathUtils } from '../../utils/MathUtils.js';

/**
 * LevelGenerator - Procedural puzzle generation for Endless mode
 * Generates logic synthesis challenges with proper educational content
 */
export class LevelGenerator {
    // Gate categories by difficulty tier
    static GATE_TIERS = {
        1: ['and', 'or', 'not'],
        2: ['and', 'or', 'not', 'nand', 'nor'],
        3: ['and', 'or', 'not', 'nand', 'nor', 'xor'],
        4: ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'],
        5: ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'mux2to1']
    };

    // Named logic functions for educational value
    static LOGIC_PATTERNS = [
        { name: 'Detector', desc: 'Detects when all inputs are HIGH', fn: (inputs) => inputs.every(i => i === 1) ? 1 : 0 },
        { name: 'Any-High', desc: 'Outputs HIGH if any input is HIGH', fn: (inputs) => inputs.some(i => i === 1) ? 1 : 0 },
        { name: 'Odd-Parity', desc: 'Outputs HIGH when odd number of inputs are HIGH', fn: (inputs) => inputs.reduce((a, b) => a ^ b, 0) },
        { name: 'Even-Parity', desc: 'Outputs HIGH when even number of inputs are HIGH', fn: (inputs) => inputs.reduce((a, b) => a ^ b, 0) ^ 1 },
        { name: 'Majority', desc: 'Outputs HIGH when more than half of inputs are HIGH', fn: (inputs) => inputs.filter(i => i === 1).length > inputs.length / 2 ? 1 : 0 },
        { name: 'Minority', desc: 'Outputs HIGH when less than half of inputs are HIGH', fn: (inputs) => inputs.filter(i => i === 1).length < inputs.length / 2 ? 1 : 0 },
        { name: 'Equality', desc: 'Outputs HIGH when all inputs are the same', fn: (inputs) => inputs.every(i => i === inputs[0]) ? 1 : 0 },
        { name: 'Implication', desc: 'A implies B (NOT A OR B)', fn: (inputs) => (inputs[0] === 0 || inputs[1] === 1) ? 1 : 0, minInputs: 2, maxInputs: 2 },
        { name: 'NAND-All', desc: 'Inverted AND of all inputs', fn: (inputs) => inputs.every(i => i === 1) ? 0 : 1 },
        { name: 'NOR-All', desc: 'Inverted OR of all inputs', fn: (inputs) => inputs.some(i => i === 1) ? 0 : 1 },
    ];

    // Hints based on pattern type
    static PATTERN_HINTS = {
        'Detector': 'Think about what gate produces HIGH only when ALL inputs are HIGH.',
        'Any-High': 'Which gate produces HIGH when ANY input is HIGH?',
        'Odd-Parity': 'XOR gates are your friend for parity checks. Chain them together.',
        'Even-Parity': 'Build odd-parity first, then invert the result.',
        'Majority': 'Consider using AND gates to check pairs, then combining with OR.',
        'Minority': 'This is the inverse of majority - build majority first, then invert.',
        'Equality': 'XNOR checks if two inputs are equal. Chain for more inputs.',
        'Implication': 'Remember: A→B is equivalent to (NOT A) OR B.',
        'NAND-All': 'Build AND of all inputs, then invert. Or use NAND directly!',
        'NOR-All': 'Build OR of all inputs, then invert. Or use NOR directly!',
        'Random': 'Analyze the truth table for patterns. Look for minterms (rows where output is 1).'
    };

    /**
     * Generate an Endless mode level
     * @param {number} difficulty - Difficulty level (1-10+)
     * @returns {Object} Level data with educational content
     */
    static generate(difficulty = 1) {
        const clampedDiff = Math.max(1, Math.min(difficulty, 10));
        const inputs = this.calculateInputCount(clampedDiff);
        const { truthTable, pattern } = this.generateLogicFunction(inputs, clampedDiff);
        const gateLimit = this.calculateGateLimit(inputs, clampedDiff, pattern);
        const availableGates = this.getAvailableGates(clampedDiff);
        
        const level = {
            id: `endless_${Date.now()}`,
            tier: 'endless',
            title: this.generateTitle(difficulty, pattern),
            description: this.generateDescription(inputs, pattern, gateLimit),
            introText: this.generateIntroText(difficulty, pattern, inputs),
            objective: `Build a circuit that matches the truth table using ${gateLimit} gates or fewer.`,
            storyText: this.generateStoryText(pattern),
            inputs: inputs,
            targetTruthTable: truthTable,
            availableGates: availableGates,
            maxGates: gateLimit,
            xpReward: this.calculateXP(difficulty, inputs, gateLimit),
            hint: this.getHint(pattern),
            patternName: pattern.name,
            difficulty: clampedDiff,
            // Mode-specific metadata
            mode: 'ENDLESS',
            isGenerated: true,
            generatedAt: Date.now()
        };

        return level;
    }

    /**
     * Calculate appropriate input count for difficulty
     */
    static calculateInputCount(difficulty) {
        if (difficulty <= 2) return 2;
        if (difficulty <= 4) return MathUtils.randomInt(2, 3);
        if (difficulty <= 6) return MathUtils.randomInt(2, 4);
        if (difficulty <= 8) return MathUtils.randomInt(3, 4);
        return MathUtils.randomInt(3, 5);
    }

    /**
     * Calculate gate limit based on complexity
     */
    static calculateGateLimit(inputs, difficulty, pattern) {
        // Base limit on number of truth table rows that are 1
        const baseLimit = inputs + Math.ceil(difficulty / 2);
        // Add some slack
        return Math.max(2, baseLimit + MathUtils.randomInt(1, 3));
    }

    /**
     * Get available gates for difficulty level
     */
    static getAvailableGates(difficulty) {
        const tier = Math.min(5, Math.ceil(difficulty / 2));
        return [...this.GATE_TIERS[tier]];
    }

    /**
     * Calculate XP reward
     */
    static calculateXP(difficulty, inputs, gateLimit) {
        return Math.round(difficulty * 15 + inputs * 10 + (10 - gateLimit) * 2);
    }

    /**
     * Generate logic function (truth table) with optional named pattern
     */
    static generateLogicFunction(inputCount, difficulty) {
        // Higher difficulty = more likely to get a random function
        const useNamedPattern = Math.random() > (difficulty * 0.08);
        
        if (useNamedPattern) {
            // Filter patterns valid for this input count
            const validPatterns = this.LOGIC_PATTERNS.filter(p => {
                if (p.minInputs && inputCount < p.minInputs) return false;
                if (p.maxInputs && inputCount > p.maxInputs) return false;
                return true;
            });
            
            if (validPatterns.length > 0) {
                const pattern = validPatterns[MathUtils.randomInt(0, validPatterns.length - 1)];
                const truthTable = this.generateTruthTableFromFunction(inputCount, pattern.fn);
                return { truthTable, pattern };
            }
        }
        
        // Random truth table
        const truthTable = this.generateRandomTruthTable(inputCount);
        return { 
            truthTable, 
            pattern: { name: 'Random', desc: 'A custom logic function' }
        };
    }

    /**
     * Generate truth table from a logic function
     */
    static generateTruthTableFromFunction(inputCount, fn) {
        const table = [];
        const rows = 2 ** inputCount;
        
        for (let i = 0; i < rows; i++) {
            const inputValues = [];
            for (let bit = inputCount - 1; bit >= 0; bit--) {
                inputValues.push((i >> bit) & 1);
            }
            const outputValue = fn(inputValues);
            table.push({ in: inputValues, out: [outputValue] });
        }
        
        return table;
    }

    /**
     * Generate random truth table (fallback)
     */
    static generateRandomTruthTable(inputCount) {
        const table = [];
        const rows = 2 ** inputCount;
        
        // Ensure at least one 0 and one 1 output for non-trivial puzzles
        let hasZero = false;
        let hasOne = false;
        
        for (let i = 0; i < rows; i++) {
            const inputValues = [];
            for (let bit = inputCount - 1; bit >= 0; bit--) {
                inputValues.push((i >> bit) & 1);
            }
            let outputValue = Math.random() > 0.5 ? 1 : 0;
            
            // Force diversity on last rows if needed
            if (i === rows - 2 && !hasZero) outputValue = 0;
            if (i === rows - 1 && !hasOne) outputValue = 1;
            
            if (outputValue === 0) hasZero = true;
            if (outputValue === 1) hasOne = true;
            
            table.push({ in: inputValues, out: [outputValue] });
        }
        
        return table;
    }

    /**
     * Generate level title
     */
    static generateTitle(difficulty, pattern) {
        const diffLabel = difficulty <= 2 ? 'Beginner' : 
                         difficulty <= 4 ? 'Intermediate' : 
                         difficulty <= 6 ? 'Advanced' : 
                         difficulty <= 8 ? 'Expert' : 'Master';
        return `${diffLabel} ${pattern.name} Challenge`;
    }

    /**
     * Generate level description
     */
    static generateDescription(inputs, pattern, gateLimit) {
        return `${pattern.desc}. Design a ${inputs}-input circuit that implements this function using at most ${gateLimit} gates.`;
    }

    /**
     * Generate educational intro text
     */
    static generateIntroText(difficulty, pattern, inputs) {
        const difficultyNote = difficulty <= 2 
            ? 'This is a warm-up challenge to practice basic gate combinations.'
            : difficulty <= 4
            ? 'This challenge requires combining multiple gates strategically.'
            : difficulty <= 6
            ? 'This is a complex challenge. Consider gate minimization techniques.'
            : 'This is an expert challenge. Think about Boolean algebra simplification.';
        
        return `Welcome to Endless Mode! Your task is to synthesize a circuit that implements the "${pattern.name}" function with ${inputs} inputs.\n\n${difficultyNote}\n\nStudy the truth table carefully - look for patterns in when the output is HIGH vs LOW. This will guide your gate selection.`;
    }

    /**
     * Generate story/explanation text
     */
    static generateStoryText(pattern) {
        const stories = {
            'Detector': 'Detection circuits are fundamental in computing. CPUs use them to detect specific instruction patterns, memory controllers detect address matches, and security systems detect intrusion patterns.',
            'Any-High': 'OR-style detection is used in interrupt systems (any device can signal), error detection (any error triggers alert), and input validation.',
            'Odd-Parity': 'Parity checking is a classic error detection technique. It\'s used in memory systems, data transmission, and RAID storage to detect single-bit errors.',
            'Even-Parity': 'Even parity is another error detection scheme. Some systems prefer even parity as it means "no errors" shows as a 0 output.',
            'Majority': 'Majority voting is used in fault-tolerant systems. Triple Modular Redundancy (TMR) uses three circuits and a majority voter to tolerate one failure.',
            'Minority': 'Minority detection can signal when consensus is breaking down or when most components are failing.',
            'Equality': 'Equality comparators are essential in CPUs for branch decisions, cache tag matching, and data comparison operations.',
            'Implication': 'Logical implication (A→B) is fundamental in conditional logic, rule-based systems, and formal verification.',
            'NAND-All': 'NAND gates are functionally complete - any logic function can be built using only NAND gates. This is crucial for chip manufacturing.',
            'NOR-All': 'Like NAND, NOR is also functionally complete. Early computers used NOR-only logic (Apollo Guidance Computer).',
            'Random': 'Real-world logic often doesn\'t fit neat patterns. Being able to synthesize arbitrary functions from truth tables is a key digital design skill.'
        };
        return stories[pattern.name] || stories['Random'];
    }

    /**
     * Get hint for pattern
     */
    static getHint(pattern) {
        return this.PATTERN_HINTS[pattern.name] || this.PATTERN_HINTS['Random'];
    }

    /**
     * Generate Sandbox mode level data
     */
    static generateSandboxLevel() {
        return {
            id: 'sandbox',
            tier: 'sandbox',
            title: 'Sandbox Mode',
            description: 'Free experimentation area. Build any circuit you want with unlimited components. No objectives - just explore and learn!',
            introText: `Welcome to Sandbox Mode!\n\nThis is your digital playground. There are no goals, no limits, and no wrong answers. Use this space to:\n\n• Experiment with different gate combinations\n• Test your understanding of Boolean logic\n• Build practice circuits before tackling challenges\n• Create your own custom logic functions\n\nAll gates are available. Place them by dragging from the toolbox or clicking to select and tapping on the canvas.`,
            objective: 'Explore freely! Build anything you want.',
            storyText: 'Sandbox mode mirrors how real engineers prototype. Before committing to silicon, designers simulate circuits in EDA tools, testing ideas without risk. This iterative process is how every chip from Arduino to Apple Silicon begins.',
            availableGates: null, // null means all gates
            inputs: 4,
            maxGates: Infinity,
            hint: 'Try building basic gates from other gates. For example: AND from NANDs, or XOR from basic gates.',
            mode: 'SANDBOX',
            isGenerated: false
        };
    }

    /**
     * Generate Custom mode level data
     */
    static generateCustomLevel(config = {}) {
        const inputs = config.inputs || 2;
        const hasTarget = config.targetTruthTable && config.targetTruthTable.length > 0;
        
        return {
            id: 'custom',
            tier: 'custom',
            title: config.title || 'Custom Circuit',
            description: config.description || (hasTarget 
                ? 'Design a circuit to match the provided truth table.'
                : 'Design your own logic system. Set your own goals!'),
            introText: config.introText || `Custom Mode lets you define your own challenges.\n\n${hasTarget 
                ? 'A target truth table has been provided. Your goal is to build a circuit that produces the correct output for every input combination.'
                : 'No target is set - use this mode to prototype ideas or create your own puzzles to share with others.'}`,
            objective: config.objective || (hasTarget 
                ? 'Build a circuit matching the truth table.'
                : 'Design a custom logic system.'),
            storyText: 'Custom challenges represent the real work of digital designers: translating specifications into working circuits. Every chip starts as a requirement that someone had to implement.',
            availableGates: config.gates || null,
            inputs: inputs,
            maxGates: config.maxGates || Infinity,
            targetTruthTable: config.targetTruthTable || null,
            hint: config.hint || (hasTarget 
                ? 'Analyze the truth table for patterns. Count the 1s in the output column - this suggests the minimum complexity.'
                : 'Build incrementally. Start simple and add complexity.'),
            mode: 'CUSTOM',
            isGenerated: false
        };
    }
}
