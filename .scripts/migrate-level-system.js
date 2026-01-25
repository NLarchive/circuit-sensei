#!/usr/bin/env node
/**
 * Level System Migration Script
 * 
 * Migrates from the current monolithic levels-manifest.json to a clean
 * separation of concerns:
 * 
 * NEW STRUCTURE:
 * story/
 * ├── levels-index.json          # Lightweight index with references
 * ├── level-theory/              # Educational content (1 file per base level)
 * │   ├── level_00.json          # Course Overview theory
 * │   ├── level_01.json          # Wire theory
 * │   └── ...
 * ├── level-puzzles/             # Game challenges (1 file per variant)
 * │   ├── level_01_easy.json
 * │   ├── level_01_medium.json
 * │   ├── level_01_hard.json
 * │   └── ...
 * ├── level-media/               # Future: music, backgrounds per level
 * ├── glossary.json              # Unchanged
 * ├── formulas.json              # Unchanged
 * └── tiers.json                 # Unchanged
 * 
 * NAMING CONVENTION:
 * - Theory files: level_XX.json (base level ID)
 * - Puzzle files: level_XX_VARIANT.json (easy/medium/hard)
 * - Index: levels-index.json (lightweight manifest)
 * 
 * SEPARATION OF CONCERNS:
 * - Theory: introText, storyText, physicsDetails, physicsVisual, courseOverview, tierOverview, levelGuide, difficultyProgression
 * - Puzzle: targetTruthTable, targetSequence, availableGates, inputs, maxGates, xpReward, hint (variant-specific)
 * - Index: id, tier, title, objective, description, theoryFile, puzzleFiles
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STORY_DIR = join(__dirname, '..', 'story');

// Fields that belong to THEORY (educational content - constant across variants)
const THEORY_FIELDS = [
    'introText',
    'storyText',
    'physicsVisual',
    'physicsDetails',
    'courseOverview',
    'tierOverview',
    'levelGuide',
    'difficultyProgression'
];

// Fields that belong to PUZZLE (gameplay - variant-specific)
const PUZZLE_FIELDS = [
    'availableGates',
    'inputs',
    'targetTruthTable',
    'targetSequence',
    'maxGates',
    'xpReward',
    'hint'
];

// Fields that belong to INDEX (metadata - references)
const INDEX_FIELDS = [
    'id',
    'tier',
    'title',
    'objective',
    'description',
    'isIndex'
];

/**
 * Extract theory content from a level
 */
function extractTheory(level) {
    const theory = {
        id: level.id,
        tier: level.tier,
        title: level.title
    };
    
    for (const field of THEORY_FIELDS) {
        if (level[field] !== undefined) {
            theory[field] = level[field];
        }
    }
    
    return theory;
}

/**
 * Extract puzzle content from a level (or variant override)
 */
function extractPuzzle(baseLevel, variantName, variantOverride = null) {
    const puzzle = {
        id: variantOverride ? `${baseLevel.id}_${variantName}` : baseLevel.id,
        baseId: baseLevel.id,
        variant: variantName || 'base'
    };
    
    // Start with base level puzzle fields
    for (const field of PUZZLE_FIELDS) {
        if (baseLevel[field] !== undefined) {
            puzzle[field] = baseLevel[field];
        }
    }
    
    // Override with variant-specific fields
    if (variantOverride) {
        // Copy variant-specific overrides
        for (const field of PUZZLE_FIELDS) {
            if (variantOverride[field] !== undefined) {
                puzzle[field] = variantOverride[field];
            }
        }
        
        // Also allow variant to override title, objective, description, hint
        if (variantOverride.title) puzzle.title = variantOverride.title;
        if (variantOverride.objective) puzzle.objective = variantOverride.objective;
        if (variantOverride.description) puzzle.description = variantOverride.description;
        if (variantOverride.hint) puzzle.hint = variantOverride.hint;
        if (variantOverride.physicsVisual) puzzle.physicsVisual = variantOverride.physicsVisual;
    }
    
    return puzzle;
}

/**
 * Extract index entry from a level
 */
function extractIndexEntry(level) {
    const entry = {};
    
    for (const field of INDEX_FIELDS) {
        if (level[field] !== undefined) {
            entry[field] = level[field];
        }
    }
    
    // Add file references
    entry.theoryFile = `level-theory/${level.id}.json`;
    
    // Determine available variants
    if (level.variants) {
        entry.puzzleFiles = {};
        for (const variantName of Object.keys(level.variants)) {
            entry.puzzleFiles[variantName] = `level-puzzles/${level.id}_${variantName}.json`;
        }
    } else if (level.isIndex) {
        // Index level (level_00) has no puzzles
        entry.puzzleFiles = null;
    } else {
        // Base level without variants gets a single puzzle file
        entry.puzzleFiles = {
            base: `level-puzzles/${level.id}.json`
        };
    }
    
    return entry;
}

