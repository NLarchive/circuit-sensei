const fs = require('fs');
const path = require('path');

const hudPath = path.join(__dirname, '../src/ui/HUD.js');
const eduPath = path.join(__dirname, '../src/ui/hud/HUDEducation.js');

let hudContent = fs.readFileSync(hudPath, 'utf8');
let eduContent = fs.readFileSync(eduPath, 'utf8');

function extractMethod(content, name) {
    const regex = new RegExp(`${name}\\s*\\(([^)]*)\\)\\s*\\{`);
    const match = content.match(regex);
    if (!match) return null;

    const startIndex = match.index;
    const bodyStartIndex = content.indexOf('{', startIndex);
    
    let braceCount = 1;
    let index = bodyStartIndex + 1;
    while (braceCount > 0 && index < content.length) {
        if (content[index] === '{') braceCount++;
        else if (content[index] === '}') braceCount--;
        index++;
    }

    if (braceCount === 0) {
        return content.substring(startIndex, index);
    }
    return null;
}

const methodsToMove = [
    'getLevelVisualList',
    'renderCurriculumOverview',
    'assignVisualsToConceptCards',
    'getVisualKeywords',
    'scoreConceptCardForKeywords',
    'renderWorkedExample',
    'renderRealWorldDetailed',
    'getEquationExplanation'
];

methodsToMove.forEach(name => {
    let method = extractMethod(hudContent, name);
    if (method) {
        // Replace 'this.escapeHtml' with 'HUDUtils.escapeHtml'
        method = method.replace(/this\.escapeHtml/g, 'HUDUtils.escapeHtml');
        // Replace 'this.formatEquation' with 'HUDUtils.formatEquation'
        method = method.replace(/this\.formatEquation/g, 'HUDUtils.formatEquation');
        // Replace 'this.generatePhysicsVisual' with 'HUDVisuals.generatePhysicsVisual'
        method = method.replace(/this\.generatePhysicsVisual/g, 'HUDVisuals.generatePhysicsVisual');
        
        // Remove from HUD.js delegating it
        const regex = new RegExp(`${name}\\s*\\(([^)]*)\\)\\s*\\{[\\s\\S]*?\\}`);
        const argsMatch = method.match(new RegExp(`${name}\\s*\\(([^)]*)\\)`));
        const args = argsMatch ? argsMatch[1] : '';
        
        hudContent = hudContent.replace(method, `${name}(${args}) {\n        return HUDEducation.${name}(${args});\n    }`);
        
        // Add to HUDEducation.js (replace dummy or add new)
        const existing = extractMethod(eduContent, name);
        if (existing) {
            eduContent = eduContent.replace(existing, method);
        } else {
            // Insert before the last closing brace
            const lastBrace = eduContent.lastIndexOf('}');
            eduContent = eduContent.substring(0, lastBrace) + '    ' + method + ',\n' + eduContent.substring(lastBrace);
        }
    }
});

// Fix trailing commas in HUDEducation if any
eduContent = eduContent.replace(/,\s*,\s*}/g, ' }').replace(/,\s*}/g, ' }');

fs.writeFileSync(hudPath, hudContent);
fs.writeFileSync(eduPath, eduContent);
console.log('Moved educational methods to HUDEducation.js');
