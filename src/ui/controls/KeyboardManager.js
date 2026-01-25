/**
 * KeyboardManager - Centralized keyboard shortcut handling
 * Provides undo/redo, mode switching, and accessibility shortcuts
 */

import { globalEvents, Events } from '../../game/EventBus.js';
import { KEYBOARD_SHORTCUTS, INTERACTION_MODES } from '../constants/UIConstants.js';

class KeyboardManagerClass {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.boundHandleKeydown = this.handleKeydown.bind(this);
    }

    /**
     * Initialize keyboard handling
     */
    init() {
        document.addEventListener('keydown', this.boundHandleKeydown);
        this.registerDefaultShortcuts();
    }

    /**
     * Register default shortcuts
     */
    registerDefaultShortcuts() {
        // Mode switching
        this.register('s', () => {
            globalEvents.emit('INTERACTION_MODE_CHANGED', { mode: INTERACTION_MODES.SELECT });
        }, { description: 'Select mode' });

        this.register('w', () => {
            globalEvents.emit('INTERACTION_MODE_CHANGED', { mode: INTERACTION_MODES.WIRE });
        }, { description: 'Wire mode' });

        // Zoom controls
        this.register('+', () => {
            globalEvents.emit(Events.ZOOM_CHANGED, { delta: 0.1 });
        }, { ctrl: true, description: 'Zoom in' });

        this.register('=', () => {
            globalEvents.emit(Events.ZOOM_CHANGED, { delta: 0.1 });
        }, { ctrl: true, description: 'Zoom in (alternate)' });

        this.register('-', () => {
            globalEvents.emit(Events.ZOOM_CHANGED, { delta: -0.1 });
        }, { ctrl: true, description: 'Zoom out' });

        this.register('0', () => {
            globalEvents.emit('ZOOM_RESET');
        }, { ctrl: true, description: 'Reset zoom' });

        // Help
        this.register('?', () => {
            this.showShortcutsHelp();
        }, { shift: true, description: 'Show keyboard shortcuts' });

        this.register('F1', () => {
            document.getElementById('btn-help')?.click();
        }, { description: 'Show help' });
    }

    /**
     * Register a keyboard shortcut
     * @param {string} key - The key to listen for
     * @param {Function} callback - Function to call when triggered
     * @param {Object} options - Options (ctrl, shift, alt, description)
     */
    register(key, callback, options = {}) {
        const id = this.getShortcutId(key, options);
        this.shortcuts.set(id, {
            key,
            callback,
            ctrl: options.ctrl || false,
            shift: options.shift || false,
            alt: options.alt || false,
            description: options.description || ''
        });
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key, options = {}) {
        const id = this.getShortcutId(key, options);
        this.shortcuts.delete(id);
    }

    /**
     * Generate a unique ID for a shortcut combination
     */
    getShortcutId(key, options = {}) {
        const mods = [];
        if (options.ctrl) mods.push('ctrl');
        if (options.shift) mods.push('shift');
        if (options.alt) mods.push('alt');
        mods.push(key.toLowerCase());
        return mods.join('+');
    }

    /**
     * Handle keydown events
     */
    handleKeydown(e) {
        if (!this.enabled) return;

        // Don't handle shortcuts when typing in inputs
        if (this.isTypingInInput(e)) return;

        const id = this.getShortcutId(e.key, {
            ctrl: e.ctrlKey || e.metaKey,
            shift: e.shiftKey,
            alt: e.altKey
        });

        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            e.preventDefault();
            shortcut.callback(e);
        }
    }

    /**
     * Check if user is typing in an input field
     */
    isTypingInInput(e) {
        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        const isEditable = target.isContentEditable;
        const isInput = ['input', 'textarea', 'select'].includes(tagName);
        
        return isInput || isEditable;
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Show keyboard shortcuts help overlay
     */
    showShortcutsHelp() {
        let overlay = document.getElementById('keyboard-shortcuts-overlay');
        
        if (!overlay) {
            overlay = this.createShortcutsOverlay();
            document.body.appendChild(overlay);
        }

        overlay.classList.remove('hidden');
        overlay.focus();
    }

    /**
     * Create the shortcuts help overlay
     */
    createShortcutsOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'keyboard-shortcuts-overlay';
        overlay.className = 'overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-labelledby', 'shortcuts-title');
        overlay.setAttribute('tabindex', '-1');

        const shortcuts = Array.from(this.shortcuts.values());
        const shortcutsHtml = shortcuts.map(s => {
            const keys = [];
            if (s.ctrl) keys.push('Ctrl');
            if (s.shift) keys.push('Shift');
            if (s.alt) keys.push('Alt');
            keys.push(s.key.toUpperCase());
            
            return `
                <div class="shortcut-item">
                    <kbd>${keys.join(' + ')}</kbd>
                    <span>${s.description}</span>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="overlay-content" style="max-width: 400px;">
                <h3 id="shortcuts-title">⌨️ Keyboard Shortcuts</h3>
                <div class="shortcuts-list">
                    ${shortcutsHtml}
                </div>
                <button id="btn-close-shortcuts" class="btn primary" style="margin-top: 20px;">Close</button>
            </div>
        `;

        // Close button
        overlay.querySelector('#btn-close-shortcuts').addEventListener('click', () => {
            overlay.classList.add('hidden');
        });

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });

        // Escape to close
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                overlay.classList.add('hidden');
            }
        });

        return overlay;
    }

    /**
     * Get all registered shortcuts
     */
    getShortcuts() {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Destroy the keyboard manager
     */
    destroy() {
        document.removeEventListener('keydown', this.boundHandleKeydown);
        this.shortcuts.clear();
    }
}

// Singleton instance
export const KeyboardManager = new KeyboardManagerClass();
