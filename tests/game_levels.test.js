import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Test suite for game level variants (easy, medium, hard)
 * Reads directly from story/levels-manifest.json (single source of truth)
 */

// Load manifest
const manifestPath = path.resolve(__dirname, '../story/levels-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const gatesCatalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/gates.json'), 'utf8'));
const gateCatalogIds = Object.keys(gatesCatalog).map(id => id.toLowerCase());

// Special gates that are allowed but not in gates.json
const specialGates = ['input', 'output', 'clock', 'transistor'];

/**
 * Deep merge base level with variant override (same as StoryLoader)
 */
function mergeVariant(baseLevel, variantName, override) {
    if (!override) return null;
    
    const { variants, ...base } = baseLevel;
    
    const deepMerge = (target, source) => {
        if (source === undefined) return target;
        if (source === null) return null;
        if (typeof source !== 'object') return source;
        if (Array.isArray(source)) return [...source];
        
        const result = { ...target };
        for (const [key, value] of Object.entries(source)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && target[key] && typeof target[key] === 'object') {
                result[key] = deepMerge(target[key], value);
            } else {
                result[key] = value;
            }
        }
        return result;
    };
    
    const merged = deepMerge(base, override);
    merged.id = `${baseLevel.id}_${variantName}`;
    return merged;
}

// Generate all variants from manifest
const allVariants = [];
const levelGroups = {};

manifest.levels.forEach(level => {
    if (!level.variants || level.id === 'level_00') return;
    
    const baseLevel = level.id;
    levelGroups[baseLevel] = [];
    
    ['easy', 'medium', 'hard'].forEach(variantName => {
        if (level.variants[variantName]) {
            const variant = mergeVariant(level, variantName, level.variants[variantName]);
            if (variant) {
                allVariants.push({ 
                    id: variant.id, 
                    baseLevel, 
                    variantName, 
                    data: variant 
                });
                levelGroups[baseLevel].push(variantName);
            }
        }
    });
});

describe('Game Level Variants Integrity (Manifest-Based)', () => {

    describe('Each level has 3 variants (easy, medium, hard)', () => {
        Object.entries(levelGroups).forEach(([baseLevel, variants]) => {
            it(`${baseLevel} should have easy, medium, and hard variants`, () => {
                expect(variants).toContain('easy');
                expect(variants).toContain('medium');
                expect(variants).toContain('hard');
            });
        });
    });

    describe('Game level required fields', () => {
        allVariants.forEach(({ id, data }) => {
            it(`${id} should have required fields`, () => {
                // Required fields for all game levels
                expect(data.id, `Missing id in ${id}`).toBeDefined();
                expect(data.tier, `Missing tier in ${id}`).toBeDefined();
                expect(data.title, `Missing title in ${id}`).toBeDefined();
                expect(data.objective, `Missing objective in ${id}`).toBeDefined();
                expect(data.description, `Missing description in ${id}`).toBeDefined();
                expect(data.introText, `Missing introText in ${id}`).toBeDefined();
                expect(data.hint, `Missing hint in ${id}`).toBeDefined();
                expect(data.physicsVisual, `Missing physicsVisual in ${id}`).toBeDefined();
                expect(data.availableGates, `Missing availableGates in ${id}`).toBeDefined();
                expect(Array.isArray(data.availableGates), `availableGates should be array in ${id}`).toBe(true);
                expect(typeof data.inputs, `inputs should be number in ${id}`).toBe('number');
                expect(typeof data.xpReward, `xpReward should be number in ${id}`).toBe('number');
                
                // Must have either targetTruthTable or targetSequence
                const hasValidation = data.targetTruthTable || data.targetSequence;
                expect(hasValidation, `${id} must have targetTruthTable or targetSequence`).toBeTruthy();
            });
        });
    });

    describe('Available gates are valid', () => {
        allVariants.forEach(({ id, data }) => {
            it(`${id} should only reference valid gates`, () => {
                data.availableGates.forEach(gateId => {
                    const lowerId = gateId.toLowerCase();
                    const isValid = gateCatalogIds.includes(lowerId) || specialGates.includes(lowerId);
                    expect(isValid, `Gate "${gateId}" in ${id} not found in catalog`).toBe(true);
                });
            });
        });
    });

    describe('Truth table / sequence validation', () => {
        allVariants.forEach(({ id, data }) => {
            it(`${id} should have valid truth table or sequence format`, () => {
                const validation = data.targetTruthTable || data.targetSequence;
                
                if (validation) {
                    expect(Array.isArray(validation), `Validation data should be array in ${id}`).toBe(true);
                    
                    validation.forEach((entry, idx) => {
                        expect(entry.in, `Entry ${idx} in ${id} missing "in"`).toBeDefined();
                        expect(entry.out, `Entry ${idx} in ${id} missing "out"`).toBeDefined();
                        expect(Array.isArray(entry.in), `Entry ${idx}.in should be array in ${id}`).toBe(true);
                        expect(Array.isArray(entry.out), `Entry ${idx}.out should be array in ${id}`).toBe(true);
                        expect(entry.in.length, `Input length mismatch in ${id} at entry ${idx}`).toBe(data.inputs);
                    });
                }
            });
        });
    });

    describe('Difficulty progression', () => {
        Object.entries(levelGroups).forEach(([baseLevel, variantNames]) => {
            it(`${baseLevel} variants should have appropriate XP progression`, () => {
                const variants = {};
                allVariants
                    .filter(v => v.baseLevel === baseLevel)
                    .forEach(v => { variants[v.variantName] = v.data; });

                if (variants.easy && variants.medium && variants.hard) {
                    // Medium and hard should have higher XP than easy
                    expect(variants.medium.xpReward).toBeGreaterThanOrEqual(variants.easy.xpReward);
                    expect(variants.hard.xpReward).toBeGreaterThan(variants.medium.xpReward);
                }
            });

            it(`${baseLevel} hard variant should have stricter or equal maxGates`, () => {
                const variants = {};
                allVariants
                    .filter(v => v.baseLevel === baseLevel)
                    .forEach(v => { variants[v.variantName] = v.data; });

                if (variants.easy && variants.hard) {
                    // Only compare maxGates if the problem AND tools are identical
                    const sameTruthTable = JSON.stringify(variants.easy.targetTruthTable) === JSON.stringify(variants.hard.targetTruthTable);
                    const sameSequence = JSON.stringify(variants.easy.targetSequence) === JSON.stringify(variants.hard.targetSequence);
                    const sameGates = JSON.stringify(variants.easy.availableGates.sort()) === JSON.stringify(variants.hard.availableGates.sort());

                    if (sameTruthTable && sameSequence && sameGates &&
                        variants.easy.maxGates !== undefined && variants.hard.maxGates !== undefined) {
                        expect(variants.hard.maxGates).toBeLessThanOrEqual(variants.easy.maxGates);
                    }
                }
            });
        });
    });

    describe('ID consistency', () => {
        allVariants.forEach(({ id, baseLevel, variantName, data }) => {
            it(`${id} id should match expected pattern`, () => {
                const expectedId = `${baseLevel}_${variantName}`;
                expect(data.id).toBe(expectedId);
            });
        });
    });

    describe('Tier consistency within level variants', () => {
        Object.entries(levelGroups).forEach(([baseLevel]) => {
            it(`${baseLevel} all variants should have same tier`, () => {
                const tiers = allVariants
                    .filter(v => v.baseLevel === baseLevel)
                    .map(v => v.data.tier);
                
                const uniqueTiers = [...new Set(tiers)];
                expect(uniqueTiers.length, `${baseLevel} variants have inconsistent tiers: ${tiers.join(', ')}`).toBe(1);
            });
        });
    });
});

