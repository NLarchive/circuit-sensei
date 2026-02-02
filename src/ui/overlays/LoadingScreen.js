/**
 * LoadingScreen - Reusable loading/transition screen component
 * 
 * A standalone, reusable loading screen that can be used across different projects.
 * Features:
 * - Animated spinner with customizable appearance
 * - Configurable loading messages
 * - Progress indication (optional)
 * - Promise-based API for async operations
 * - Accessible (ARIA live regions, reduced motion support)
 * 
 * @example
 * // Basic usage - show until promise resolves
 * await LoadingScreen.waitFor(fetchData(), { message: 'Loading level...' });
 * 
 * // Manual control
 * LoadingScreen.show({ message: 'Preparing game...' });
 * await someAsyncOperation();
 * LoadingScreen.hide();
 * 
 * // With progress
 * LoadingScreen.show({ showProgress: true });
 * LoadingScreen.setProgress(50, 'Half way there...');
 * LoadingScreen.hide();
 */

class LoadingScreenClass {
    constructor() {
        this.element = null;
        this.isVisible = false;
        this.minDisplayTime = 300; // Minimum time to show (prevents flash)
        this.showTime = 0;
        this.pendingHide = null;
    }

    /**
     * Initialize the loading screen DOM element
     * Called automatically on first use
     */
    init() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.id = 'loading-screen';
        this.element.className = 'loading-screen hidden';
        this.element.setAttribute('role', 'alert');
        this.element.setAttribute('aria-live', 'polite');
        this.element.setAttribute('aria-busy', 'false');
        
        this.element.innerHTML = `
            <div class="loading-screen-content">
                <div class="loading-screen-spinner" aria-hidden="true">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-screen-message" id="loading-message">Loading...</div>
                <div class="loading-screen-progress hidden" id="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="loading-progress-fill"></div>
                    </div>
                    <span class="progress-text" id="loading-progress-text">0%</span>
                </div>
                <div class="loading-screen-hint" id="loading-hint"></div>
            </div>
        `;

