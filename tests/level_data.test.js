import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Level Data Integrity', () => {
    // Load levels from manifest instead of individual files
    const manifestPath = path.resolve(__dirname, '../story/levels-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Filter out level_00 (index) and get all other levels
    const levels = manifest.levels.filter(l => l.id !== 'level_00');
    
    const tiers = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../story/tiers.json'), 'utf8'));
    const gates = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/gates.json'), 'utf8'));
    
    const validVisuals = [
        'electron_flow', 'electron_flow_detailed', 'electric_field', 'series_circuit', 
        'parallel_circuit', 'vacuum_tube', 'npn_transistor', 'semiconductor_doping', 
        'nand_universal', 'xor_gate', 'half_adder', 'full_adder', 'multiplexer', 
        'sr_latch', 'alu', 'de_morgan', 'decoder', 't_flipflop', 'counter_2bit', 
        'traffic_light', 'cpu_datapath', 'cmos_inverter', 'nand_to_not', 'dff_timing',
        'counter_detailed', 'fsm_traffic', 'drift_velocity_animation', 'drift_velocity'
    ];

    const gateCatalogIds = Object.keys(gates).map(id => id.toLowerCase());

    const isValidVisualKey = (v) => {
        if (!v) return false;
        const key = String(v);
        const baseV = key.replace('_detailed', '');
        return validVisuals.includes(key) || validVisuals.includes(baseV);
    };

    const validateVisualEntry = (entry, ctx) => {
        if (!entry) return;
        if (typeof entry === 'string') {
            expect(isValidVisualKey(entry), `Invalid visual ${entry} in ${ctx}`).toBe(true);
            return;
        }
        if (typeof entry === 'object') {
            const type = entry.type || entry.visual || entry.physicsVisual;
            expect(type, `Missing visual type in ${ctx}`).toBeTruthy();
            expect(isValidVisualKey(type), `Invalid visual ${type} in ${ctx}`).toBe(true);
            return;
        }
        throw new Error(`Invalid visual entry type (${typeof entry}) in ${ctx}`);
    };

    levels.forEach(data => {
        const file = `${data.id} (manifest)`;
        it(`should validate ${file}`, () => {
            // Required Fields
            expect(data.id, `Missing id in ${file}`).toBeDefined();
            expect(data.tier, `Missing tier in ${file}`).toBeDefined();
            expect(tiers[data.tier], `Invalid tier ${data.tier} in ${file}`).toBeDefined();
            
            expect(data.title, `Missing title in ${file}`).toBeDefined();
            expect(data.objective, `Missing objective in ${file}`).toBeDefined();
            expect(data.description, `Missing description in ${file}`).toBeDefined();
            expect(data.introText, `Missing introText in ${file}`).toBeDefined();
            
            // Physics Visual (legacy/top-level)
            expect(data.physicsVisual, `Missing physicsVisual in ${file}`).toBeDefined();
            const visuals = Array.isArray(data.physicsVisual) ? data.physicsVisual : [data.physicsVisual];
            visuals.forEach(v => validateVisualEntry(v, `${file}:physicsVisual`));

            // Physics visuals declared inside concept cards (explicit visual placement)
            if (data.physicsDetails && Array.isArray(data.physicsDetails.conceptCards)) {
                data.physicsDetails.conceptCards.forEach((card, idx) => {
                    if (!card || typeof card !== 'object') return;

                    if (card.visual) {
                        validateVisualEntry(card.visual, `${file}:physicsDetails.conceptCards[${idx}].visual`);
                    }
                    if (card.physicsVisual) {
                        validateVisualEntry(card.physicsVisual, `${file}:physicsDetails.conceptCards[${idx}].physicsVisual`);
                    }
                    if (Array.isArray(card.visuals)) {
                        card.visuals.forEach((v, j) => validateVisualEntry(v, `${file}:physicsDetails.conceptCards[${idx}].visuals[${j}]`));
                    }
                });
            }

            // Gates Integration (Case-insensitive)
            if (data.availableGates) {
                data.availableGates.forEach(gateId => {
                    const lowerId = gateId.toLowerCase();
                    const exists = gateCatalogIds.includes(lowerId) || lowerId === 'input' || lowerId === 'output' || lowerId === 'clock' || lowerId === 'transistor';
                    expect(exists, `Gate ${gateId} in ${file} not found in catalog (Catalog has: ${gateCatalogIds.join(', ')})`).toBeTruthy();
                });
            }

            // Truth Table / Sequence Shape
            const validationTarget = data.targetTruthTable || data.targetSequence;
            if (validationTarget) {
                expect(Array.isArray(validationTarget)).toBe(true);
                validationTarget.forEach((entry, idx) => {
                    expect(entry.in, `Entry ${idx} in ${file} missing "in"`).toBeDefined();
                    expect(entry.out, `Entry ${idx} in ${file} missing "out"`).toBeDefined();
                    expect(entry.in.length, `Input mismatch in ${file} at entry ${idx}`).toBe(data.inputs);
                });
            } else if (data.id !== 'level_boss') {
                throw new Error(`Level ${file} has neither targetTruthTable nor targetSequence`);
            }

            // Physics Details (Master's level requirement)
            // Supports BOTH legacy schema (concepts/equations) AND new detailed schema (conceptCards/formulaCards)
            expect(data.physicsDetails, `Missing physicsDetails in ${file}`).toBeDefined();
            const hasLegacySchema = Array.isArray(data.physicsDetails.concepts) && Array.isArray(data.physicsDetails.equations);
            const hasNewSchema = Array.isArray(data.physicsDetails.conceptCards) || Array.isArray(data.physicsDetails.formulaCards);
            expect(hasLegacySchema || hasNewSchema, `physicsDetails must have concepts/equations OR conceptCards/formulaCards in ${file}`).toBe(true);
        });
    });
});