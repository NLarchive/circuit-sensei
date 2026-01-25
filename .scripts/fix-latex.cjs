const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error(`Error parsing ${filePath}: ${e.message}`);
        // If it's broken, we might need a regex fix first, but let's see.
        return;
    }

    const walkAndReplace = (obj) => {
        if (typeof obj === 'string') {
            let original = obj;
            // 1. Normalize unicode bars to standard LaTeX
            // \u0100 is Ā
            obj = obj.replace(/\u0100/g, '\\bar{A}');
            // B with combining macron \u0304 or already composed B̄
            obj = obj.replace(/B\u0304/g, '\\bar{B}');
            obj = obj.replace(/B̄/g, '\\bar{B}');

            // 2. Fix the accidental word replacements if they exist (e.g. \bar{B}oolean)
            // This handles cases where \bar{B} is immediately followed by lowercase letters (not part of a LaTeX command)
            // But wait, in JSON it's stored as \bar{B}, which in a JS string is \bar{B}.
            obj = obj.replace(/\\bar\{B\}([a-z]+)/g, 'B$1');
            
            // 3. Fix missing spaces in LaTeX
            obj = obj.replace(/\\(cdot|oplus|bar|overline)([a-zA-Z])/g, (match, cmd, letter) => {
                // If it's a word like 'overlineA', make it 'overline A'
                // Except if it's already a known command (none of ours are like that)
                return `\\${cmd} ${letter}`;
            });

            // 4. Specific common words that might have been hit
            obj = obj.replace(/\\bar\{B\}uilding/g, 'Building');
            obj = obj.replace(/\\bar\{B\}uild/g, 'Build');
            obj = obj.replace(/\\bar\{B\}y/g, 'By');
            obj = obj.replace(/\\bar\{B\}ut/g, 'But');
            obj = obj.replace(/\\bar\{B\}ig/g, 'Big');

            return obj;
        } else if (Array.isArray(obj)) {
            return obj.map(walkAndReplace);
        } else if (obj !== null && typeof obj === 'object') {
            const newObj = {};
            for (const key in obj) {
                newObj[key] = walkAndReplace(obj[key]);
            }
            return newObj;
        }
        return obj;
    };

    const newData = walkAndReplace(data);
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`Processed ${filePath}`);
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walkDir(fullPath);
            }
        } else if (file.endsWith('.json')) {
            processFile(fullPath);
        }
    });
}

walkDir(path.join(process.cwd(), 'story'));
