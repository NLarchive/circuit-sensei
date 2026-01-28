/**
 * CompletionModal - Level completion celebration and summary
 * Shows score, XP gained, and what was learned
 */

import { globalEvents, Events } from '../../game/EventBus.js';
import { gameManager } from '../../game/GameManager.js';
import { OverlayManager } from '../overlays/OverlayManager.js';
import { HUDRoadmap } from '../hud/HUDRoadmap.js';

class CompletionModalClass {
    constructor() {
        this.modalId = 'completion-modal';
        this.initialized = false;
    }

    /**
     * Initialize the modal (creates DOM if needed)
     */
    init() {
        if (this.initialized) return;
        
        this.createModal();
        this.bindEvents();
        this.initialized = true;
    }

    /**
     * Create the modal DOM structure
     */
    createModal() {
        if (document.getElementById(this.modalId)) return;

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.className = 'overlay hidden';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'completion-title');
        modal.setAttribute('aria-modal', 'true');

        modal.innerHTML = `
            <div class="overlay-content completion-content">
                <div class="completion-header">
                    <div class="completion-icon" id="completion-icon">🎉</div>
                    <h2 id="completion-title">Level Complete!</h2>
                </div>
                
                <div class="completion-body">
                    <div class="completion-stats">
                        <div class="stat-item">
                            <span class="stat-label">Score</span>
                            <span class="stat-value" id="completion-score">100%</span>
                        </div>
                        <div class="stat-item xp-gain">
                            <span class="stat-label">XP Gained</span>
                            <span class="stat-value" id="completion-xp">+150</span>
                        </div>
                    </div>
                    
                    <div class="completion-summary" id="completion-summary">
                        <!-- Filled dynamically -->
                    </div>
                </div>
                
                <div class="completion-difficulty" id="completion-difficulty" style="display:none; margin-bottom: var(--spacing-md);">
                    <label for="completion-difficulty-select" style="display:block; margin-bottom: var(--spacing-xs); font-weight:600;">Play another difficulty for this level?</label>
                    <div style="display:flex; gap:8px; align-items:center; justify-content: center;">
                        <select id="completion-difficulty-select" class="btn-small" aria-label="Select difficulty to replay">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <button id="btn-completion-replay" class="btn primary">Play Difficulty</button>
                    </div>
                </div>

                <div class="completion-footer" id="completion-footer">
                    <button id="btn-completion-roadmap" class="btn secondary">
                        ← Back to Roadmap
                    </button>
                    <button id="btn-completion-next" class="btn primary">
                        Next Level →
                    </button>
                </div>
            </div>
        `;

