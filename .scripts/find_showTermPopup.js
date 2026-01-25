const fs = require('fs');
const path = require('path');

const target = 'showTermPopup';

function searchInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') searchInDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes(target)) {
                    console.log(`FOUND in ${fullPath} at line ${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

searchInDir(path.join(__dirname, '..'));