describe('Gate Curriculum Progression Validation', () => {
    
    // Gates available at each level INCLUDING the gate being taught at that level
    const gatesAvailableAtLevel = {
        'level_00': [],
        'level_01': [],
        'level_02': ['transistor'],
        'level_03': ['transistor', 'not'],
        'level_04': ['transistor', 'not', 'and'],
        'level_05': ['transistor', 'not', 'and', 'or'],
        'level_06': ['transistor', 'not', 'and', 'or', 'nand'],
        'level_07': ['transistor', 'not', 'and', 'or', 'nand', 'nor'],
        'level_08': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor'],
        'level_09': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor'],
        'level_10': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1'],
        'level_11': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1'],
        'level_12': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1'],
        'level_13': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1'],
        'level_14': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch'],
        'level_15': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch', 'dFlipFlop'],
        'level_16': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch', 'dFlipFlop'],
        'level_17': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch', 'dFlipFlop'],
        'level_18': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch', 'dFlipFlop'],
        'level_19': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch', 'dFlipFlop', 'fullAdder'],
        'level_boss': ['transistor', 'not', 'and', 'or', 'nand', 'nor', 'xor', 'mux2to1', 'srLatch', 'dFlipFlop', 'fullAdder']
    };

    const alwaysAllowedGates = ['input', 'output', 'clock', 'wire'];

    describe('Levels do not use gates from future levels', () => {
        allVariants.forEach(({ id, baseLevel, data }) => {
            it(`${id} should not use gates from future levels`, () => {
                const allowedGates = gatesAvailableAtLevel[baseLevel] || [];
                const allAllowed = [...allowedGates, ...alwaysAllowedGates].map(g => g.toLowerCase());
                
                const violations = [];
                data.availableGates.forEach(gateId => {
                    const lowerId = gateId.toLowerCase();
                    if (!allAllowed.includes(lowerId)) {
                        violations.push(gateId);
                    }
                });
                
                expect(
                    violations.length,
                    `${id} uses gates from future levels: [${violations.join(', ')}]. ` +
                    `Allowed at ${baseLevel}: [${allowedGates.join(', ')}]`
                ).toBe(0);
            });
        });
    });

    describe('Easy variants should include all previous operators', () => {
        Object.entries(gatesAvailableAtLevel).forEach(([baseLevel, expectedGates]) => {
            if (expectedGates.length === 0) return;
            
            it(`${baseLevel}_easy should have cumulative gate access`, () => {
                const easyVariant = allVariants.find(v => v.baseLevel === baseLevel && v.variantName === 'easy');
                if (easyVariant) {
                    const availableGatesLower = easyVariant.data.availableGates.map(g => g.toLowerCase());
                    
                    expectedGates.forEach(gate => {
                        expect(
                            availableGatesLower.includes(gate.toLowerCase()),
                            `${baseLevel}_easy missing cumulative gate: ${gate}`
                        ).toBe(true);
                    });
                }
            });
        });
    });
});
