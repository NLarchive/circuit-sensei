/**
 * generate_variants.js
 * 
 * Generates per-variant JSON files from the manifest with inheritance.
 * This allows the runtime to load flat files while maintaining
 * a single source of truth in the manifest.
 * 
 * Usage:
 *   node .scripts/generate_variants.js [--dry-run] [--clean] [--output <dir>]
 * 
 * Options:
 *   --dry-run       Show what would be done without writing files
 *   --clean         Remove existing generated files before generating
 *   --output <dir>  Output directory (default: story/levels-games)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MANIFEST_PATH = path.join(ROOT, 'story', 'levels-manifest.json');
const DEFAULT_OUTPUT = path.join(ROOT, 'story', 'levels-games');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CLEAN = args.includes('--clean');

// Get output directory from --output flag or use default
const outputIndex = args.indexOf('--output');
const OUTPUT_DIR = outputIndex !== -1 && args[outputIndex + 1] 
    ? path.resolve(args[outputIndex + 1])
    : DEFAULT_OUTPUT;

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 */
function deepMerge(base, override) {
    if (override === undefined) return base;
    if (override === null) return null;
    if (typeof override !== 'object') return override;
    if (Array.isArray(override)) return [...override];
    
    const result = { ...base };
    for (const [key, value] of Object.entries(override)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && base[key] && typeof base[key] === 'object') {
            result[key] = deepMerge(base[key], value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Generate a variant file from base level + override
 */
function generateVariant(baseLevel, variantName, override) {
    // Start with base level
    const variant = { ...baseLevel };
    
    // Remove variants object from output
    delete variant.variants;
    
    // Apply overrides
    const merged = deepMerge(variant, override);
    
    // Set the ID to include variant suffix
    merged.id = `${baseLevel.id}_${variantName}`;
    
    return merged;
}

/**
 * Generate all variant files from manifest
 */
function generateAllVariants(manifest) {
    const generated = [];
    
    for (const level of manifest.levels) {
        if (!level.variants || Object.keys(level.variants).length === 0) {
            // Level has no variants, generate a base level_XX.json for games folder
            // Actually, skip levels without variants (like level_00)
            console.log(`  Skipping ${level.id} (no variants)`);
            continue;
        }
        
        for (const [variantName, override] of Object.entries(level.variants)) {
            const variantData = generateVariant(level, variantName, override);
            const fileName = `${level.id}_${variantName}.json`;
            
            generated.push({
                fileName,
                data: variantData,
                baseId: level.id,
                variant: variantName
            });
            
            console.log(`  Generated ${fileName}`);
        }
    }
    
    return generated;
}

/**
 * Clean existing generated files
 */
function cleanOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) return;
    
    const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith('.json') && f.includes('_'));
    
    console.log(`Cleaning ${files.length} existing files...`);
    
    for (const file of files) {
        const filePath = path.join(OUTPUT_DIR, file);
        if (!DRY_RUN) {
            fs.unlinkSync(filePath);
        }
        console.log(`  Removed ${file}`);
    }
}

/**
 * Write generated files
 */