        document.body.appendChild(this.element);
        this.injectStyles();
    }

    /**
     * Inject CSS styles for the loading screen
     * Self-contained for portability
     */
    injectStyles() {
        if (document.getElementById('loading-screen-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'loading-screen-styles';
        styles.textContent = `
            .loading-screen {
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 1;
                transition: opacity 0.3s ease-out;
            }
            
            .loading-screen.hidden {
                opacity: 0;
                pointer-events: none;
                visibility: hidden;
            }
            
            .loading-screen.fade-out {
                opacity: 0;
                pointer-events: none;
            }
            
            .loading-screen-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                text-align: center;
                padding: 40px;
            }
            
            .loading-screen-spinner {
                position: relative;
                width: 80px;
                height: 80px;
            }
            
            .spinner-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 4px solid transparent;
                border-top-color: var(--primary-color, #00d4ff);
                animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            }
            
            .spinner-ring:nth-child(2) {
                inset: 8px;
                border-top-color: var(--accent-color, #ff6b6b);
                animation-delay: -0.15s;
            }
            
            .spinner-ring:nth-child(3) {
                inset: 16px;
                border-top-color: var(--success-color, #4ecdc4);
                animation-delay: -0.3s;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .spinner-ring {
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            }
            
            .loading-screen-message {
                font-size: 1.25rem;
                color: var(--text-color, #e0e0e0);
                font-weight: 500;
                max-width: 300px;
            }
            
            .loading-screen-progress {
                width: 200px;
            }
            
            .loading-screen-progress.hidden {
                display: none;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-color, #00d4ff), var(--accent-color, #ff6b6b));
                border-radius: 4px;
                width: 0%;
                transition: width 0.3s ease-out;
            }
            
            .progress-text {
                font-size: 0.875rem;
                color: var(--text-muted, #888);
                margin-top: 8px;
                display: block;
            }
            
            .loading-screen-hint {
                font-size: 0.875rem;
                color: var(--text-muted, #888);
                font-style: italic;
                max-width: 280px;
                min-height: 1.5em;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Show the loading screen
     * @param {Object} options - Display options
     * @param {string} options.message - Loading message to display
     * @param {string} options.hint - Optional hint text
     * @param {boolean} options.showProgress - Whether to show progress bar
     */
    show(options = {}) {
        this.init();
        
        const {
            message = 'Loading...',
            hint = '',
            showProgress = false
        } = options;

        // Update content
        const messageEl = this.element.querySelector('#loading-message');
        const hintEl = this.element.querySelector('#loading-hint');
        const progressEl = this.element.querySelector('#loading-progress');

        if (messageEl) messageEl.textContent = message;
        if (hintEl) hintEl.textContent = hint;
        if (progressEl) progressEl.classList.toggle('hidden', !showProgress);

        // Cancel any pending hide
        if (this.pendingHide) {
            clearTimeout(this.pendingHide);
            this.pendingHide = null;
        }

        // Show the screen
        this.element.classList.remove('hidden', 'fade-out');
        this.element.setAttribute('aria-busy', 'true');
        this.isVisible = true;
        this.showTime = Date.now();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide the loading screen
     * Respects minimum display time to prevent flashing
     * @param {Object} options - Hide options
     * @param {boolean} options.immediate - Skip fade animation
     */
    hide(options = {}) {
        if (!this.element || !this.isVisible) return;

        const { immediate = false } = options;
        
        // Ensure minimum display time
        const elapsed = Date.now() - this.showTime;
        const remaining = Math.max(0, this.minDisplayTime - elapsed);

        const doHide = () => {
            if (!this.element) return;
            
            if (immediate) {
                this.element.classList.add('hidden');
            } else {
                this.element.classList.add('fade-out');
                setTimeout(() => {
                    if (this.element) {
                        this.element.classList.add('hidden');
                        this.element.classList.remove('fade-out');
                    }
                }, 300);
            }
            
            this.element.setAttribute('aria-busy', 'false');
            this.isVisible = false;
            document.body.style.overflow = '';
            this.pendingHide = null;
        };

        if (remaining > 0) {
            this.pendingHide = setTimeout(doHide, remaining);
        } else {
            doHide();
        }
    }

    /**
     * Update the loading message
     * @param {string} message - New message to display
     */
    setMessage(message) {
        if (!this.element) return;
        const messageEl = this.element.querySelector('#loading-message');
        if (messageEl) messageEl.textContent = message;
    }

    /**
     * Update progress bar
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} text - Optional text to show alongside progress
     */
    setProgress(percent, text) {
        if (!this.element) return;
        
        const fillEl = this.element.querySelector('#loading-progress-fill');
        const textEl = this.element.querySelector('#loading-progress-text');
        const progressEl = this.element.querySelector('#loading-progress');
        
        if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (textEl) textEl.textContent = text || `${Math.round(percent)}%`;
        if (progressEl) progressEl.classList.remove('hidden');
    }

    /**
     * Set hint text
     * @param {string} hint - Hint text to display
     */
    setHint(hint) {
        if (!this.element) return;
        const hintEl = this.element.querySelector('#loading-hint');
        if (hintEl) hintEl.textContent = hint;
    }

    /**
     * Show loading screen while waiting for a promise
     * Automatically hides when promise resolves or rejects
     * @param {Promise} promise - Promise to wait for
     * @param {Object} options - Display options (same as show())
     * @returns {Promise} - Resolves/rejects with the original promise result
     */
    async waitFor(promise, options = {}) {
        this.show(options);
        
        try {
            const result = await promise;
            this.hide();
            return result;
        } catch (error) {
            this.hide();
            throw error;
        }
    }

    /**
     * Check if loading screen is currently visible
     * @returns {boolean}
     */
    isShowing() {
        return this.isVisible;
    }
}

// Export singleton instance
export const LoadingScreen = new LoadingScreenClass();

// Also export the class for projects that want multiple instances
export { LoadingScreenClass };