        // Add to UI layer or body
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.appendChild(modal);
        } else {
            document.body.appendChild(modal);
        }

        // Add styles if not already present
        this.addStyles();
    }

    /**
     * Add component-specific styles
     */
    addStyles() {
        if (document.getElementById('completion-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'completion-modal-styles';
        style.textContent = `
            .completion-content {
                max-width: 450px;
                text-align: center;
                padding: var(--spacing-2xl);
            }
            
            .completion-header {
                margin-bottom: var(--spacing-xl);
            }
            
            .completion-icon {
                font-size: 4rem;
                margin-bottom: var(--spacing-md);
                animation: bounce 0.6s ease-out;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            
            .completion-content h2 {
                margin: 0;
                font-size: var(--font-size-xl);
                color: var(--success-color);
            }
            
            .completion-stats {
                display: flex;
                justify-content: center;
                gap: var(--spacing-3xl);
                margin-bottom: var(--spacing-xl);
                padding: var(--spacing-lg);
                background: rgba(0, 0, 0, 0.2);
                border-radius: var(--radius-md);
            }
            
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--spacing-xs);
            }
            
            .stat-label {
                font-size: var(--font-size-sm);
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .stat-value {
                font-size: var(--font-size-2xl);
                font-weight: var(--font-weight-bold);
                color: var(--text-light);
            }
            
            .stat-item.xp-gain .stat-value {
                color: var(--success-color);
            }
            
            .completion-summary {
                text-align: left;
                margin-bottom: var(--spacing-xl);
                padding: var(--spacing-lg);
                background: rgba(0, 122, 204, 0.1);
                border-radius: var(--radius-md);
                border-left: 3px solid var(--accent-color);
            }
            
            .completion-summary h4 {
                margin: 0 0 var(--spacing-sm) 0;
                font-size: var(--font-size-sm);
                color: var(--accent-light);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .completion-summary ul {
                margin: 0;
                padding-left: var(--spacing-lg);
            }
            
            .completion-summary li {
                margin: var(--spacing-xs) 0;
                color: var(--text-color);
                line-height: var(--line-height-relaxed);
            }
            
            .completion-footer {
                display: flex;
                justify-content: space-between;
                gap: var(--spacing-md);
            }
            
            .completion-footer .btn {
                flex: 1;
                min-width: 140px;
            }
            
            .completion-difficulty {
                text-align: center;
            }
            
            @media (max-width: 480px) {
                .completion-stats {
                    flex-direction: column;
                    gap: var(--spacing-lg);
                }
                
                .completion-footer {
                    flex-direction: column;
                }
                
                .completion-footer .btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for level completion
        globalEvents.on(Events.LEVEL_COMPLETE, (data) => {
            this.show(data);
        });

        // Button handlers
        document.getElementById('btn-completion-roadmap')?.addEventListener('click', () => {
            this.hide();
            // Always refresh roadmap when showing it to ensure latest progress
            HUDRoadmap.showRoadmap();
        });

        // Next button: proceed to the next level, picking the lowest uncompleted difficulty for that level
        document.getElementById('btn-completion-next')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            // Compute next level index and choose the lowest uncompleted variant
            const nextIndex = gameManager.currentLevelIndex + 1;
            if (nextIndex < gameManager.levels.length) {
                const nextLevelId = gameManager.levels[nextIndex].id;
                const variant = gameManager.getLowestUncompletedVariant(nextLevelId) || (gameManager.currentVariant || 'easy');
                this.hide();
                // Load next level's intro for the chosen variant
                gameManager.loadLevel(nextIndex, variant, { showIntro: true });
            } else {
                this.hide();
            }
        });

        // Play selected difficulty button
        document.getElementById('btn-completion-replay')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            const sel = document.getElementById('completion-difficulty-select');
            const difficulty = sel?.value || 'easy';
            this.hide();
            // Load same level with chosen difficulty without showing intro overlay
            gameManager.loadLevel(gameManager.currentLevel.id, difficulty, { showIntro: false });
        });
    }

    /**
     * Show the completion modal
     * @param {Object} data - Completion data (score, xp, etc.)
     */
    show(data = {}) {
        this.init();

        const level = gameManager.currentLevel;

        // Do not show completion modal for the introductory landing level (level_00)
        if (level && level.id === 'level_00') {
            // Silently ignore showing a completion popup for the intro index page
            return;
        }

        const score = data.score || 100;
        const xp = data.xp || level?.xpReward || 0;
        
        // Update stats
        document.getElementById('completion-score').textContent = `${score}%`;
        document.getElementById('completion-xp').textContent = `+${xp}`;
        
        // Update icon based on score
        const iconEl = document.getElementById('completion-icon');
        if (score === 100) {
            iconEl.textContent = '🏆';
        } else if (score >= 80) {
            iconEl.textContent = '🎉';
        } else {
            iconEl.textContent = '✅';
        }
        
        // Generate summary
        const summaryEl = document.getElementById('completion-summary');
        summaryEl.innerHTML = this.generateSummary(level);

        // Populate difficulty selector (chooser will not auto-show)
        const nextVariant = this.getNextUncompletedVariant(level?.id);
        this.populateDifficultyOptions(level?.id, nextVariant);

        // Show modal
        OverlayManager.show(this.modalId);
    }

    /**
     * Hide the completion modal
     */
    hide() {
        // Reset chooser visibility when hiding
        const chooser = document.getElementById('completion-difficulty');
        if (chooser) chooser.style.display = 'none';
        OverlayManager.hide(this.modalId);
    }

    /**
     * Get the next uncompleted variant for a level (easy -> medium -> hard)
     */
    getNextUncompletedVariant(levelId) {
        if (!levelId || !gameManager.levelVariants) return null;
        const variants = gameManager.levelVariants[levelId] || {};
        const completed = (gameManager.progress.completedLevels && gameManager.progress.completedLevels[levelId]) || {};
        const order = ['easy','medium','hard'];
        for (const v of order) {
            if (variants[v] && !completed[v]) return v;
        }
        return null;
    }

    /**
     * Populate difficulty select and show chooser (if applicable)
     */
    populateDifficultyOptions(levelId, defaultVariant = null) {
        const sel = document.getElementById('completion-difficulty-select');
        const chooser = document.getElementById('completion-difficulty');
        if (!sel || !chooser) return;

        // Clear options
        sel.innerHTML = '';

        const variants = (gameManager.levelVariants && gameManager.levelVariants[levelId]) || {};
        const completed = (gameManager.progress.completedLevels && gameManager.progress.completedLevels[levelId]) || {};

        const order = ['easy','medium','hard'];
        let added = 0;
        order.forEach(v => {
            if (variants[v]) {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = `${v.charAt(0).toUpperCase() + v.slice(1)}${completed[v] ? ' (completed)' : ''}`;
                if (completed[v]) opt.dataset.completed = 'true';
                sel.appendChild(opt);
                added++;
            }
        });

        // If there are no variant entries but base level exists, expose easy as default
        if (added === 0) {
            const opt = document.createElement('option');
            opt.value = 'easy';
            opt.textContent = 'Easy';
            sel.appendChild(opt);
            added = 1;
        }

        // If there is a nextVariant (uncompleted), select it; otherwise select first
        if (defaultVariant && Array.from(sel.options).some(o => o.value === defaultVariant)) {
            sel.value = defaultVariant;
            chooser.style.display = 'block';
        } else if (added > 0) {
            sel.selectedIndex = 0;
            // Show chooser only if there is at least one uncompleted variant
            const hasUncompleted = Array.from(sel.options).some(o => o.dataset.completed !== 'true');
            chooser.style.display = hasUncompleted ? 'block' : 'none';
        } else {
            chooser.style.display = 'none';
        }
    }

    /**
     * Show chooser explicitly when next button is pressed
     */
    showDifficultyChooser(level, nextVariant) {
        const chooser = document.getElementById('completion-difficulty');
        if (!chooser) return;
        this.populateDifficultyOptions(level?.id, nextVariant);
        chooser.style.display = 'block';

        // Focus select for quick accessibility
        const sel = document.getElementById('completion-difficulty-select');
        sel?.focus();
    }

    /**
     * Generate summary of what was learned
     */
    generateSummary(level) {
        if (!level) return '';

        const items = [];
        
        // Get concepts from physicsDetails
        if (level.physicsDetails) {
            const details = level.physicsDetails;
            
            if (Array.isArray(details.conceptCards)) {
                details.conceptCards.slice(0, 3).forEach(card => {
                    if (card.title) {
                        items.push(card.title);
                    }
                });
            } else if (Array.isArray(details.concepts)) {
                details.concepts.slice(0, 3).forEach(concept => {
                    items.push(concept);
                });
            }
        }
        
        // Get gate types used
        if (level.availableGates && level.availableGates.length > 0) {
            const gates = level.availableGates.slice(0, 3).map(g => g.toUpperCase()).join(', ');
            items.push(`Working with ${gates} gates`);
        }
        
        if (items.length === 0) {
            items.push('Completed the circuit challenge');
        }

        return `
            <h4>📚 What You Learned</h4>
            <ul>
                ${items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }
}

// Singleton instance
export const CompletionModal = new CompletionModalClass();
