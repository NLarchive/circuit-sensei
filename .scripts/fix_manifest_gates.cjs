const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../story/levels-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const gatesAvailableAtLevel = {
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

let modifiedCount = 0;

manifest.levels.forEach(level => {
    if (gatesAvailableAtLevel[level.id]) {
        if (!level.variants) level.variants = {};
        if (!level.variants.easy) level.variants.easy = {};
        
        // Update easy variant with cumulative gates
        level.variants.easy.availableGates = gatesAvailableAtLevel[level.id];
        modifiedCount++;
    }
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Updated ${modifiedCount} levels with cumulative gates for Easy variants.`);
