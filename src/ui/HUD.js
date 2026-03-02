import { globalEvents, Events } from '../game/EventBus.js';
import { gameManager } from '../game/GameManager.js';
import { HUDVisuals } from './hud/HUDVisuals.js';
import { HUDEducation } from './hud/HUDEducation.js';
import { HUDRoadmap } from './hud/HUDRoadmap.js';
import { HUDGlossary } from './hud/HUDGlossary.js';
import { HUDUtils } from './hud/HUDUtils.js';
import { DIFFICULTY_LABELS } from './constants/UIConstants.js';
import { MessageDisplay } from './feedback/MessageDisplay.js';
import { SidebarController } from './sidebar/SidebarController.js';
import { KeyboardManager } from './controls/KeyboardManager.js';
import { LoadingScreen } from './overlays/LoadingScreen.js';
import { CompletionModal } from './overlays/CompletionModal.js';
import { certificationModal } from '../certification/index.js';
import { asyncQueue } from '../utils/AsyncPriorityQueue.js';

export class HUD {
    constructor(uiLayerId, sidebarId, navbarId, circuit) {
        this.uiLayer = document.getElementById(uiLayerId);
        this.sidebar = document.getElementById(sidebarId);
        // sidebarId points to the inner container (#toolbox-container). Mobile open/close must
        // target the actual sidebar panel (<aside id="sidebar">) to work on small screens.
        this.sidebarRoot = this.sidebar?.closest('aside') || document.getElementById('sidebar') || this.sidebar;
        this.navbar = document.getElementById(navbarId);
        this.circuit = circuit;
        this.setupUI();
        this.setupListeners();
        this.bindEvents();
    }