function writeGeneratedFiles(generated) {
    if (!fs.existsSync(OUTPUT_DIR)) {
        if (!DRY_RUN) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    }
    
    for (const { fileName, data } of generated) {
        const filePath = path.join(OUTPUT_DIR, fileName);
        // Add schema reference to each generated file
        const dataWithSchema = {
            $schema: './level-game.schema.json',
            ...data
        };
        const content = JSON.stringify(dataWithSchema, null, 2);
        
        if (!DRY_RUN) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
    
    console.log(`Wrote ${generated.length} files to ${OUTPUT_DIR}`);
}

/**
 * Generate difficulty index from generated variants
 */
function generateDifficultyIndex(generated) {
    const difficulties = {
        easy: { count: 0, totalXP: 0, levels: [] },
        medium: { count: 0, totalXP: 0, levels: [] },
        hard: { count: 0, totalXP: 0, levels: [] }
    };
    
    for (const { fileName, data, baseId, variant } of generated) {
        if (!difficulties[variant]) continue;
        
        const summary = {
            id: data.id,
            baseId: baseId,
            tier: data.tier,
            title: data.title,
            inputs: data.inputs || 0,
            maxGates: data.maxGates || 0,
            xpReward: data.xpReward || 0,
            gateCount: (data.availableGates || []).length,
            file: fileName
        };
        
        difficulties[variant].levels.push(summary);
        difficulties[variant].count++;
        difficulties[variant].totalXP += (data.xpReward || 0);
    }
    
    // Sort levels by baseId
    for (const diff of Object.values(difficulties)) {
        diff.levels.sort((a, b) => a.baseId.localeCompare(b.baseId));
    }
    
    return {
        $schema: './levels-difficulty-index.schema.json',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        totalLevels: generated.length / 3,
        difficulties
    };
}

/**
 * Write difficulty index file
 */
function writeDifficultyIndex(index) {
    const indexPath = path.join(ROOT, 'story', 'levels-difficulty-index.json');
    const content = JSON.stringify(index, null, 2);
    
    if (!DRY_RUN) {
        fs.writeFileSync(indexPath, content, 'utf8');
    }
    
    console.log(`Generated difficulty index: story/levels-difficulty-index.json`);
    console.log(`  Easy:   ${index.difficulties.easy.count} levels, ${index.difficulties.easy.totalXP} XP`);
    console.log(`  Medium: ${index.difficulties.medium.count} levels, ${index.difficulties.medium.totalXP} XP`);
    console.log(`  Hard:   ${index.difficulties.hard.count} levels, ${index.difficulties.hard.totalXP} XP`);
}

/**
 * Validate manifest structure
 */
function validateManifest(manifest) {
    const errors = [];
    
    if (!manifest.version) {
        errors.push('Missing manifest version');
    }
    
    if (!Array.isArray(manifest.levels)) {
        errors.push('levels must be an array');
        return errors;
    }
    
    for (const level of manifest.levels) {
        if (!level.id) {
            errors.push('Level missing id');
            continue;
        }
        
        if (!level.tier) {
            errors.push(`${level.id}: missing tier`);
        }
        
        if (!level.title) {
            errors.push(`${level.id}: missing title`);
        }
        
        // Validate variants
        if (level.variants) {
            for (const [vname, vdata] of Object.entries(level.variants)) {
                if (!['easy', 'medium', 'hard'].includes(vname)) {
                    errors.push(`${level.id}: unknown variant '${vname}'`);
                }
            }
        }
    }
    
    return errors;
}

/**
 * Main
 */
function main() {
    console.log('=== Variant Generator ===');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLY'}`);
    console.log(`Output: ${OUTPUT_DIR}`);
    console.log('');
    
    // Load manifest
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error(`Manifest not found: ${MANIFEST_PATH}`);
        console.error('Run migrate_to_manifest.js first.');
        process.exit(1);
    }
    
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    console.log(`Loaded manifest v${manifest.version}`);
    console.log(`  ${manifest.levels.length} levels`);
    console.log('');
    
    // Validate
    const errors = validateManifest(manifest);
    if (errors.length > 0) {
        console.error('Manifest validation errors:');
        errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }
    
    // Clean if requested
    if (CLEAN) {
        cleanOutputDir();
        console.log('');
    }
    
    // Generate
    console.log('Generating variants...');
    const generated = generateAllVariants(manifest);
    console.log('');
    
    // Write
    writeGeneratedFiles(generated);
    
    // Generate difficulty index
    console.log('');
    const diffIndex = generateDifficultyIndex(generated);
    writeDifficultyIndex(diffIndex);
    
    console.log('');
    console.log(`Done! Generated ${generated.length} variant files + difficulty index.`);
    
    if (DRY_RUN) {
        console.log('[DRY RUN] No files were actually written.');
    }
}

main();
