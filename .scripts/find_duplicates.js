import fs from 'node:fs';
import path from 'node:path';

const puzzlesDir = path.join(process.cwd(), 'story', 'level-puzzles');

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function readPuzzleFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Puzzle directory not found: ${dir}`);
  }
  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
}

function signatureForPuzzle(puzzle) {
  const behavior = puzzle.targetTruthTable ?? puzzle.targetSequence ?? null;
  return stableStringify({
    availableGates: puzzle.availableGates ?? [],
    inputs: puzzle.inputs ?? null,
    outputs: puzzle.outputs ?? null,
    maxGates: puzzle.maxGates ?? null,
    behavior,
  });
}

function findDuplicates(files) {
  const bySignature = new Map();

  for (const fileName of files) {
    const filePath = path.join(puzzlesDir, fileName);
    const puzzle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const signature = signatureForPuzzle(puzzle);

    if (!bySignature.has(signature)) {
      bySignature.set(signature, []);
    }
    bySignature.get(signature).push(fileName);
  }

  return [...bySignature.values()].filter((group) => group.length > 1);
}

try {
  const files = readPuzzleFiles(puzzlesDir);
  const duplicateGroups = findDuplicates(files);

  if (duplicateGroups.length === 0) {
    console.log('No duplicate puzzle definitions found.');
    process.exit(0);
  }

  console.log(`Found ${duplicateGroups.length} duplicate group(s):`);
  duplicateGroups.forEach((group, index) => {
    console.log(`${index + 1}. ${group.join(' | ')}`);
  });

  process.exit(1);
} catch (error) {
  console.error('Duplicate scan failed:', error.message);
  process.exit(2);
}
