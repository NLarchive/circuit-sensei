import { gameManager } from '../../game/GameManager.js';
import { globalEvents, Events } from '../../game/EventBus.js';
import { DIFFICULTY_LABELS, TIER_ICONS, TIER_ORDER } from '../constants/UIConstants.js';

export const HUDRoadmap = {
    showRoadmap() {
        const tiersContainer = document.getElementById('roadmap-tiers');
        const xpDisplay = document.getElementById('roadmap-xp');
        const overlay = document.getElementById('roadmap-overlay');
        
        if (!tiersContainer || !overlay) return;

        // Update XP
        if (xpDisplay) xpDisplay.innerText = gameManager.progress.xp;
        
        // Group levels by tier
        const tierGroups = {};
        gameManager.levels.forEach((level, index) => {
            const tier = level.tier || 'tier_1';
            if (!tierGroups[tier]) tierGroups[tier] = [];
            tierGroups[tier].push({ ...level, index });
        });
        
        // Build roadmap HTML
        let html = '';
        
        TIER_ORDER.forEach(tierId => {
            const tierInfo = gameManager.tiers[tierId];
            const levels = tierGroups[tierId] || [];
            if (!tierInfo || levels.length === 0) return;
            
            const isUnlocked = gameManager.progress.unlockedTiers.includes(tierId) || 
                               tierId === 'intro' || 
                               tierId === 'tier_1';
            
            html += `
                <div class="roadmap-tier ${isUnlocked ? '' : 'locked'}">
                    <div class="tier-header">
                        <span class="tier-icon">${TIER_ICONS[tierId] || '📦'}</span>
                        <div class="tier-info">
                            <h3>${tierInfo.name}</h3>
                            <p>${tierInfo.subtitle || ''}</p>
                        </div>
                        ${!isUnlocked ? '<span class="lock-icon">🔒</span>' : ''}
                    </div>
                    <div class="tier-levels">
                        ${levels.map(level => this.renderLevelCard(level, isUnlocked)).join('')}
                    </div>
                </div>
            `;
        });
        
        tiersContainer.innerHTML = html;
        overlay.classList.remove('hidden');

        // Emit event for music controller
        globalEvents.emit(Events.UI_OVERLAY_OPENED, { overlay: 'roadmap' });

        this.bindVariantSelectors();
    },

    renderLevelCard(level, isUnlocked) {
        const variantsCompleted = gameManager.progress.completedLevels[level.id] || {};
        const isLocked = !isUnlocked;
        const variants = (gameManager.levelVariants && gameManager.levelVariants[level.id]) || {};
        const hasVariants = Object.keys(variants).length > 0;

        const availableVariants = Object.keys(variants);
        const selectedForThisLevel = (gameManager.currentLevel && gameManager.currentLevel.id === level.id && gameManager.currentVariant && variants[gameManager.currentVariant]) 
            ? gameManager.currentVariant 
            : (variants.easy ? 'easy' : availableVariants[0]);
        
        const variantSelect = hasVariants ? `
            <select class="variant-select badge-${selectedForThisLevel}" data-level-index="${level.index}" title="Select difficulty" aria-label="Difficulty for ${level.title}">
                ${['easy','medium','hard'].map(v => variants[v] ? `<option value="${v}" ${v === selectedForThisLevel ? 'selected' : ''}>${DIFFICULTY_LABELS[v] || v}</option>` : '').join('')}
            </select>
        ` : '';

        const stars = hasVariants ? ['easy', 'medium', 'hard'].map(variant => 
            `<span class="difficulty-star ${variantsCompleted[variant] ? 'filled' : 'empty'}" title="${DIFFICULTY_LABELS[variant] || variant} ${variantsCompleted[variant] ? 'completed' : 'not completed'}" aria-label="${DIFFICULTY_LABELS[variant]} ${variantsCompleted[variant] ? 'completed' : 'not completed'}">${variantsCompleted[variant] ? '★' : '☆'}</span>`
        ).join('') : '';

        return `
            <button class="roadmap-level ${isLocked ? 'locked' : ''}" 
                    data-level-index="${level.index}"
                    ${isLocked ? 'disabled aria-disabled="true"' : ''}
                    aria-label="Level ${level.index}: ${level.title}">
                <div class="level-left">
                    <span class="level-number">${level.index === 0 ? 'i' : level.index}</span>
                    <span class="level-title">${level.title}</span>
                </div>
                <div class="level-right">
                    ${variantSelect}
                    <div class="difficulty-stars" role="group" aria-label="Completion status">${stars}</div>
                    <span class="level-xp">+${level.xpReward || 0} XP</span>
                </div>
            </button>
        `;
    },

    bindVariantSelectors() {
        document.querySelectorAll('.roadmap-tier .variant-select').forEach(s => {
            s.addEventListener('click', (ev) => ev.stopPropagation());
            s.addEventListener('change', (ev) => {
                ev.stopPropagation();
                const val = s.value;
                s.classList.remove('badge-easy','badge-medium','badge-hard');
                s.classList.add(`badge-${val}`);

                const idx = parseInt(s.dataset.levelIndex);
                if (idx === gameManager.currentLevelIndex) {
                    const navSel = document.getElementById('nav-variant-select');
                    if (navSel) {
                        navSel.value = val;
                        navSel.classList.remove('badge-easy','badge-medium','badge-hard');
                        navSel.classList.add(`badge-${val}`);
                    }
                    gameManager.loadLevel(idx, val);
                }
            });
        });
    }
};
