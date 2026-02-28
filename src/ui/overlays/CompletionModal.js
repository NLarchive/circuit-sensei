/**
 * CompletionModal - Level completion celebration and summary
 * Shows score, XP gained, and what was learned
 */

import { globalEvents, Events } from '../../game/EventBus.js';
import { gameManager } from '../../game/GameManager.js';
import { OverlayManager } from '../overlays/OverlayManager.js';
import { HUDRoadmap } from '../hud/HUDRoadmap.js';
import { certificateRenderer, certificationModal } from '../../certification/index.js';

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

                <div class="completion-certificate" id="completion-certificate">
                    <div class="cert-header">
                        <span class="cert-icon" id="cert-icon">📜</span>
                        <div class="cert-header-text">
                            <h4>Certification Status</h4>
                            <p id="completion-cert-tier" class="cert-tier-label">In Progress</p>
                        </div>
                    </div>
                    <p id="completion-cert-name" class="cert-name">Complete all Easy levels to earn your base certificate</p>
                    <div id="completion-cert-metrics" class="cert-metrics">
                        <div class="cert-metric"><span class="cert-metric-value" id="cert-score">0%</span><span class="cert-metric-label">Score</span></div>
                        <div class="cert-metric"><span class="cert-metric-value" id="cert-stars">0/0</span><span class="cert-metric-label">Stars</span></div>
                        <div class="cert-metric"><span class="cert-metric-value" id="cert-hints">0</span><span class="cert-metric-label">Hints Used</span></div>
                    </div>
                    <div id="completion-cert-honors" class="cert-honors"></div>
                    <div id="completion-cert-requirements" class="completion-cert-requirements"></div>
                    <div class="cert-actions">
                        <button id="btn-view-certificate" class="btn primary" disabled>📜 View Certificate</button>
                        <button id="btn-download-certificate" class="btn secondary" disabled>📥 Download</button>
                        <button id="btn-share-certificate" class="btn secondary" disabled>📤 Share</button>
                    </div>
                    <p id="completion-share-status" class="completion-share-status" aria-live="polite"></p>
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

            .completion-certificate {
                text-align: left;
                margin-bottom: var(--spacing-xl);
                padding: var(--spacing-lg);
                background: linear-gradient(135deg, rgba(40,40,40,0.95) 0%, rgba(30,30,40,0.95) 100%);
                border-radius: var(--radius-md);
                border: 1px solid var(--border-color);
                box-shadow: var(--shadow-md);
            }

            .cert-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-md);
                padding-bottom: var(--spacing-md);
                border-bottom: 1px solid var(--border-color);
            }

            .cert-icon {
                font-size: 2.5rem;
            }

            .cert-header-text h4 {
                margin: 0;
                font-size: var(--font-size-md);
                color: var(--text-light);
                text-transform: uppercase;
                letter-spacing: 2px;
            }

            .cert-tier-label {
                margin: 4px 0 0 0;
                font-size: var(--font-size-sm);
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .cert-tier-label.simple { color: #4caf50; }
            .cert-tier-label.intermediate { color: #2196f3; }
            .cert-tier-label.advanced { color: #e91e63; }

            .cert-name {
                font-size: var(--font-size-base);
                color: var(--text-color);
                margin: 0 0 var(--spacing-md) 0;
                line-height: var(--line-height-relaxed);
            }

            .cert-metrics {
                display: flex;
                justify-content: space-around;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: rgba(0,0,0,0.2);
                border-radius: var(--radius-sm);
                margin-bottom: var(--spacing-md);
            }

            .cert-metric {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .cert-metric-value {
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-bold);
                color: var(--text-light);
            }

            .cert-metric-label {
                font-size: var(--font-size-xs);
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 2px;
            }

            .cert-honors {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-xs);
                margin-bottom: var(--spacing-md);
            }

            .cert-honor-tag {
                display: inline-block;
                padding: 4px 10px;
                font-size: var(--font-size-xs);
                border-radius: var(--radius-sm);
                background: rgba(255,193,7,0.15);
                color: #ffc107;
                border: 1px solid rgba(255,193,7,0.3);
            }

            .cert-honor-tag.hintless {
                background: rgba(76,175,80,0.15);
                color: #81c784;
                border-color: rgba(76,175,80,0.3);
            }

            .cert-honor-tag.distinction {
                background: rgba(233,30,99,0.15);
                color: #f48fb1;
                border-color: rgba(233,30,99,0.3);
            }

            .cert-actions {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-sm);
                margin-top: var(--spacing-md);
            }

            .cert-actions .btn {
                flex: 1;
                min-width: 100px;
                font-size: var(--font-size-sm);
            }

            .completion-certificate p {
                margin: 0 0 var(--spacing-sm) 0;
            }

            .completion-share-status {
                min-height: 1.2em;
                margin-top: var(--spacing-sm);
                font-size: var(--font-size-sm);
                color: var(--text-muted);
            }

            .completion-cert-requirements {
                margin-top: var(--spacing-sm);
                margin-bottom: var(--spacing-sm);
                font-size: var(--font-size-sm);
                color: var(--text-color);
            }

            .completion-cert-requirements ul {
                margin: 0;
                padding-left: var(--spacing-lg);
                list-style: none;
            }

            .completion-cert-requirements li {
                margin: var(--spacing-xs) 0;
                position: relative;
                padding-left: 24px;
            }

            .completion-cert-requirements li::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid var(--border-color);
                background: transparent;
            }

            .completion-cert-requirements li.completed::before {
                background: var(--success-color);
                border-color: var(--success-color);
            }

            .completion-cert-requirements li.completed::after {
                content: '✓';
                position: absolute;
                left: 3px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 10px;
                color: white;
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

        // View certificate button - opens formal certificate preview
        document.getElementById('btn-view-certificate')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            const certification = gameManager.getCertification();
            certificateRenderer.showPreview(certification);
        });

        // Download certificate button
        document.getElementById('btn-download-certificate')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const btn = ev.target;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳...';
            
            const certification = gameManager.getCertification();
            const result = await certificateRenderer.downloadCertificate(certification);
            
            const shareStatus = document.getElementById('completion-share-status');
            if (result.success) {
                btn.innerHTML = '✅ Done';
                if (shareStatus) shareStatus.textContent = 'Certificate downloaded successfully.';
            } else {
                btn.innerHTML = '❌ Failed';
                if (shareStatus) shareStatus.textContent = 'Download failed. Try again.';
            }
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        });

        // Share certificate button
        document.getElementById('btn-share-certificate')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const btn = ev.target;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳...';
            
            const certification = gameManager.getCertification();
            const result = await certificateRenderer.shareCertificate(certification);
            
            const shareStatus = document.getElementById('completion-share-status');
            if (result.canceled) {
                btn.innerHTML = originalText;
            } else if (result.success) {
                btn.innerHTML = '✅ Shared';
                if (shareStatus) {
                    shareStatus.textContent = result.copied 
                        ? 'Shared! Text also copied to clipboard.' 
                        : 'Shared successfully.';
                }
            } else {
                btn.innerHTML = '❌ Failed';
                if (shareStatus) shareStatus.textContent = 'Share failed. Try again.';
            }
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
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
        const xp = data.xpEarned ?? data.xp ?? level?.xpReward ?? 0;
        
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

        // Render certification details
        this.renderCertification(data.certification || gameManager.getCertification());

        // Populate difficulty selector (chooser will not auto-show)
        const nextVariant = this.getNextUncompletedVariant(level?.id);
        this.populateDifficultyOptions(level?.id, nextVariant);

        // Show modal
        OverlayManager.show(this.modalId);
    }

    showCertificationOverview() {
        // Delegate to the standalone certification modal
        const certification = gameManager.getCertification();
        certificationModal.open(certification);
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
     * Get the next uncompleted variant for a level (easy -> medium -> hard -> expert)
     */
    getNextUncompletedVariant(levelId) {
        if (!levelId || !gameManager.levelVariants) return null;
        const variants = gameManager.levelVariants[levelId] || {};
        const completed = (gameManager.progress.completedLevels && gameManager.progress.completedLevels[levelId]) || {};
        const order = ['easy','medium','hard','expert'];
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

        const order = ['easy','medium','hard','expert'];
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

    renderCertification(certification) {
        const certIcon = document.getElementById('cert-icon');
        const certTierLabel = document.getElementById('completion-cert-tier');
        const certName = document.getElementById('completion-cert-name');
        const certScore = document.getElementById('cert-score');
        const certStars = document.getElementById('cert-stars');
        const certHints = document.getElementById('cert-hints');
        const certHonors = document.getElementById('completion-cert-honors');
        const certReq = document.getElementById('completion-cert-requirements');
        const shareStatus = document.getElementById('completion-share-status');
        const viewBtn = document.getElementById('btn-view-certificate');
        const downloadBtn = document.getElementById('btn-download-certificate');
        const shareBtn = document.getElementById('btn-share-certificate');

        const metrics = certification?.metrics || {};
        const req = certification?.requirements || {};
        const titles = certification?.titles || [];
        const isHintless = metrics.hintsUsed === 0 && req.allVariantsComplete;
        const hasCert = certification?.hasBaseCertification;

        // Update icon based on tier
        if (certIcon) {
            const tierIcons = {
                'advanced': '🏆',
                'intermediate': '🎯',
                'simple': '🎓',
                'in-progress': '📘'
            };
            certIcon.textContent = tierIcons[certification?.certificationTier] || '📘';
        }

        // Update tier label
        if (certTierLabel) {
            certTierLabel.textContent = certification?.certificationLabel || 'In Progress';
            certTierLabel.className = `cert-tier-label ${certification?.certificationTier || ''}`;
        }

        // Update cert name/description
        if (certName) {
            if (!hasCert) {
                certName.textContent = 'Complete all Easy levels to earn your foundation certificate in digital logic fundamentals.';
            } else {
                certName.textContent = `${certification.baseCertification} — Department of Digital Logic & Computer Architecture`;
            }
        }

        // Update metrics
        if (certScore) certScore.textContent = `${certification?.score || 0}%`;
        if (certStars) certStars.textContent = `${metrics.earnedStars || 0}/${metrics.totalStars || 0}`;
        if (certHints) {
            const hintsVal = metrics.hintsUsed || 0;
            certHints.textContent = hintsVal === 0 ? '0 ✓' : String(hintsVal);
            if (hintsVal === 0 && req.allVariantsComplete) {
                certHints.style.color = '#81c784';
            } else {
                certHints.style.color = '';
            }
        }

        // Update honors/titles
        if (certHonors) {
            if (titles.length > 0) {
                certHonors.innerHTML = titles.map(title => {
                    let tagClass = '';
                    if (title.includes('Hintless')) tagClass = 'hintless';
                    if (title.includes('Distinction')) tagClass = 'distinction';
                    return `<span class="cert-honor-tag ${tagClass}">${title}</span>`;
                }).join('');
            } else {
                certHonors.innerHTML = '<span class="cert-honor-tag" style="opacity:0.5">Complete tiers to earn honors</span>';
            }
        }

        // Update requirements checklist
        if (certReq) {
            certReq.innerHTML = `
                <ul>
                    <li class="${req.allEasyComplete ? 'completed' : ''}">Foundation Certificate: Complete all Easy levels</li>
                    <li class="${req.allMediumComplete ? 'completed' : ''}">Intermediate Tier: Complete all Medium levels</li>
                    <li class="${req.allHardComplete ? 'completed' : ''}">Advanced Tier: Complete all Hard levels</li>
                    <li class="${isHintless ? 'completed' : ''}">Hintless Achievement: Complete all variants without using hints</li>
                </ul>
            `;
        }

        // Enable/disable buttons based on certification status
        if (viewBtn) viewBtn.disabled = !hasCert;
        if (downloadBtn) downloadBtn.disabled = !hasCert;
        if (shareBtn) shareBtn.disabled = false; // Always allow sharing progress
        
        if (shareStatus) shareStatus.textContent = '';
    }

    // Legacy method for compatibility
    buildCertificationShareText(certification) {
        return certificateRenderer.buildShareText(certification);
    }

    // Legacy share method (redirects to CertificateRenderer)
    async shareCertification() {
        const certification = gameManager.getCertification();
        const result = await certificateRenderer.shareCertificate(certification);
        
        const shareStatus = document.getElementById('completion-share-status');
        if (!result.canceled && shareStatus) {
            shareStatus.textContent = result.success 
                ? (result.copied ? 'Shared! Text copied to clipboard.' : 'Shared successfully.')
                : 'Share failed.';
        }
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
