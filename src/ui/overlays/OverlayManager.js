/**
 * OverlayManager - Centralized overlay management
 * Handles show/hide, focus trapping, and keyboard navigation for all overlays
 */

import { globalEvents, Events } from '../../game/EventBus.js';
import { Z_INDEX, ANIMATION_DURATION } from '../constants/UIConstants.js';

class OverlayManagerClass {
    constructor() {
        this.activeOverlays = [];
        this.previousFocus = null;
        this.boundHandleKeydown = this.handleKeydown.bind(this);
        this.init();
    }

    init() {
        // Listen for escape key globally
        document.addEventListener('keydown', this.boundHandleKeydown);
    }

    /**
     * Show an overlay by ID
     * @param {string} overlayId - The ID of the overlay element
     * @param {Object} options - Options for showing the overlay
     */
    show(overlayId, options = {}) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) {
            console.warn(`Overlay not found: ${overlayId}`);
            return;
        }

        // Store previous focus for restoration
        this.previousFocus = document.activeElement;

        // Show the overlay
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        
        try {
            overlay.inert = false;
        } catch (e) {
            // inert may not be supported in older browsers
        }

        // Add to stack
        this.activeOverlays.push(overlayId);

        // Prevent body scrolling
        if (this.activeOverlays.length === 1) {
            document.body.style.overflow = 'hidden';
        }

        // Focus management
        if (options.focusElement) {
            const focusEl = overlay.querySelector(options.focusElement);
            if (focusEl) {
                focusEl.focus();
            }
        } else {
            // Focus first focusable element or the overlay itself
            const focusables = this.getFocusableElements(overlay);
            if (focusables.length > 0) {
                focusables[0].focus();
            } else {
                overlay.setAttribute('tabindex', '-1');
                overlay.focus();
            }
        }

        // Scroll to top if content is scrollable
        const content = overlay.querySelector('.overlay-content, .intro-content, .roadmap-content, .glossary-content');
        if (content) {
            content.scrollTop = 0;
        }

        // Emit event
        globalEvents.emit(Events.UI_OVERLAY_OPENED, { overlayId });

        return overlay;
    }

    /**
     * Hide an overlay by ID
     * @param {string} overlayId - The ID of the overlay element
     */
    hide(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;

        // Hide the overlay
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        
        try {
            overlay.inert = true;
        } catch (e) {
            // inert may not be supported
        }

        // Remove from stack
        const index = this.activeOverlays.indexOf(overlayId);
        if (index > -1) {
            this.activeOverlays.splice(index, 1);
        }

        // Restore body scrolling if no overlays are open
        if (this.activeOverlays.length === 0) {
            document.body.style.overflow = '';
            
            // Restore previous focus
            if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
                try {
                    this.previousFocus.focus();
                } catch (e) {
                    // Focus restoration failed, ignore
                }
            }
            this.previousFocus = null;
        } else {
            // Focus the top overlay in the stack
            const topOverlayId = this.activeOverlays[this.activeOverlays.length - 1];
            const topOverlay = document.getElementById(topOverlayId);
            if (topOverlay) {
                const focusables = this.getFocusableElements(topOverlay);
                if (focusables.length > 0) {
                    focusables[0].focus();
                }
            }
        }

        // Emit event
        globalEvents.emit('UI_OVERLAY_CLOSED', { overlayId });
    }

    /**
     * Hide all overlays
     */
    hideAll() {
        const overlaysToClose = [...this.activeOverlays];
        overlaysToClose.forEach(id => this.hide(id));
    }

    /**
     * Check if any overlay is currently open
     */
    hasActiveOverlay() {
        return this.activeOverlays.length > 0;
    }

    /**
     * Get the currently active (top) overlay ID
     */
    getActiveOverlayId() {
        return this.activeOverlays[this.activeOverlays.length - 1] || null;
    }

    /**
     * Handle keydown events for focus trapping and escape
     */
    handleKeydown(e) {
        if (this.activeOverlays.length === 0) return;

        const topOverlayId = this.activeOverlays[this.activeOverlays.length - 1];
        const overlay = document.getElementById(topOverlayId);
        if (!overlay) return;

        // Escape to close
        if (e.key === 'Escape') {
            e.preventDefault();
            this.hide(topOverlayId);
            return;
        }

        // Tab for focus trapping
        if (e.key === 'Tab') {
            this.handleTabKey(e, overlay);
        }
    }

    /**
     * Handle tab key for focus trapping
     */
    handleTabKey(e, overlay) {
        const focusables = this.getFocusableElements(overlay);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
            // Shift+Tab: Go backwards
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            // Tab: Go forwards
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    /**
     * Get all focusable elements within a container
     */
    getFocusableElements(container) {
        const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const elements = container.querySelectorAll(selector);
        return Array.from(elements).filter(el => 
            !el.hasAttribute('disabled') && 
            el.offsetParent !== null &&
            !el.closest('[inert]')
        );
    }

    /**
     * Setup backdrop click to close
     */
    setupBackdropClose(overlayId, backdropSelector = '.overlay') {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;

        overlay.addEventListener('click', (e) => {
            // Only close if clicking directly on the backdrop, not its children
            if (e.target === overlay || e.target.matches(backdropSelector)) {
                this.hide(overlayId);
            }
        });
    }
}

// Singleton instance
export const OverlayManager = new OverlayManagerClass();
