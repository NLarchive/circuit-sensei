/**
 * validate_generated.js
 * 
 * Validates generated variant files against legacy backups.
 * Ensures the manifest + generator produce equivalent output.
 * 
 * Usage:
 *   node .scripts/validate_generated.js [--strict]
 * 
 * Options:
 *   --strict   Fail on any difference (including formatting)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const GENERATED_DIR = path.join(ROOT, 'story', 'levels-games');
const LEGACY_DIR = path.join(ROOT, '_legacy_backup');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');

/**
 * Deep equality check (ignoring key order)
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
    
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    if (keysA.join(',') !== keysB.join(',')) return false;
    
    return keysA.every(k => deepEqual(a[k], b[k]));
}

/**
 * Find differences between two objects
 */
function findDifferences(a, b, path = '') {
    const diffs = [];
    
    if (typeof a !== typeof b) {
        diffs.push({ path, type: 'type_mismatch', aType: typeof a, bType: typeof b });
        return diffs;
    }
    
    if (a === null || b === null) {
        if (a !== b) diffs.push({ path, type: 'null_mismatch', a, b });
        return diffs;
    }
    
    if (typeof a !== 'object') {
        if (a !== b) diffs.push({ path, type: 'value_mismatch', a, b });
        return diffs;
    }
    
    if (Array.isArray(a) !== Array.isArray(b)) {
        diffs.push({ path, type: 'array_mismatch', aIsArray: Array.isArray(a), bIsArray: Array.isArray(b) });
        return diffs;
    }
    
    if (Array.isArray(a)) {
        if (a.length !== b.length) {
            diffs.push({ path, type: 'length_mismatch', aLen: a.length, bLen: b.length });
        }
        const minLen = Math.min(a.length, b.length);
        for (let i = 0; i < minLen; i++) {
            diffs.push(...findDifferences(a[i], b[i], `${path}[${i}]`));
        }
        return diffs;
    }
    
    // Object
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        if (!(key in a)) {
            diffs.push({ path: newPath, type: 'missing_in_a', bValue: b[key] });
        } else if (!(key in b)) {
            diffs.push({ path: newPath, type: 'missing_in_b', aValue: a[key] });
        } else {
            diffs.push(...findDifferences(a[key], b[key], newPath));
        }
    }
    
    return diffs;
}

/**
 * Main
 */
function main() {
    console.log('=== Validating Generated Files ===');
    console.log(`Generated: ${GENERATED_DIR}`);
    console.log(`Legacy:    ${LEGACY_DIR}`);
    console.log('');
    
    if (!fs.existsSync(LEGACY_DIR)) {
        console.error('Legacy backup directory not found.');
        console.error('Run the migration first to create _legacy_backup/');
        process.exit(1);
    }
    
    const generatedFiles = fs.readdirSync(GENERATED_DIR).filter(f => f.endsWith('.json'));
    const legacyFiles = fs.readdirSync(LEGACY_DIR).filter(f => f.endsWith('.json'));
    
    console.log(`Generated files: ${generatedFiles.length}`);
    console.log(`Legacy files:    ${legacyFiles.length}`);
    console.log('');
    
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const failures = [];
    
    // Check each generated file against legacy
    for (const file of generatedFiles) {
        if (!legacyFiles.includes(file)) {
            console.log(`  ⚠️  ${file}: no legacy file (new)`);
            skipped++;
            continue;
        }
        
        const genPath = path.join(GENERATED_DIR, file);
        const legPath = path.join(LEGACY_DIR, file);
        
        const genData = JSON.parse(fs.readFileSync(genPath, 'utf8'));
        const legData = JSON.parse(fs.readFileSync(legPath, 'utf8'));
        
        if (deepEqual(genData, legData)) {
            console.log(`  ✅ ${file}: identical`);
            passed++;
        } else {
            const diffs = findDifferences(legData, genData);
            console.log(`  ❌ ${file}: ${diffs.length} differences`);
            
            // Show first few differences
            for (const diff of diffs.slice(0, 3)) {
                if (diff.type === 'missing_in_a') {
                    console.log(`      + ${diff.path}: added in generated`);
                } else if (diff.type === 'missing_in_b') {
                    console.log(`      - ${diff.path}: missing in generated`);
                } else if (diff.type === 'value_mismatch') {
                    console.log(`      ~ ${diff.path}: '${diff.a}' → '${diff.b}'`);
                }
            }
            if (diffs.length > 3) {
                console.log(`      ... and ${diffs.length - 3} more`);
            }
            
            failed++;
            failures.push({ file, diffs });
        }
    }
    
    // Check for files only in legacy (not generated)
    for (const file of legacyFiles) {
        if (!generatedFiles.includes(file)) {
            console.log(`  ⚠️  ${file}: only in legacy (removed)`);
            skipped++;
        }
    }
    
    console.log('');
    console.log('=== Summary ===');
    console.log(`  Passed:  ${passed}`);
    console.log(`  Failed:  ${failed}`);
    console.log(`  Skipped: ${skipped}`);
    
    if (failed > 0 && STRICT) {
        console.log('');
        console.error('Validation FAILED in strict mode.');
        process.exit(1);
    } else if (failed > 0) {
        console.log('');
        console.warn('Some files differ but may still be functionally equivalent.');
        console.log('Run with --strict to fail on any difference.');
    } else {
        console.log('');
        console.log('✅ All generated files match legacy!');
    }
}

main();
