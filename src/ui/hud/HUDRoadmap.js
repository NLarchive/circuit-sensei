import { gameManager } from '../../game/GameManager.js';
import { globalEvents, Events } from '../../game/EventBus.js';
import { DIFFICULTY_LABELS, TIER_ICONS, TIER_ORDER } from '../constants/UIConstants.js';

export const HUDRoadmap = {
    showRoadmap() {
        const tiersContainer = document.getElementById('roadmap-tiers');
        const xpDisplay = document.getElementById('roadmap-xp');
        const overlay = document.getElementById('roadmap-overlay');
        
        if (!tiersContainer || !overlay) return;

        // Track if overlay was already visible (for refresh vs show)
        const wasVisible = !overlay.classList.contains('hidden');

        // Update XP
        if (xpDisplay) {
            // Calculate total available XP across all levels (prefer full variants, fall back to summary)
            const totalAvailableXP = gameManager.levels.reduce((total, level) => {
                const fullVariants = gameManager.levelVariants && gameManager.levelVariants[level.id];
                const summaryVariants = gameManager.levelVariantsSummary && gameManager.levelVariantsSummary[level.id];

                if (fullVariants && Object.keys(fullVariants).length > 0) {
                    return total + Object.values(fullVariants).reduce((levelTotal, variant) => levelTotal + (variant.xpReward || 0), 0);
                } else if (summaryVariants && Object.keys(summaryVariants).length > 0) {
                    return total + Object.values(summaryVariants).reduce((levelTotal, variant) => levelTotal + (variant.xpReward || 0), 0);
                } else {
                    return total + (level.xpReward || 0);
                }
            }, 0);

            xpDisplay.innerText = `${gameManager.progress.xp}/${totalAvailableXP}`;
        }
        
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
        
        // Only show overlay if it wasn't already visible (prevent re-showing during refresh)
        if (!wasVisible) {
            overlay.classList.remove('hidden');
            // Emit event for music controller only when actually showing
            globalEvents.emit(Events.UI_OVERLAY_OPENED, { overlay: 'roadmap' });
        }

        this.bindVariantSelectors();
    },

    renderLevelCard(level, isUnlocked) {
        const variantsCompleted = gameManager.progress.completedLevels[level.id] || {};
        const isLocked = !isUnlocked;
        // Use getVariantsForLevel() for consistent 3-tier fallback (full → summary → puzzleFiles)
        const variants = gameManager.getVariantsForLevel(level.id) || {};
        const hasVariants = Object.keys(variants).length > 0;

        const availableVariants = Object.keys(variants);
        const selectedForThisLevel = gameManager.getLowestUncompletedVariant(level.id);
        
        const variantSelect = hasVariants ? `
            <select class="variant-select badge-${selectedForThisLevel}" data-level-index="${level.index}" title="Select difficulty" aria-label="Difficulty for ${level.title}">
                ${['easy','medium','hard'].map(v => variants[v] ? `<option value="${v}" ${v === selectedForThisLevel ? 'selected' : ''}>${DIFFICULTY_LABELS[v] || v}</option>` : '').join('')}
            </select>
        ` : '';

        const stars = hasVariants ? ['easy', 'medium', 'hard'].map(variant => 
            `<span class="difficulty-star ${variantsCompleted[variant] ? 'filled' : 'empty'}" title="${DIFFICULTY_LABELS[variant] || variant} ${variantsCompleted[variant] ? 'completed' : 'not completed'}" aria-label="${DIFFICULTY_LABELS[variant]} ${variantsCompleted[variant] ? 'completed' : 'not completed'}">${variantsCompleted[variant] ? '★' : '☆'}</span>`
        ).join('') : '';

        // Calculate total earned XP from completed variants
        const totalEarnedXP = hasVariants ? 
            Object.keys(variants).reduce((total, variant) => {
                return variantsCompleted[variant] ? total + (variants[variant].xpReward || 0) : total;
            }, 0) : 0;

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
                    <span class="level-xp">+${totalEarnedXP} XP</span>
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
                
                // Persist selected variant for this level so the roadmap remembers it
                const levelId = gameManager.levels[idx].id;
                gameManager.progress.selectedVariants = gameManager.progress.selectedVariants || {};
                gameManager.progress.selectedVariants[levelId] = val;
                gameManager.saveProgress();

                if (idx === gameManager.currentLevelIndex) {
                    const navSel = document.getElementById('nav-variant-select-inline');
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

// Listen for level completion to refresh roadmap UI if currently visible
globalEvents.on(Events.LEVEL_COMPLETE, () => {
    const overlay = document.getElementById('roadmap-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        HUDRoadmap.showRoadmap();
    }
});