/**
 * Main migration function
 */
function migrate(dryRun = false) {
    console.log('='.repeat(60));
    console.log('LEVEL SYSTEM MIGRATION');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no files written)' : 'LIVE'}`);
    console.log('='.repeat(60));
    
    // Load current manifest
    const manifestPath = join(STORY_DIR, 'levels-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    console.log(`\nLoaded manifest: ${manifest.levels.length} levels`);
    
    // Create output directories
    const theoryDir = join(STORY_DIR, 'level-theory');
    const puzzlesDir = join(STORY_DIR, 'level-puzzles');
    const mediaDir = join(STORY_DIR, 'level-media');
    
    if (!dryRun) {
        if (!existsSync(theoryDir)) mkdirSync(theoryDir, { recursive: true });
        if (!existsSync(puzzlesDir)) mkdirSync(puzzlesDir, { recursive: true });
        if (!existsSync(mediaDir)) mkdirSync(mediaDir, { recursive: true });
        console.log('\nCreated directories:');
        console.log(`  - ${theoryDir}`);
        console.log(`  - ${puzzlesDir}`);
        console.log(`  - ${mediaDir}`);
    }
    
    // Process each level
    const indexEntries = [];
    const stats = {
        theoryFiles: 0,
        puzzleFiles: 0,
        indexEntries: 0
    };
    
    for (const level of manifest.levels) {
        console.log(`\nProcessing: ${level.id} - ${level.title}`);
        
        // 1. Extract and write theory file
        const theory = extractTheory(level);
        const theoryPath = join(theoryDir, `${level.id}.json`);
        
        if (!dryRun) {
            writeFileSync(theoryPath, JSON.stringify(theory, null, 2));
        }
        console.log(`  ✓ Theory: ${level.id}.json (${Object.keys(theory).length} fields)`);
        stats.theoryFiles++;
        
        // 2. Extract and write puzzle files
        if (level.variants) {
            // Level has variants (easy, medium, hard)
            for (const [variantName, variantOverride] of Object.entries(level.variants)) {
                const puzzle = extractPuzzle(level, variantName, variantOverride);
                const puzzlePath = join(puzzlesDir, `${level.id}_${variantName}.json`);
                
                if (!dryRun) {
                    writeFileSync(puzzlePath, JSON.stringify(puzzle, null, 2));
                }
                console.log(`  ✓ Puzzle: ${level.id}_${variantName}.json (${puzzle.inputs || 0} inputs, ${puzzle.xpReward || 0} XP)`);
                stats.puzzleFiles++;
            }
        } else if (!level.isIndex) {
            // Base level without variants
            const puzzle = extractPuzzle(level, null, null);
            const puzzlePath = join(puzzlesDir, `${level.id}.json`);
            
            if (!dryRun) {
                writeFileSync(puzzlePath, JSON.stringify(puzzle, null, 2));
            }
            console.log(`  ✓ Puzzle: ${level.id}.json (base)`);
            stats.puzzleFiles++;
        } else {
            console.log(`  - No puzzle (index level)`);
        }
        
        // 3. Extract index entry
        const indexEntry = extractIndexEntry(level);
        indexEntries.push(indexEntry);
        stats.indexEntries++;
    }
    
    // Write the new lightweight index
    const newIndex = {
        $schema: './levels-index.schema.json',
        version: '2.0.0',
        description: 'Logic Architect level index with separated theory and puzzle content',
        generatedAt: new Date().toISOString(),
        totalLevels: indexEntries.filter(e => !e.isIndex).length,
        structure: {
            theoryFolder: 'level-theory/',
            puzzlesFolder: 'level-puzzles/',
            mediaFolder: 'level-media/'
        },
        levels: indexEntries
    };
    
    const indexPath = join(STORY_DIR, 'levels-index.json');
    if (!dryRun) {
        writeFileSync(indexPath, JSON.stringify(newIndex, null, 2));
    }
    console.log(`\n✓ Index: levels-index.json (${stats.indexEntries} entries)`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Theory files:  ${stats.theoryFiles}`);
    console.log(`Puzzle files:  ${stats.puzzleFiles}`);
    console.log(`Index entries: ${stats.indexEntries}`);
    console.log(`Total files:   ${stats.theoryFiles + stats.puzzleFiles + 1}`);
    
    if (dryRun) {
        console.log('\n⚠️  DRY RUN - No files were actually written.');
        console.log('Run with --live to perform the migration.');
    } else {
        console.log('\n✅ Migration complete!');
        console.log('\nNext steps:');
        console.log('1. Update StoryLoader.js to use new structure');
        console.log('2. Run tests to verify functionality');
        console.log('3. Delete old levels-manifest.json (backup first)');
    }
    
    return { newIndex, stats };
}

// CLI
const args = process.argv.slice(2);
const dryRun = !args.includes('--live');

migrate(dryRun);