    setupUI() {
        // Navbar content (2-row layout)
        this.navbar.innerHTML = `
            <div class="nav-row nav-row-top">
                <div class="nav-left">
                    <h2 id="level-title">Loading...</h2>
                    <button id="btn-instructions" class="btn secondary btn-small" title="Level Instructions">📋</button>
                    <select id="nav-variant-select-inline" class="variant-select variant-inline badge-easy" title="Select difficulty" aria-label="Difficulty selector"></select>
                </div>
                <div class="nav-right">
                    <button id="btn-toggle-sidebar" class="btn-icon mobile-only" aria-label="Toggle sidebar">☰</button>
                    <button id="btn-more-open" class="btn-icon nav-more-trigger" title="More">⋯</button>
                </div>
            </div>
            
            <div class="nav-row nav-row-secondary">
                <div class="controls">
                    <button id="btn-reset" class="btn secondary btn-small">Reset</button>
                    <button id="btn-check" class="btn primary btn-small">Verify</button>
                    <button id="btn-sim-toggle" class="btn secondary btn-small desktop-only">Pause</button>
                    <button id="btn-sim-step" class="btn secondary btn-small desktop-only">Step</button>
                    <button id="btn-next" class="btn success btn-small" disabled>Next</button>
                </div>
                <div class="nav-right-group">
                    <div class="mode-toggle">
                        <button id="btn-mode-toggle" class="btn-mode" title="Controls Reference">ℹ️</button>
                    </div>
                    <div class="zoom-controls desktop-only">
                        <button id="btn-zoom-out" class="btn secondary btn-small">−</button>
                        <span id="zoom-display">100%</span>
                        <button id="btn-zoom-in" class="btn secondary btn-small">+</button>
                    </div>
                    <div class="nav-more-inline desktop-only">
                        <span class="xp-badge">XP: <span id="xp-display">0</span></span>
                        <button id="btn-glossary" class="btn-icon" title="Glossary">📖</button>
                        <button id="btn-help" class="btn-icon" title="Help">?</button>
                    </div>
                </div>
            </div>

            <div id="nav-more-modal" class="nav-more-modal hidden" aria-hidden="true">
                <div class="nav-more-modal-backdrop" data-close="nav-more"></div>
                <div class="nav-more-modal-card" role="dialog" aria-modal="true" aria-labelledby="nav-more-title">
                    <div class="nav-more-modal-header">
                        <h3 id="nav-more-title">More</h3>
                        <button id="btn-more-close" class="btn-icon" title="Close">×</button>
                    </div>
                    <div class="nav-more-modal-body">
                        <div class="xp-badge">XP: <span id="xp-display-modal">0</span></div>
                        <div class="nav-more-modal-actions">
                            <button class="btn secondary btn-small" data-proxy="glossary">📖 Glossary</button>
                            <button class="btn secondary btn-small" data-proxy="help">Help</button>
                        </div>
                        <div class="nav-more-mobile-only" aria-label="Mobile controls">
                            <button class="btn secondary btn-small" data-proxy="sim-toggle">Pause/Resume</button>
                            <button class="btn secondary btn-small" data-proxy="sim-step">Step CLK</button>
                            <div class="nav-more-zoom">
                                <button class="btn secondary btn-small" data-proxy="zoom-out">Zoom -</button>
                                <button class="btn secondary btn-small" data-proxy="zoom-in">Zoom +</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Sidebar content (Toolbox and Tabs)
        this.sidebar.innerHTML = `
            <div class="mode-tabs">
                <button class="tab-btn active" data-mode="STORY">Story</button>
                <button class="tab-btn" data-mode="DESIGNER">Designer</button>
                <button class="tab-btn" data-mode="ENDLESS">Endless</button>
            </div>
            <div class="mode-select-wrap">
                <label class="mode-select-label" for="mode-select-mobile">Mode</label>
                <select id="mode-select-mobile" class="mode-select-mobile" aria-label="Game mode">
                    <option value="GAME">Game</option>
                    <option value="STORY">Story</option>
                    <option value="DESIGNER">Designer</option>
                    <option value="ENDLESS">Endless</option>
                </select>
            </div>
            <div class="toolbox">
                <div class="toolbox-header">
                    <h3>Components</h3>
                    <button id="btn-toolbox-top" class="btn-icon small" title="Back to top">↑</button>
                </div>
                <div class="toolbox-body">
                    <div id="gate-list" class="gate-grid"></div>
                </div>
            </div>
        `;

        // UI Layer content (Overlays only)
        this.uiLayer.innerHTML = `
            <div class="hud-bottom">
                <div id="message-area" class="message-area"></div>
            </div>
            
            <!-- Level Selection Roadmap -->
            <div id="roadmap-overlay" class="overlay roadmap-overlay fullscreen hidden">
                <div class="roadmap-content">
                    <div class="roadmap-header">
                        <h1>🔌 Logic Architect</h1>
                        <p class="subtitle">From Zero to Hero: Build a Computer from First Principles</p>
                        <button id="btn-dev-unlock" class="btn-icon" title="DEV: Unlock All Levels">🔓</button>
                    </div>
                    <div class="roadmap-body">
                        <div id="roadmap-tiers" class="roadmap-tiers"></div>
                    </div>
                    <div class="roadmap-footer">
                        <div class="roadmap-stats">
                            <div class="xp-info">Total XP: <span id="roadmap-xp">0</span></div>
                            <div class="hint-info">Hint use: <span id="roadmap-hints-used">0</span>/<span id="roadmap-hints-total">0</span></div>
                        </div>
                        <button id="btn-roadmap-certification" class="btn secondary">View Certification</button>
                        <button id="btn-close-roadmap" class="btn secondary">Continue Playing</button>
                    </div>
                </div>
            </div>
            
            <div id="level-intro-overlay" class="overlay fullscreen hidden">
                <div class="intro-content">
                    <div class="intro-header">
                        <h1 id="intro-tier-title"></h1>
                        <h2 id="intro-level-title"></h2>
                    </div>
                    <div class="intro-body">
                        <div id="intro-visual" class="intro-visual"></div>
                        <div id="intro-text" class="intro-text"></div>
                    </div>
                    <div class="intro-footer">
                        <button id="btn-back-to-roadmap" class="btn secondary">Back to Roadmap</button>
                        <button id="btn-start-level" class="btn primary btn-large">Start Level →</button>
                    </div>
                </div>
            </div>
            
            <div id="instruction-overlay" class="overlay hidden">
                <div class="overlay-content">
                    <h3 id="instruction-title">Instructions</h3>
                    <div id="instruction-text"></div>
                    <button id="btn-show-hint" class="btn secondary">Hint</button>
                    <div id="instruction-hint" class="hint-box hidden"></div>
                    <button id="btn-close-instructions" class="btn primary">Got it!</button>
                </div>
            </div>
            
            <!-- Glossary Overlay -->
            <div id="glossary-overlay" class="overlay fullscreen hidden">
                <div class="glossary-content">
                    <div class="glossary-header">
                        <h1>📖 Reference Guide</h1>
                        <p class="subtitle">Definitions, Acronyms, Symbols & Formulas</p>
                        <div class="glossary-tabs">
                            <button class="glossary-tab active" data-tab="acronyms">Acronyms</button>
                            <button class="glossary-tab" data-tab="terms">Terms</button>
                            <button class="glossary-tab" data-tab="symbols">Symbols</button>
                            <button class="glossary-tab" data-tab="formulas">Formulas</button>
                            <button class="glossary-tab" data-tab="current">This Level</button>
                        </div>
                        <div class="glossary-search">
                            <input type="text" id="glossary-search-input" placeholder="Search terms..." />
                        </div>
                    </div>
                    <div class="glossary-body">
                        <div id="glossary-list" class="glossary-list"></div>
                    </div>
                    <div class="glossary-footer">
                        <button id="btn-close-glossary" class="btn secondary">Close</button>
                    </div>
                </div>
            </div>
            
            <!-- Term Info Popup (for inline definitions) -->
            <div id="term-popup" class="term-popup hidden">
                <div class="term-popup-content">
                    <div class="term-popup-header">
                        <span id="term-popup-title"></span>
                        <button id="btn-close-term-popup" class="btn-icon small">×</button>
                    </div>
                    <div id="term-popup-body"></div>
                </div>
            </div>

            <!-- Controls Reference Modal (opened by ℹ️ button) -->
            <div id="controls-info-modal" class="overlay hidden" role="dialog" aria-modal="true" aria-labelledby="controls-info-title">
                <div class="overlay-content" style="max-width:500px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <h3 id="controls-info-title" style="margin:0;">ℹ️ Controls Reference</h3>
                        <button id="btn-close-controls-info" class="btn-icon" title="Close">×</button>
                    </div>
                    <div style="display:flex;gap:8px;margin-bottom:16px;">
                        <button class="ctrl-tab-btn btn secondary btn-small active" data-ctrl-tab="keyboard">🖱️ Desktop Mode</button>
                        <button class="ctrl-tab-btn btn secondary btn-small" data-ctrl-tab="touch">📱 Phone Mode</button>
                    </div>
                    <div id="ctrl-panel-keyboard" class="ctrl-tab-panel">
                        <ul class="controls-list" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Click pin</kbd><span>Start or complete a wire connection</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Click + drag gate</kbd><span>Move component (no hand mode required)</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Click input gate</kbd><span>Toggle input ON / OFF</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Right-click gate/wire</kbd><span>Delete component or connection</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Drag empty canvas</kbd><span>Pan canvas</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Middle-click + drag</kbd><span>Pan canvas</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Mouse wheel</kbd><span>Zoom in / out</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Ctrl +</kbd><span>Zoom in</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Ctrl −</kbd><span>Zoom out</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Ctrl 0</kbd><span>Reset zoom</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Reset / Verify / Next</kbd><span>Main puzzle actions from navbar buttons</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Pause / Step</kbd><span>Clock controls for sequential circuits</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Glossary / Help</kbd><span>Open learning references</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">F1</kbd><span>Show level help</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Shift ?</kbd><span>All keyboard shortcuts</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">I</kbd><span>Show this controls reference</span></li>
                        </ul>
                    </div>
                    <div id="ctrl-panel-touch" class="ctrl-tab-panel hidden">
                        <ul class="controls-list" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Tap pin</kbd><span>Start or complete a wire connection</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Hold + drag gate</kbd><span>Move component (no hand mode required)</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Tap input node</kbd><span>Toggle input ON / OFF</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Double-tap gate/wire</kbd><span>Delete component or connection</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Two-finger pinch</kbd><span>Zoom in / out</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">One-finger drag</kbd><span>Pan the canvas</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Tap component in sidebar</kbd><span>Select component to place</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Tap canvas</kbd><span>Place selected component</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">Reset / Verify / Next</kbd><span>Main puzzle actions from navbar buttons</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">⋯ More menu</kbd><span>Pause, Step, Zoom, Help, Glossary on small screens</span></li>
                            <li style="display:flex;align-items:baseline;gap:10px;"><kbd class="ctrl-key">ℹ️ button</kbd><span>Open this controls reference</span></li>
                        </ul>
                    </div>
                    <button id="btn-close-controls-info-bottom" class="btn primary" style="margin-top:16px;width:100%;">Close</button>
                </div>
            </div>
        `;
    }

    setupListeners() {
        const updateNavbarHeight = () => {
            if (!this.navbar) return;
            document.documentElement.style.setProperty('--navbar-height', `${this.navbar.offsetHeight}px`);
        };
        updateNavbarHeight();
        window.addEventListener('resize', updateNavbarHeight);

        // More actions modal (small devices)
        const moreOpenBtn = document.getElementById('btn-more-open');
        const moreModal = document.getElementById('nav-more-modal');
        const moreCloseBtn = document.getElementById('btn-more-close');
        const moreBackdrop = moreModal ? moreModal.querySelector('.nav-more-modal-backdrop') : null;
        const moreModalCard = moreModal ? moreModal.querySelector('.nav-more-modal-card') : null;
        let _prevFocusBeforeMore = null;

        // Ensure the modal is inert/hidden by default so focusable descendants are disabled
        if (moreModal) {
            try { moreModal.inert = true; } catch (e) { /* inert may not be supported in older browsers */ }
            moreModal.setAttribute('aria-hidden', 'true');
            moreModal.classList.add('hidden');
        }

        const openMoreModal = () => {
            if (!moreModal) return;
            const xp = document.getElementById('xp-display');
            const xpModal = document.getElementById('xp-display-modal');
            if (xp && xpModal) xpModal.innerText = xp.innerText;

            // Save previous focus to return to after closing
            _prevFocusBeforeMore = document.activeElement;

            // Make modal visible and interactive
            moreModal.classList.remove('hidden');
            moreModal.setAttribute('aria-hidden', 'false');
            try { moreModal.inert = false; } catch (e) {}
            document.body.style.overflow = 'hidden';

            // Focus the dialog content so screen readers and keyboard users land inside it
            if (moreModalCard) {
                moreModalCard.setAttribute('tabindex', '-1');
                moreModalCard.focus();
            } else if (moreCloseBtn) {
                moreCloseBtn.focus();
            }
        };

        const closeMoreModal = () => {
            if (!moreModal) return;

            // Move focus back to the trigger (or the previous element) before hiding the modal
            if (moreOpenBtn) {
                try { moreOpenBtn.focus(); } catch (e) { /* ignore */ }
            } else if (_prevFocusBeforeMore) {
                try { _prevFocusBeforeMore.focus(); } catch (e) {}
            }

            // Make modal non-interactive and hidden
            try { moreModal.inert = true; } catch (e) {}
            moreModal.classList.add('hidden');
            moreModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';

            // Remove temporary tabindex we added
            if (moreModalCard) moreModalCard.removeAttribute('tabindex');
        };

        if (moreOpenBtn) {
            moreOpenBtn.addEventListener('click', () => {
                openMoreModal();
            });
        }
        if (moreCloseBtn) moreCloseBtn.addEventListener('click', closeMoreModal);
        if (moreBackdrop) moreBackdrop.addEventListener('click', closeMoreModal);

        if (moreModal) {
            moreModal.addEventListener('click', (e) => {
                const btn = e.target?.closest?.('[data-proxy]');
                if (!btn) return;
                const action = btn.getAttribute('data-proxy');
                const map = {
                    'glossary': 'btn-glossary',
                    'help': 'btn-help',
                    'sim-toggle': 'btn-sim-toggle',
                    'sim-step': 'btn-sim-step',
                    'zoom-in': 'btn-zoom-in',
                    'zoom-out': 'btn-zoom-out'
                };
                const targetId = map[action];
                const target = targetId ? document.getElementById(targetId) : null;
                if (target) target.click();
                closeMoreModal();
            });

            // Ensure that if focus somehow ends up inside the modal when it is hidden, we move it
            moreModal.addEventListener('focusin', (e) => {
                if (moreModal.getAttribute('aria-hidden') === 'true') {
                    // Move focus back to the opener
                    if (moreOpenBtn) moreOpenBtn.focus();
                }
            });

            // Basic focus trap while modal is open: cycle Tab within the modal card
            moreModal.addEventListener('keydown', (e) => {
                if (moreModal.getAttribute('aria-hidden') === 'true') return;
                if (e.key !== 'Tab') return;
                const focusables = moreModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const list = Array.prototype.filter.call(focusables, (el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
                if (!list.length) return;
                const first = list[0];
                const last = list[list.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            });
        }

        if (!window._navMoreModalKeyBound) {
            window._navMoreModalKeyBound = true;
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeMoreModal();
            });
        }

        // Mobile Sidebar Toggle + backdrop + swipe-to-close
        const btnToggle = document.getElementById('btn-toggle-sidebar');
        const sidebarBackdropId = 'sidebar-backdrop';
        const sidebarPanel = this.sidebarRoot || this.sidebar;

        // Ensure a backdrop element exists to capture outside taps and dim background
        if (!document.getElementById(sidebarBackdropId)) {
            const backdrop = document.createElement('div');
            backdrop.id = sidebarBackdropId;
            backdrop.className = 'sidebar-backdrop hidden';
            backdrop.setAttribute('aria-hidden', 'true');
            document.body.appendChild(backdrop);
        }
        const backdropEl = document.getElementById(sidebarBackdropId);
        const sidebarElementId = sidebarPanel && sidebarPanel.id ? sidebarPanel.id : 'sidebar';

        const openSidebar = () => {
            if (!sidebarPanel) return;
            sidebarPanel.classList.add('mobile-open');
            backdropEl.classList.remove('hidden');
            backdropEl.classList.add('visible');
            if (btnToggle) btnToggle.setAttribute('aria-expanded', 'true');
            // Prevent body from scrolling when the sidebar is open
            document.body.style.overflow = 'hidden';
        };

        const closeSidebar = () => {
            if (!sidebarPanel) return;
            sidebarPanel.classList.remove('mobile-open');
            backdropEl.classList.remove('visible');
            backdropEl.classList.add('hidden');
            if (btnToggle) btnToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        if (btnToggle) {
            btnToggle.setAttribute('aria-controls', sidebarElementId);
            btnToggle.setAttribute('aria-expanded', 'false');
            btnToggle.addEventListener('click', () => {
                if (sidebarPanel && sidebarPanel.classList.contains('mobile-open')) closeSidebar();
                else openSidebar();
            });
        }

        // Clicking the backdrop closes the sidebar
        if (backdropEl) backdropEl.addEventListener('click', closeSidebar);

        // Add simple swipe-to-close (left swipe) for touch devices
        let touchStartX = null;
        if (sidebarPanel) {
            sidebarPanel.addEventListener('touchstart', (e) => {
                touchStartX = e.touches && e.touches[0] ? e.touches[0].clientX : null;
            }, { passive: true });

            sidebarPanel.addEventListener('touchend', (e) => {
                if (touchStartX === null) return;
                const touchEndX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
                if (touchEndX !== null && touchStartX - touchEndX > 50) closeSidebar();
                touchStartX = null;
            }, { passive: true });
        }

        // Mode Tabs
        this.sidebar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.sidebar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                gameManager.startGame(mode);

                // Close mobile sidebar if open
                closeSidebar();

                const modeSelect = document.getElementById('mode-select-mobile');
                if (modeSelect) modeSelect.value = mode;
            });
        });

        // Mobile mode dropdown (mirrors the tab buttons)
        const modeSelect = document.getElementById('mode-select-mobile');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                const mode = e.target.value;
                if (mode === 'GAME') {
                    // Return to active puzzle: hide roadmap / overlays
                    document.getElementById('roadmap-overlay')?.classList.add('hidden');
                    document.getElementById('level-intro-overlay')?.classList.add('hidden');
                    return;
                }
                if (mode === 'STORY') {
                    // Always navigate to roadmap regardless of previous state
                    gameManager.startGame('STORY');
                    return;
                }
                const tab = this.sidebar.querySelector(`.tab-btn[data-mode="${mode}"]`);
                if (tab) tab.click();
            });
        }

        // Zoom Controls
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            globalEvents.emit(Events.ZOOM_CHANGED, { delta: 0.1 });
        });
        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            globalEvents.emit(Events.ZOOM_CHANGED, { delta: -0.1 });
        });

        // Controls-info button (replaces old hand/wire mode toggle)
        const modeToggleBtn = document.getElementById('btn-mode-toggle');
        const controlsInfoModal = document.getElementById('controls-info-modal');

        const setControlsTab = (tab) => {
            if (!controlsInfoModal) return;
            controlsInfoModal.querySelectorAll('.ctrl-tab-btn').forEach(b => b.classList.remove('active'));
            const activeBtn = controlsInfoModal.querySelector(`.ctrl-tab-btn[data-ctrl-tab="${tab}"]`);
            if (activeBtn) activeBtn.classList.add('active');

            controlsInfoModal.querySelectorAll('.ctrl-tab-panel').forEach(p => p.classList.add('hidden'));
            const panel = controlsInfoModal.querySelector(`#ctrl-panel-${tab}`);
            if (panel) panel.classList.remove('hidden');
        };

