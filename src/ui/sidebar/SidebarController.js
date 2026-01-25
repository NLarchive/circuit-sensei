/**
 * SidebarController - Manages sidebar open/close behavior
 * Handles mobile responsiveness, gestures, and backdrop
 */

import { BREAKPOINTS, ANIMATION_DURATION } from '../constants/UIConstants.js';

class SidebarControllerClass {
    constructor() {
        this.sidebar = null;
        this.backdrop = null;
        this.toggleBtn = null;
        this.isOpen = false;
        this.touchStartX = null;
        this.boundHandleResize = this.handleResize.bind(this);
    }

    /**
     * Initialize the sidebar controller
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        this.sidebar = options.sidebar || document.getElementById('sidebar');
        this.toggleBtn = options.toggleBtn || document.getElementById('btn-toggle-sidebar');

        if (!this.sidebar) {
            console.warn('SidebarController: Sidebar element not found');
            return;
        }

        this.createBackdrop();
        this.setupEventListeners();
        this.handleResize();
    }

    /**
     * Create the backdrop element if it doesn't exist
     */
    createBackdrop() {
        const existingBackdrop = document.getElementById('sidebar-backdrop');
        if (existingBackdrop) {
            this.backdrop = existingBackdrop;
            return;
        }

        this.backdrop = document.createElement('div');
        this.backdrop.id = 'sidebar-backdrop';
        this.backdrop.className = 'sidebar-backdrop';
        this.backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.backdrop);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle button
        if (this.toggleBtn) {
            this.toggleBtn.setAttribute('aria-controls', 'sidebar');
            this.toggleBtn.setAttribute('aria-expanded', 'false');
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Backdrop click to close
        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => this.close());
        }

        // Touch gestures for swipe-to-close
        this.setupTouchGestures();

        // Handle window resize
        window.addEventListener('resize', this.boundHandleResize);

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Setup touch gestures for mobile
     */
    setupTouchGestures() {
        if (!this.sidebar) return;

        this.sidebar.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0]?.clientX ?? null;
        }, { passive: true });

        this.sidebar.addEventListener('touchend', (e) => {
            if (this.touchStartX === null) return;
            
            const touchEndX = e.changedTouches[0]?.clientX ?? null;
            if (touchEndX !== null && this.touchStartX - touchEndX > 50) {
                // Swiped left
                this.close();
            }
            this.touchStartX = null;
        }, { passive: true });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const isMobile = window.innerWidth <= BREAKPOINTS.TABLET;
        
        if (!isMobile && this.isOpen) {
            // Close sidebar when switching to desktop
            this.close();
        }
    }

    /**
     * Open the sidebar
     */
    open() {
        if (!this.sidebar) return;

        this.isOpen = true;
        this.sidebar.classList.add('mobile-open');
        
        if (this.backdrop) {
            this.backdrop.classList.remove('hidden');
            this.backdrop.classList.add('visible');
        }

        if (this.toggleBtn) {
            this.toggleBtn.setAttribute('aria-expanded', 'true');
        }

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        // Focus first focusable element in sidebar
        const firstFocusable = this.sidebar.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    /**
     * Close the sidebar
     */
    close() {
        if (!this.sidebar) return;

        this.isOpen = false;
        this.sidebar.classList.remove('mobile-open');
        
        if (this.backdrop) {
            this.backdrop.classList.remove('visible');
            this.backdrop.classList.add('hidden');
        }

        if (this.toggleBtn) {
            this.toggleBtn.setAttribute('aria-expanded', 'false');
            this.toggleBtn.focus();
        }

        // Restore body scrolling
        document.body.style.overflow = '';
    }

    /**
     * Toggle the sidebar
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Check if sidebar is currently open
     */
    isOpenState() {
        return this.isOpen;
    }

    /**
     * Destroy the controller and clean up
     */
    destroy() {
        window.removeEventListener('resize', this.boundHandleResize);
        if (this.backdrop && this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
    }
}

// Singleton instance
export const SidebarController = new SidebarControllerClass();
