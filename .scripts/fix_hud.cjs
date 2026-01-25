const fs = require('fs');
const path = require('path');

const hudPath = path.join(__dirname, '../src/ui/HUD.js');
let content = fs.readFileSync(hudPath, 'utf8');

function replaceMethod(name, args, newBody) {
    const regex = new RegExp(`${name}\\s*\\(([^)]*)\\)\\s*\\{`);
    const match = content.match(regex);
    if (!match) return;

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
        const fullMethod = content.substring(startIndex, index);
        const newMethod = `${name}(${args}) {\n        ${newBody}\n    }`;
        content = content.replace(fullMethod, newMethod);
    }
}

// Delegate complex visual methods
replaceMethod('getLevelVisualList', 'level', 'return HUDEducation.getLevelVisualList(level);');
replaceMethod('assignVisualsToConceptCards', 'conceptCards, visuals', 'return HUDEducation.assignVisualsToConceptCards(conceptCards, visuals);');
replaceMethod('renderCurriculumOverview', 'level', 'return HUDEducation.renderCurriculumOverview(level);');
replaceMethod('getVisualKeywords', 'type', 'return HUDEducation.getVisualKeywords ? HUDEducation.getVisualKeywords(type) : [];');
replaceMethod('scoreConceptCardForKeywords', 'card, keywords', 'return HUDEducation.scoreConceptCardForKeywords ? HUDEducation.scoreConceptCardForKeywords(card, keywords) : 0;');
replaceMethod('renderWorkedExample', 'example', 'return HUDEducation.renderWorkedExample(example);');
replaceMethod('renderRealWorldDetailed', 'rw', 'return HUDEducation.renderRealWorldDetailed(rw);');

// Delegate huge intro/instructions methods
replaceMethod('showLevelIntro', 'level, index', `
        if (!level) return;
        const tierInfo = gameManager.tiers[level.tier] || {};
        const isFirstInTier = gameManager.levels.findIndex(l => l.tier === level.tier) === index;
        
        document.getElementById('intro-tier-title').innerText = isFirstInTier ? \`New Chapter: \${tierInfo.name}\` : tierInfo.name;
        document.getElementById('intro-level-title').innerText = index === 0 ? level.title : \`Level \${index}: \${level.title}\`;
        
        document.getElementById('intro-visual').style.display = 'none';
        document.getElementById('intro-text').innerHTML = HUDEducation.getIntroductionHtml(level, index, tierInfo, isFirstInTier);
        
        const startBtn = document.getElementById('btn-start-level');
        startBtn.innerText = index === 0 ? 'Go to Level 1 →' : 'Start Level →';
        
        document.getElementById('level-intro-overlay').classList.remove('hidden');
        const introContent = document.querySelector('.intro-content');
        if (introContent) introContent.scrollTop = 0;
`);

replaceMethod('showInstructions', 'level = gameManager.currentLevel', `
        if (!level) return;
        const difficulty = gameManager.currentVariant || 'easy';
        const cleanTitle = level.title.replace(/\\s*\\(.*?\\)$/, '');
        document.getElementById('instruction-title').innerHTML = \`\${cleanTitle} - <span class="difficulty-text difficulty-\${difficulty}">\${difficulty.toUpperCase()} Mode</span>\`;
        document.getElementById('instruction-text').innerHTML = HUDEducation.getInstructionsHtml(level, difficulty);
        document.getElementById('instruction-overlay').classList.remove('hidden');
`);

// Final cleanup: remove redundant local methods if they exist and are not delegated
// Actually replaceMethod already handles it by replacing the whole body.

fs.writeFileSync(hudPath, content);
console.log('HUD.js fixed.');