        const openControlsInfo = () => {
            if (!controlsInfoModal) return;
            setControlsTab('keyboard');
            controlsInfoModal.classList.remove('hidden');
            const closeBtn = controlsInfoModal.querySelector('#btn-close-controls-info');
            if (closeBtn) closeBtn.focus();
        };
        const closeControlsInfo = () => {
            controlsInfoModal?.classList.add('hidden');
            modeToggleBtn?.focus();
        };

        if (modeToggleBtn) {
            modeToggleBtn.addEventListener('click', openControlsInfo);
        }

        // Tab switching inside controls-info modal
        if (controlsInfoModal) {
            controlsInfoModal.querySelectorAll('.ctrl-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.ctrlTab || 'keyboard';
                    setControlsTab(tab);
                });
            });
            controlsInfoModal.querySelector('#btn-close-controls-info')?.addEventListener('click', closeControlsInfo);
            controlsInfoModal.querySelector('#btn-close-controls-info-bottom')?.addEventListener('click', closeControlsInfo);
            controlsInfoModal.addEventListener('click', (e) => {
                if (e.target === controlsInfoModal) closeControlsInfo();
            });
            controlsInfoModal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeControlsInfo();
            });
        }

        // Unified interaction mode – no select/wire toggle needed; always wire-unified.
        window.interactionMode = 'wire';
        globalEvents.emit('INTERACTION_MODE_CHANGED', { mode: 'wire' });

        // Help Button - show level intro/help for current mode
        document.getElementById('btn-help').addEventListener('click', () => {
            const level = gameManager.currentLevel;
            if (level) {
                // For non-story modes, index doesn't matter but pass a reasonable value
                const index = gameManager.mode === 'STORY' 
                    ? gameManager.levels.indexOf(level) 
                    : -1;
                this.showLevelIntro(level, index);
            }
        });

        // DEV MODE: Unlock All Levels
        document.getElementById('btn-dev-unlock').addEventListener('click', () => {
            this.devUnlockAll();
        });

        // Glossary Button - show reference guide
        document.getElementById('btn-glossary').addEventListener('click', () => {
            this.showGlossary();
        });

        // Instructions Button
        document.getElementById('btn-instructions').addEventListener('click', () => {
            this.showInstructions();
        });

        // Close Glossary
        document.getElementById('btn-close-glossary').addEventListener('click', () => {
            document.getElementById('glossary-overlay').classList.add('hidden');
        });

        // Glossary tab switching
        document.querySelectorAll('.glossary-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.glossary-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                HUDGlossary.renderGlossaryTab(e.target.dataset.tab);
            });
        });

        // Glossary search
        document.getElementById('glossary-search-input').addEventListener('input', (e) => {
            HUDGlossary.filterGlossary(e.target.value);
        });

        // Close term popup
        document.getElementById('btn-close-term-popup').addEventListener('click', () => {
            document.getElementById('term-popup').classList.add('hidden');
        });

        // Close term popup when clicking outside
        document.getElementById('term-popup').addEventListener('click', (e) => {
            if (e.target.id === 'term-popup') {
                document.getElementById('term-popup').classList.add('hidden');
            }
        });

        // Close Instructions
        document.getElementById('btn-close-instructions').addEventListener('click', () => {
            document.getElementById('instruction-overlay').classList.add('hidden');
        });

        // Hint button inside instructions overlay
        document.getElementById('btn-show-hint').addEventListener('click', () => {
            const hintDiv = document.getElementById('instruction-hint');
            const level = gameManager.currentLevel || {};
            const hintText = level.hint || 'No hint available for this level.';
            hintDiv.innerHTML = HUDUtils.formatStoryText(hintText);
            hintDiv.classList.remove('hidden');

            if (level.hint) {
                globalEvents.emit(Events.HINT_REQUESTED, {
                    levelId: level.id,
                    variant: gameManager.currentVariant,
                    source: 'instruction-overlay'
                });

                // Animation: red glowing -1
                let anim = document.createElement('div');
                anim.className = 'hint-anim-minus';
                anim.textContent = '-1';
                document.body.appendChild(anim);
                // Position over the button
                const btn = document.getElementById('btn-show-hint');
                if (btn) {
                    const rect = btn.getBoundingClientRect();
                    anim.style.left = `${rect.left + rect.width / 2 - 8}px`;
                    anim.style.top = `${rect.top - 20}px`;
                }
                setTimeout(() => {
                    anim.classList.add('hint-anim-minus-fade');
                }, 10);
                setTimeout(() => {
                    anim.remove();
                }, 900);
            }
        });

        // Start Level (from intro) - Show loading screen when user clicks to start game
        document.getElementById('btn-start-level').addEventListener('click', () => {
            // If intro level (index 0), it's an info-only page.
            // Keep the overlay up and swap to Level 1 intro after loading.
            if (gameManager.currentLevelIndex === 0) {
                gameManager.completeLevel(100);
                gameManager.loadLevel(1);
                return;
            }

            // Hide intro overlay and show loading screen while game screen loads
            document.getElementById('level-intro-overlay').classList.add('hidden');
            
            const levelTitle = gameManager.currentLevel?.title || `Level ${gameManager.currentLevelIndex}`;
            LoadingScreen.show({
                message: `Loading ${levelTitle}...`,
                hint: 'Preparing game screen'
            });

            // Queue game screen load as normal priority (5)
            // This allows subsequent user clicks to interrupt if they click another level
            asyncQueue.add(async () => {
                try {
                    // Emit event to signal game screen should be prepared
                    globalEvents.emit(Events.GAME_START_REQUESTED, {
                        level: gameManager.currentLevel,
                        index: gameManager.currentLevelIndex
                    });
                    
                    // Give renderer time to set up
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (err) {
                    console.error('Failed to prepare game screen:', err);
                } finally {
                    LoadingScreen.hide();
                }
            }, 5).catch(() => {}); // Catch cancellations to avoid unhandled promise rejections
        });

        // Back to roadmap (from intro)
        document.getElementById('btn-back-to-roadmap').addEventListener('click', () => {
            document.getElementById('level-intro-overlay').classList.add('hidden');
            this.showRoadmap();
        });
        
        // Toolbox scrolling helpers: show 'back to top' when scrolled, and detect overflow
        (function() {
            const toolboxBody = document.querySelector('.toolbox-body');
            const btnTop = document.getElementById('btn-toolbox-top');
            if (!toolboxBody || !btnTop) return;

            // Show/hide back-to-top button based on scroll position
            toolboxBody.addEventListener('scroll', () => {
                btnTop.style.display = toolboxBody.scrollTop > 60 ? 'flex' : 'none';
            });

            btnTop.addEventListener('click', () => {
                toolboxBody.scrollTo({ top: 0, behavior: 'smooth' });
                btnTop.style.display = 'none';
            });

            // Mark if toolbox has scrollable content
            const updateOverflow = () => {
                if (toolboxBody.scrollHeight > toolboxBody.clientHeight) {
                    toolboxBody.classList.add('has-scroll');
                } else {
                    toolboxBody.classList.remove('has-scroll');
                }
            };
            setTimeout(updateOverflow, 200);
            window.addEventListener('resize', updateOverflow);

            // Expose a small helper for updateToolbox to trigger check
            document._updateToolboxOverflow = updateOverflow;
        })();

        // Close roadmap to continue playing
        document.getElementById('btn-close-roadmap').addEventListener('click', () => {
            document.getElementById('roadmap-overlay').classList.add('hidden');
            globalEvents.emit(Events.UI_OVERLAY_CLOSED, { overlay: 'roadmap' });
        });

        document.getElementById('btn-roadmap-certification').addEventListener('click', () => {
            certificationModal.open(gameManager.getCertification());
        });
        
        // Roadmap level selection with priority for user interactions
        // User clicks interrupt background prefetch and supersede earlier clicks
        document.getElementById('roadmap-tiers').addEventListener('click', (e) => {
            const levelBtn = e.target.closest('.roadmap-level');
            if (levelBtn && !levelBtn.classList.contains('locked')) {
                const levelIndex = parseInt(levelBtn.dataset.levelIndex);
                // Determine selected variant (if any)
                const select = levelBtn.querySelector('.variant-select');
                const variant = select ? select.value : 'easy';

                // Roadmap stays visible until LEVEL_LOADED shows the intro overlay
                // (avoids flash of bare puzzle canvas during async load)

                // Queue level load as HIGH priority (10) - user interaction
                // This will interrupt any low-priority background tasks and any previous roadmap loads
                asyncQueue.add(async (signal) => {
                    const requestId = `roadmap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                    try {
                        // Load level data (theory, variants, etc) - no loading screen yet
                        // This shows intro immediately when complete
                        await gameManager.loadLevel(levelIndex, variant, {
                            requestId,
                            signal
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError' && err.message !== 'Queue cleared') {
                            console.error('Failed to load level:', err);
                        }
                    }
                }, 10);
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            this.circuit.reset();
            gameManager.restartLevel();
        });

        document.getElementById('btn-check').addEventListener('click', () => {
            const level = gameManager.currentLevel;
            if (level && (level.targetTruthTable || level.targetSequence)) {
                import('../core/Validator.js').then(({ Validator }) => {
                    Validator.validate(this.circuit, level);
                });
            }
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            // Handle mode-specific next behavior
            if (gameManager.mode === 'ENDLESS') {
                gameManager.nextEndlessChallenge();
            } else {
                gameManager.nextLevel();
            }
        });

        // Simulation controls (for sequential labs)
        let paused = false;
        const toggleBtn = document.getElementById('btn-sim-toggle');
        const stepBtn = document.getElementById('btn-sim-step');

        toggleBtn.addEventListener('click', () => {
            paused = !paused;
            toggleBtn.innerText = paused ? 'Resume' : 'Pause';
            globalEvents.emit(paused ? Events.SIMULATION_PAUSED : Events.SIMULATION_RESUMED);
        });

        stepBtn.addEventListener('click', () => {
            globalEvents.emit(Events.SIMULATION_STEP);
        });
    }

    bindEvents() {
        // Show level intro for all modes when showIntro is true
        globalEvents.on(Events.LEVEL_LOADED, (data) => {
            this.updateLevelInfo(data.level);
            this.updateToolbox(gameManager.getAvailableGates());

            // In Story mode, switch mobile mode-select to "Game" so the user
            // can always re-select "Story" to navigate back to the roadmap.
            const modeSelectEl = document.getElementById('mode-select-mobile');
            if (modeSelectEl && gameManager.mode === 'STORY') modeSelectEl.value = 'GAME';
            
            // Next button logic depends on mode
            const nextBtn = document.getElementById('btn-next');
            if (gameManager.mode === 'DESIGNER') {
                nextBtn.disabled = true;
                nextBtn.style.display = data.level.targetTruthTable ? '' : 'none';
            } else if (gameManager.mode === 'ENDLESS') {
                nextBtn.disabled = true;
                nextBtn.style.display = '';
                nextBtn.innerText = 'Next Challenge';
            } else {
                // STORY mode: enable only if current level/variant is completed
                this.updateNextButtonState();
                nextBtn.style.display = '';
                nextBtn.innerText = 'Next';
            }
            
            // Show intro/info for all modes when requested
            const shouldShowIntro = data.showIntro !== false;
            if (shouldShowIntro) {
                this.showLevelIntro(data.level, data.index);
            }
            // Hide roadmap now that intro (or level) is ready – no flash
            document.getElementById('roadmap-overlay').classList.add('hidden');
        });
        
        globalEvents.on(Events.MODE_CHANGED, (data) => {
            // Keep the mobile dropdown in sync
            const modeSelectEl = document.getElementById('mode-select-mobile');
            if (data.mode === 'STORY') {
                // Always show roadmap when Story mode is selected
                document.getElementById('level-intro-overlay').classList.add('hidden');
                this.showRoadmap();
                // Roadmap is visible → show "Story" in dropdown so next pick of
                // a level will switch dropdown to "Game"
                if (modeSelectEl) modeSelectEl.value = 'STORY';
            } else {
                document.getElementById('roadmap-overlay').classList.add('hidden');
                if (modeSelectEl) modeSelectEl.value = data.mode;
            }
        });

        globalEvents.on(Events.MESSAGE_DISPLAYED, (data) => {
            this.showMessage(data.text, data.type || 'info');
        });

        globalEvents.on(Events.XP_GAINED, (data) => {
            document.getElementById('xp-display').innerText = data.total;
        });

        globalEvents.on(Events.PUZZLE_VERIFIED, (data) => {
            const nextBtn = document.getElementById('btn-next');
            if (data.valid) {
                const mode = gameManager.mode;
                if (mode === 'DESIGNER') {
                    this.showMessage(`Circuit verified! Score: ${data.score}%`, 'success');
                    if (gameManager.currentLevel.targetTruthTable) nextBtn.disabled = false;
                } else if (mode === 'ENDLESS') {
                    this.showMessage(`Challenge Complete! Score: ${data.score}% - Ready for next challenge!`, 'success');
                    nextBtn.disabled = false;
                } else {
                    // STORY mode: don't enable next button on verification, only on completion
                    this.showMessage(`Success! Score: ${data.score}%`, 'success');
                }
            } else {
                this.showMessage(`Failed. ${data.failedCases.length} incorrect cases.`, 'error');
            }
        });
        
        globalEvents.on(Events.LEVEL_COMPLETE, () => {
            this.updateNextButtonState();
        });

        globalEvents.on(Events.ZOOM_CHANGED, (data) => {
            // Handled by ZOOM_UPDATED
        });
        
        globalEvents.on(Events.ZOOM_UPDATED, (data) => {
            const display = document.getElementById('zoom-display');
            if (display && data.percent) {
                display.innerText = `${data.percent}%`;
            }
        });
        
        // Physics-first: Show simulation status including metastability
        globalEvents.on(Events.SIMULATION_TICK, (data) => {
            const sim = data.simulation;
            if (sim && sim.hasMetastability) {
                this.showMessage(`⚠️ Metastable state detected! ${sim.physicsNote}`, 'warning');
            } else if (sim && sim.oscillating) {
                this.showMessage(`⚡ Circuit oscillating! ${sim.physicsNote}`, 'warning');
            }
        });
    }

    updateLevelInfo(level) {
        // Build navbar variant selector (single source of truth)
        const levelId = String(level?.id || '');
        const baseLevelId = levelId.replace(/_(easy|medium|hard|expert)$/i, '');
        const variants = (gameManager.levelVariants && gameManager.levelVariants[baseLevelId]) || {};
        const hasVariants = Object.keys(variants).length > 0;

        // Determine selected variant for current level
        let selected = (gameManager.currentVariant && variants[gameManager.currentVariant]) ? gameManager.currentVariant : (variants.easy ? 'easy' : (Object.keys(variants)[0] || 'easy'));

        const cleanTitle = level.title.replace(/\s*\(.*?\)$/, '');
        const titleEl = document.getElementById('level-title');
        const inlineSel = document.getElementById('nav-variant-select-inline');

        if (hasVariants) {
            const allVariants = ['easy','medium','hard','expert'];
            const optionsHtml = allVariants.map(v => variants[v] ? `<option value="${v}" ${v === selected ? 'selected' : ''}>${DIFFICULTY_LABELS[v] || v}</option>` : '').join('');
            
            // Set title text only
            titleEl.textContent = cleanTitle;

            // Populate inline selector and style it
            if (inlineSel) {
                inlineSel.innerHTML = optionsHtml;
                inlineSel.classList.remove('badge-easy','badge-medium','badge-hard','badge-expert');
                inlineSel.classList.add(`badge-${selected}`);
                inlineSel.value = selected;
                inlineSel.style.display = 'inline-block';

                inlineSel.onchange = (e) => {
                    const v = e.target.value;
                    inlineSel.classList.remove('badge-easy','badge-medium','badge-hard','badge-expert');
                    inlineSel.classList.add(`badge-${v}`);
                    gameManager.loadLevel(gameManager.currentLevelIndex, v, { showIntro: false });
                    this.updateNextButtonState();
                };
            }
        } else {
            titleEl.textContent = cleanTitle;
            if (inlineSel) {
                inlineSel.innerHTML = '';
                inlineSel.style.display = 'none';
                inlineSel.classList.remove('badge-easy','badge-medium','badge-hard','badge-expert');
            }
        }

        // Update navbar height CSS variable
        if (this.navbar) {
            document.documentElement.style.setProperty('--navbar-height', `${this.navbar.offsetHeight}px`);
        }
    }

    /**
     * Update the next button enabled state based on current variant completion
     */
    updateNextButtonState() {
        const nextBtn = document.getElementById('btn-next');
        if (!nextBtn || gameManager.mode === 'DESIGNER') return;

        const level = gameManager.currentLevel;
        if (!level) return;

        const completedLevels = gameManager.progress.completedLevels[level.id] || {};
        const isCompleted = completedLevels[gameManager.currentVariant] === true;

        nextBtn.disabled = !isCompleted;
    }

    updateToolbox(gates) {
        const list = document.getElementById('gate-list');
        list.innerHTML = '';

        gates.forEach(gate => {
            const item = document.createElement('div');
            item.className = 'gate-item';
            item.dataset.type = gate.id;
            item.draggable = true;
            
            // Add component shape/icon
            const iconSvg = this.getGateIcon(gate.id);
            item.innerHTML = `
                <div class="gate-icon">${iconSvg}</div>
                <span class="gate-name">${gate.name}</span>
            `;
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('gateType', gate.id);
            });
            item.addEventListener('click', () => {
                const isMobile = window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(max-width: 600px)').matches);
                if (isMobile) {
                    globalEvents.emit(Events.GATE_SELECT, { gateId: gate.id });
                    // Optionally show a message
                    this.showMessage(`Selected ${gate.name}. Tap on canvas to place.`);
                } else {
                    this.circuit.addGate(gate.id, 100, 100);
                }
            });
            list.appendChild(item);
        });

        // Notify overflow helper (if present) after toolbox update
        if (typeof document._updateToolboxOverflow === 'function') document._updateToolboxOverflow();
    }

    getGateIcon(gateId) {
        return HUDVisuals.getGateIcon(gateId);
    }

    showMessage(text, type = 'info') {
        const area = document.getElementById('message-area');
        if (!area) return;
        area.innerText = text;
        area.className = `message-area ${type}`;
        setTimeout(() => {
            area.innerText = '';
            area.className = 'message-area';
        }, 3000);
    }

    showInstructions(level = gameManager.currentLevel) {
        
        if (!level) return;
        const difficulty = gameManager.currentVariant || 'easy';
        const cleanTitle = level.title.replace(/\s*\(.*?\)$/, '');
        document.getElementById('instruction-title').innerHTML = `${cleanTitle} - <span class="difficulty-text difficulty-${difficulty}">${difficulty.toUpperCase()} Mode</span>`;
        document.getElementById('instruction-text').innerHTML = HUDEducation.getInstructionsHtml(level, difficulty);
        // Hide and clear hint box every time instructions are shown (fixes hint persisting across difficulty changes)
        const hintDiv = document.getElementById('instruction-hint');
        if (hintDiv) {
            hintDiv.classList.add('hidden');
            hintDiv.innerHTML = '';
        }
        document.getElementById('instruction-overlay').classList.remove('hidden');

    }

    showLevelIntro(level, index) {
        
        if (!level) return;
        
        const mode = gameManager.mode;
        const tierInfo = gameManager.tiers[level.tier] || {};
        const isFirstInTier = mode === 'STORY' && gameManager.levels.findIndex(l => l.tier === level.tier) === index;
        
        // Mode-specific tier title
        let tierTitle = '';
        let levelTitle = '';
        
        if (mode === 'DESIGNER') {
            tierTitle = '🛠️ Circuit Designer';
            levelTitle = level.title || 'Circuit Designer';
        } else if (mode === 'ENDLESS') {
            tierTitle = '🔄 Endless Mode';
            levelTitle = level.title || `Challenge Level ${level.difficulty || 1}`;
        } else {
            // Story mode
            tierTitle = isFirstInTier ? `New Chapter: ${tierInfo.name || ''}` : (tierInfo.name || '');
            levelTitle = level.baseTitle || level.title;
        }
        
        document.getElementById('intro-tier-title').innerText = tierTitle;
        document.getElementById('intro-level-title').innerText = levelTitle;
        
        document.getElementById('intro-visual').style.display = 'none';
        document.getElementById('intro-text').innerHTML = HUDEducation.getIntroductionHtml(level, index, tierInfo, isFirstInTier);
        
        const startBtn = document.getElementById('btn-start-level');
        const backBtn = document.getElementById('btn-back-to-roadmap');
        
        // Mode-specific button labels
        if (mode === 'DESIGNER') {
            startBtn.innerText = 'Open Workbench →';
            backBtn.style.display = 'none';
        } else if (mode === 'ENDLESS') {
            startBtn.innerText = 'Accept Challenge →';
            backBtn.style.display = 'none';
        } else {
            // Story mode
            startBtn.innerText = index === 0 ? 'Go to Level 1 →' : 'Start Level →';
            backBtn.style.display = '';
        }
        
        document.getElementById('level-intro-overlay').classList.remove('hidden');
        const introContent = document.querySelector('.intro-content');
        if (introContent) introContent.scrollTop = 0;

    }

    generateLevelVisuals(level) {
        const visuals = this.getLevelVisualList(level);
        if (!visuals.length) return this.generateLevelVisual(level);

        return `
            <div class="visual-stack">
                ${visuals.map(v => {
                    const title = v.title ? `<div class="visual-caption">${v.title}</div>` : '';
                    return `<div class="visual-item">${title}${this.generatePhysicsVisual(v.type)}</div>`;
                }).join('')}
            </div>
        `;
    }

    getLevelVisualList(level) {
        return HUDEducation.getLevelVisualList(level);
    }

    generateLevelVisual(level) {
        return HUDVisuals.generateLevelVisual(level);
    }


    generatePhysicsVisual(type) {
        return HUDVisuals.generatePhysicsVisual(type);
    }

    renderPhysicsDetails(details, level = null) {
        return HUDEducation.renderPhysicsDetails(details, level);
    }

    /**
     * Render the new detailed physics content schema with full explanations
     */
    renderDetailedPhysicsContent(details, visualsObj = { global: [], concept: [] }) {
        return HUDEducation.renderDetailedPhysicsContent(details, visualsObj);
    }

    renderCurriculumOverview(level) {
        return HUDEducation.renderCurriculumOverview(level);
    }

    assignVisualsToConceptCards(conceptCards, visuals) {
        return HUDEducation.assignVisualsToConceptCards(conceptCards, visuals);
    }

    getVisualKeywords(type) {
        return HUDEducation.getVisualKeywords ? HUDEducation.getVisualKeywords(type) : [];
    }

    scoreConceptCardForKeywords(card, keywords) {
        return HUDEducation.scoreConceptCardForKeywords ? HUDEducation.scoreConceptCardForKeywords(card, keywords) : 0;
    }

    renderConceptCard(card, visualsForCard = []) {
        return HUDEducation.renderConceptCard(card, visualsForCard);
    }

    renderFormulaCard(card) {
        if (typeof card === 'string') {
            return this.renderEquationWithExplanation(card);
        }

        const formula = card.formula || card.latex || card.equation || '';
        const name = card.name || '';
        const variables = Array.isArray(card.variables) ? card.variables : [];
        const meaning = card.meaning || '';
        const derivation = card.derivation || '';
        const example = card.example || null;
        const units = card.units || '';

        let html = `<div class="formula-card">`;

        if (name) {
            html += `<h4 class="formula-name">${this.escapeHtml(name)}</h4>`;
        }

        html += `<div class="formula-main"><code>${this.formatEquation(formula, card.html)}</code></div>`;

        if (variables.length > 0) {
            const varList = variables.map(v => {
                if (typeof v === 'string') return `<li>${this.formatEquation(v)}</li>`;
                return `<li><span class="var-symbol">${this.formatEquation(v.symbol || '')}</span> = ${this.escapeHtml(v.meaning || v.name || '')}${v.units ? ` <span class="var-units">[${this.escapeHtml(v.units)}]</span>` : ''}</li>`;
            }).join('');
            html += `<div class="formula-variables"><strong>Variables:</strong><ul>${varList}</ul></div>`;
        }

        if (meaning) {
            html += `<div class="formula-meaning"><strong>Physical meaning:</strong> ${this.escapeHtml(meaning)}</div>`;
        }

        if (derivation) {
            html += `<div class="formula-derivation"><strong>Where it comes from:</strong> ${this.escapeHtml(derivation)}</div>`;
        }

        if (Array.isArray(card.rearrangements) && card.rearrangements.length > 0) {
            const rearrangeList = card.rearrangements.map(r => {
                const f = typeof r === 'string' ? r : (r.formula || '');
                const m = typeof r === 'string' ? '' : (r.meaning || '');
                return `<li><code>${this.formatEquation(f, r.html)}</code>${m ? ` — ${this.escapeHtml(m)}` : ''}</li>`;
            }).join('');
            html += `<div class="formula-rearrangements"><strong>Also written as:</strong><ul>${rearrangeList}</ul></div>`;
        }

        if (example) {
            html += this.renderWorkedExample(example);
        }

        if (units) {
            html += `<div class="formula-units"><strong>Units:</strong> ${this.escapeHtml(units)}</div>`;
        }

        html += '</div>';
        return html;
    }

    renderWorkedExample(example) {
        return HUDEducation.renderWorkedExample(example);
    }

    renderExerciseItem(exercise, num) {
        if (typeof exercise === 'string') {
            return `<div class="exercise-item"><span class="exercise-num">${num}.</span> ${this.escapeHtml(exercise)}</div>`;
        }

        let html = `<div class="exercise-item">
            <span class="exercise-num">${num}.</span>
            <div class="exercise-content">`;

        if (exercise.question || exercise.problem) {
            html += `<div class="exercise-question">${this.escapeHtml(exercise.question || exercise.problem)}</div>`;
        }

        if (exercise.hint) {
            html += `<details class="exercise-hint"><summary>Hint</summary>${this.formatEquation(exercise.hint)}</details>`;
        }

        if (exercise.answer) {
            let answerHtml = '<details class="exercise-answer"><summary>Answer</summary>';
            if (typeof exercise.answer === 'string') {
                answerHtml += this.formatEquation(exercise.answer);
            } else if (typeof exercise.answer === 'object' && exercise.answer.steps) {
                if (exercise.answer.steps.length > 0) {
                    answerHtml += '<ol class="solution-steps">';
                    exercise.answer.steps.forEach(step => {
                        answerHtml += `<li>${this.formatEquation(HUDUtils.normalizeStepText(step))}</li>`;
                    });
                    answerHtml += '</ol>';
                }
                if (exercise.answer.answer) {
                    answerHtml += `<p><strong>Final Answer:</strong> ${this.formatEquation(exercise.answer.answer)}</p>`;
                }
            } else {
                answerHtml += this.escapeHtml(JSON.stringify(exercise.answer));
            }
            answerHtml += '</details>';
            html += answerHtml;
        }

        html += '</div></div>';
        return html;
    }

    renderRealWorldDetailed(rw) {
        return HUDEducation.renderRealWorldDetailed(rw);
    }

    /**
     * Provide a short explanation for common physics/electronics concepts
     */
    explainConcept(concept) {
        return HUDEducation.explainConcept(concept);
    }

    /**
     * Render an equation with a detailed breakdown
     */
    renderEquationWithExplanation(eq) {
        const explanation = this.getEquationExplanation(eq);
        return `<li>
            <div class="equation-block">
                <div class="equation-formula">${this.formatEquation(eq)}</div>
                ${explanation ? `<div class="equation-explain">${explanation}</div>` : ''}
            </div>
        </li>`;
    }

    formatEquation(eq, prerenderedHtml = null) {
        return HUDUtils.formatEquation(eq, prerenderedHtml);
    }

    getEquationExplanation(eq) {
        return HUDEducation.getEquationExplanation(eq);
    }

    formatStoryText(text) {
        return HUDUtils.formatStoryText(text);
    }

    escapeHtml(value) {
        return HUDUtils.escapeHtml(value);
    }

    renderExercises(level) {
        return HUDEducation.renderExercises(level);
    }
    
    showRoadmap() {
        // Sync the dev unlock button icon state
        const btn = document.getElementById('btn-dev-unlock');
        if (btn) {
            const isDevUnlocked = gameManager.progress.devMode;
            btn.textContent = isDevUnlocked ? '🔓' : '🔒';
            btn.title = isDevUnlocked ? 'Unlocked (Dev Mode)' : 'Levels Locked (default)';
        }
        HUDRoadmap.showRoadmap();
    }

    /**
     * DEV MODE: Toggle lock / unlock all tiers for testing
     */
    devUnlockAll() {
        // Toggle the explicit devMode flag
        gameManager.progress.devMode = !gameManager.progress.devMode;
        
        // Let recalculate methods handle the state based on the flag
        gameManager.recalculateProgressXP();
        gameManager.recalculateTiers();
        gameManager.saveProgress();

        const isDevUnlocked = gameManager.progress.devMode;
        const btn = document.getElementById('btn-dev-unlock');
        if (btn) {
            btn.textContent = isDevUnlocked ? '🔓' : '🔒';
            btn.title = isDevUnlocked ? 'Unlocked (Dev Mode)' : 'Levels Locked (default)';
        }

        if (isDevUnlocked) {
            console.log('🔓 DEV MODE activated: All tiers unlocked, XP set to 9999');
        } else {
            console.log(`🔒 DEV MODE deactivated: Tiers restored to legitimate progress (XP: ${gameManager.progress.xp})`);
        }

        // Always update the navbar XP display when switching modes
        const xpDisplay = document.getElementById('xp-display');
        if (xpDisplay) {
            xpDisplay.innerText = gameManager.progress.xp;
        }

        // Refresh roadmap if visible
        if (!document.getElementById('roadmap-overlay').classList.contains('hidden')) {
            HUDRoadmap.showRoadmap();
        }
    }

    /**
     * Show the Glossary overlay with terms, acronyms, and formulas
     */
    async showGlossary(initialTab = 'acronyms') {
        HUDGlossary.showGlossary(initialTab);
    }

    /**
     * Render glossary content for a specific tab (delegate to HUDGlossary)
     */
    async renderGlossaryTab(tabName) {
        HUDGlossary.renderGlossaryTab(tabName);
    }

    /**
     * Filter glossary based on search term (delegate to HUDGlossary)
     */
    filterGlossary(searchTerm) {
        HUDGlossary.filterGlossary(searchTerm);
    }

    /**
     * Show a term definition popup (delegate to HUDGlossary)
     */
    async showTermPopup(termKey, x, y) {
        HUDGlossary.showTermPopup(termKey, x, y);
    }

    /**
     * Extract level number from level_XX format
     */
    extractLevelNumber(levelId) {
        if (!levelId) return 0;
        const match = String(levelId).match(/level_(\d+|boss)/i);
        if (match) {
            if (match[1].toLowerCase() === 'boss') return 20;
            return parseInt(match[1], 10);
        }
        return 0;
    }

    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        if (!category) return 'Other';
        return category
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Show roadmap with loading message during initial load
     */
    showLoadingRoadmap() {
        const overlay = document.getElementById('roadmap-overlay');
        const tiersContainer = document.getElementById('roadmap-tiers');
        const xpDisplay = document.getElementById('roadmap-xp');
        const hintsUsedDisplay = document.getElementById('roadmap-hints-used');
        const hintsTotalDisplay = document.getElementById('roadmap-hints-total');
        
        if (!overlay || !tiersContainer) return;
        
        // Show loading content
        tiersContainer.innerHTML = `
            <div class="loading-roadmap">
                <div class="loading-spinner"></div>
                <h2>Loading Logic Architect...</h2>
                <p>Preparing your journey through digital logic</p>
            </div>
        `;
        
        if (xpDisplay) {
            xpDisplay.innerText = 'Loading...';
        }
        if (hintsUsedDisplay) {
            hintsUsedDisplay.innerText = '...';
        }
        if (hintsTotalDisplay) {
            hintsTotalDisplay.innerText = '...';
        }
        
        // Show the overlay
        overlay.classList.remove('hidden');
    }

    /**
     * Make terms in HTML content clickable for definitions (delegate to HUDGlossary)
     */
    async linkifyTerms(html) {
        return HUDGlossary.linkifyTerms(html);
    }
}
