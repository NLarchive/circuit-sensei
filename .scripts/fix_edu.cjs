const fs = require('fs');
const path = require('path');

const eduPath = path.join(__dirname, '../src/ui/hud/HUDEducation.js');
let edu = fs.readFileSync(eduPath, 'utf8');

// Fix getEquationExplanation
edu = edu.replace(/getEquationExplanation\(eq\) \{[\s\S]*?\}/, `getEquationExplanation(eq) {
        const map = {
            'V=IR': 'Ohm\\'s Law defines the relationship between Voltage (V), Current (I), and Resistance (R).',
            'I=V/R': 'Ohm\\'s Law rearranged to solve for Current.',
            'P=VI': 'Power is the product of Voltage and Current.',
            'Q=it': 'Charge (Q) is proportional to current and time.',
            'E=VQ': 'Energy (E) is the work done moving charge Q through potential V.'
        };
        return map[eq] || "";
    }`);

// Add missing methods if they don't exist
const methodsToAdd = {
    renderExercises: `renderExercises(level) {
        if (!level) return '';
        const prompts = [
            'Before wiring, predict the output(s) for every input combination.',
            'Explain the circuit in one sentence using gate names.'
        ];
        if (level.maxGates > 0 && level.maxGates !== Infinity) prompts.push(\`Try solving using fewer than \${level.maxGates} gates.\`);
        return \`<div class="lesson-card exercises"><h3>✅ Practice Exercises</h3><ol class="exercise-list">\${prompts.map(p => \`<li>\${HUDUtils.escapeHtml(p)}</li>\`).join('')}</ol></div>\`;
    }`,
    getIntroductionHtml: `getIntroductionHtml(level, index, tierInfo, isFirstInTier) {
        const conceptHtml = HUDUtils.formatStoryText(level.introText || level.description || '');
        const storyHtml = level.storyText ? \`<h3>Deep Dive</h3><div class="story-content">\${HUDUtils.formatStoryText(level.storyText)}</div>\` : '';
        const detailsHtml = this.renderPhysicsDetails(level.physicsDetails, level);
        const exercisesHtml = this.renderExercises(level);
        const curriculumHtml = level.id === 'level_00' ? this.renderCurriculumOverview(level) : '';

        return \`<div class="chapter-intro">
            \${isFirstInTier ? \`<p class="chapter-desc">\${HUDUtils.escapeHtml(tierInfo.description || '')}</p><hr>\` : ''}
            \${index === 0 ? curriculumHtml : ''}
            <h3>The Concept</h3>\${conceptHtml}\${detailsHtml}\${exercisesHtml}\${storyHtml}
            <div class="interactive-note"><strong>Objective:</strong> \${HUDUtils.escapeHtml(level.objective || 'Complete the circuit.')}</div>
        </div>\`;
    }`,
    getInstructionsHtml: `getInstructionsHtml(level, variant) {
        const descHtml = \`<div class="problem-description">\${HUDUtils.formatStoryText(level.description || '')}</div>\`;
        const objHtml = \`<p class="objective"><strong>Goal:</strong> \${HUDUtils.escapeHtml(level.objective || 'Complete the circuit.')}</p>\`;
        return \`\${descHtml}\${objHtml}\${level.maxGates ? \`<p><strong>Limit:</strong> \${level.maxGates} gates.</p>\` : ''}\`;
    }`
};

for (const [name, body] of Object.entries(methodsToAdd)) {
    if (!edu.includes(name + '(')) {
        const lastBrace = edu.lastIndexOf('}');
        edu = edu.substring(0, lastBrace).trim();
        if (!edu.endsWith(',')) edu += ',';
        edu += '\n    ' + body + '\n};';
    }
}

fs.writeFileSync(eduPath, edu);
console.log('HUDEducation.js fixed.');
