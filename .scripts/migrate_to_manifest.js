/**
 * migrate_to_manifest.js
 * 
 * Migrates existing story/levels/*.json and story/levels-games/*.json
 * into a unified manifest file with inheritance.
 * 
 * Usage:
 *   node .scripts/migrate_to_manifest.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   Show what would be done without writing files
 *   --verbose   Show detailed diff information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const LEVELS_DIR = path.join(ROOT, 'story', 'levels');
const VARIANTS_DIR = path.join(ROOT, 'story', 'levels-games');
const MANIFEST_OUTPUT = path.join(ROOT, 'story', 'levels-manifest.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

/**
 * Deep equality check for objects/arrays
 */
function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => deepEqual(v, b[i]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(k => deepEqual(a[k], b[k]));
}

/**
 * Load JSON file safely
 */
function loadJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

/**
 * Get list of base level IDs from story/levels
 */
function getBaseLevelIds() {
    const files = fs.readdirSync(LEVELS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort((a, b) => {
            // Sort level_00 first, then level_01, ..., level_boss last
            if (a === 'level_boss') return 1;
            if (b === 'level_boss') return -1;
            const numA = parseInt(a.replace('level_', ''), 10);
            const numB = parseInt(b.replace('level_', ''), 10);
            return numA - numB;
        });
    return files;
}

/**
 * Get variants for a base level from levels-games
 */
function getVariantsForLevel(baseLevelId) {
    const variants = {};
    const variantTypes = ['easy', 'medium', 'hard'];
    
    for (const vtype of variantTypes) {
        const filePath = path.join(VARIANTS_DIR, `${baseLevelId}_${vtype}.json`);
        const data = loadJSON(filePath);
        if (data) {
            variants[vtype] = data;
        }
    }
    
    return variants;
}

/**
 * Fields that are typically educational/inherited (not overridden per variant)
 */
const INHERITED_FIELDS = [
    'tier', 'title', 'objective', 'description', 'introText', 'hint',
    'physicsVisual', 'storyText', 'physicsDetails', 'isIndex',
    'courseOverview', 'tierOverview'
];

/**
 * Fields that are typically variant-specific (game constraints)
 */
const VARIANT_FIELDS = [
    'id', 'availableGates', 'inputs', 'targetTruthTable', 'maxGates', 'xpReward'
];

/**
 * Compute the minimal override needed for a variant
 * Returns only fields that differ from the base level
 */
function computeVariantOverride(baseLevel, variant) {
    const override = {};
    
    for (const field of Object.keys(variant)) {
        // Skip the id field - we compute it from base + variant type
        if (field === 'id') continue;
        
        const baseValue = baseLevel[field];
        const variantValue = variant[field];
        
        // If the variant has a value that differs from base, include it
        if (!deepEqual(baseValue, variantValue)) {
            override[field] = variantValue;
        }
    }
    
    return override;
}

/**
 * Build the manifest from existing files
 */
function buildManifest() {
    const baseLevelIds = getBaseLevelIds();
    console.log(`Found ${baseLevelIds.length} base levels`);
    
    const manifest = {
        "$schema": "./levels-manifest.schema.json",
        "version": "1.0.0",
        "description": "Logic Architect level manifest with variant inheritance",
        "generatedAt": new Date().toISOString(),
        "levels": []
    };
    
    let totalVariants = 0;
    let fieldsDeduped = 0;
    
    for (const levelId of baseLevelIds) {
        const baseLevel = loadJSON(path.join(LEVELS_DIR, `${levelId}.json`));
        if (!baseLevel) {
            console.warn(`  Warning: Could not load base level ${levelId}`);
            continue;
        }
        
        const variants = getVariantsForLevel(levelId);
        const variantCount = Object.keys(variants).length;
        totalVariants += variantCount;
        
        // Create the manifest entry - start with all base fields
        const entry = { ...baseLevel };
        
        // Remove the 'id' field from root since it's implicit from position
        // Actually, keep it for clarity
        
        // Add variants if any exist
        if (variantCount > 0) {
            entry.variants = {};
            
            for (const [vtype, vdata] of Object.entries(variants)) {
                const override = computeVariantOverride(baseLevel, vdata);
                
                if (Object.keys(override).length > 0) {
                    entry.variants[vtype] = override;
                    
                    if (VERBOSE) {
                        console.log(`  ${levelId}_${vtype}: ${Object.keys(override).length} overrides`);
                        for (const [k, v] of Object.entries(override)) {
                            if (typeof v === 'object') {
                                console.log(`    - ${k}: [object]`);
                            } else {
                                console.log(`    - ${k}: ${JSON.stringify(v).slice(0, 50)}`);
                            }
                        }
                    }
                } else {
                    // Empty override - variant is identical to base
                    entry.variants[vtype] = {};
                    console.log(`  ${levelId}_${vtype}: identical to base (no overrides needed)`);
                }
                
                // Count fields we're NOT duplicating
                const originalFieldCount = Object.keys(vdata).length;
                const overrideFieldCount = Object.keys(override).length;
                fieldsDeduped += (originalFieldCount - overrideFieldCount);
            }
        }
        
        manifest.levels.push(entry);
        console.log(`  Processed ${levelId} with ${variantCount} variants`);
    }
    
    console.log(`\nSummary:`);
    console.log(`  - ${baseLevelIds.length} base levels`);
    console.log(`  - ${totalVariants} total variants`);
    console.log(`  - ${fieldsDeduped} fields deduplicated via inheritance`);
    
    return manifest;
}

/**
 * Main
 */
function main() {
    console.log('=== Level Manifest Migration ===');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLY'}`);
    console.log('');
    
    const manifest = buildManifest();
    
    const outputJson = JSON.stringify(manifest, null, 2);
    const outputSize = Buffer.byteLength(outputJson, 'utf8');
    
    console.log(`\nOutput size: ${(outputSize / 1024).toFixed(2)} KB`);
    
    if (DRY_RUN) {
        console.log('\n[DRY RUN] Would write manifest to:', MANIFEST_OUTPUT);
        console.log('[DRY RUN] No files modified.');
    } else {
        fs.writeFileSync(MANIFEST_OUTPUT, outputJson, 'utf8');
        console.log(`\nManifest written to: ${MANIFEST_OUTPUT}`);
    }
}

main();
