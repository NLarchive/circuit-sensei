const fs = require('fs');
const path = require('path');

const searchTerm = 'maxGates';
const rootDir = 'd:\\teach\\circuits-logical-gates\\src';

function searchInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchInDir(fullPath);
        } else {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes(searchTerm)) {
                    console.log(`Found "${searchTerm}" in ${fullPath}`);
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.includes(searchTerm)) {
                            console.log(`  L${index + 1}: ${line.trim()}`);
                        }
                    });
                }
            } catch (e) {
            }
        }
    }
}

searchInDir(rootDir);
