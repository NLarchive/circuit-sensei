const fs = require('fs');
const path = require('path');

const targetStrings = ["maxGates", "linkifyTerms", "linkify", "linkify_terms", "linkifyTermsComponent", "showTermPopup", ".term-link", "term-link"];

function searchInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                searchInDir(fullPath);
            }
        } else if (/\.(json|js|jsx|ts|tsx|css|scss|html|md)$/i.test(file)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                targetStrings.forEach(target => {
                    if (line.includes(target)) {
                        console.log(`FOUND "${target}" in ${fullPath} at line ${index + 1}: ${line.trim()}`);
                    }
                });
            });
        }
    }
}

searchInDir(path.join(__dirname, '..'));
