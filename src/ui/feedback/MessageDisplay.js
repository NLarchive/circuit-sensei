/**
 * MessageDisplay - Centralized message/toast notification system
 * Handles success, error, warning, and info messages
 */

import { MESSAGE_TYPES, ANIMATION_DURATION } from '../constants/UIConstants.js';

class MessageDisplayClass {
    constructor() {
        this.messageArea = null;
        this.currentTimeout = null;
        this.messageQueue = [];
        this.isProcessing = false;
    }

    /**
     * Initialize with a message area element
     * @param {string} elementId - ID of the message area element
     */
    init(elementId = 'message-area') {
        this.messageArea = document.getElementById(elementId);
        if (!this.messageArea) {
            console.warn('MessageDisplay: Message area not found');
        }
    }

    /**
     * Show a message
     * @param {string} text - Message text
     * @param {string} type - Message type (info, success, error, warning)
     * @param {number} duration - Duration in ms (0 for persistent)
     */
    show(text, type = MESSAGE_TYPES.INFO, duration = 3000) {
        if (!this.messageArea) {
            this.init();
        }

        if (!this.messageArea) {
            console.log(`[${type.toUpperCase()}] ${text}`);
            return;
        }

        // Clear existing timeout
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }

        // Update message area
        this.messageArea.textContent = text;
        this.messageArea.className = `message-area ${type}`;
        
        // Add ARIA live announcement
        this.messageArea.setAttribute('role', 'status');
        this.messageArea.setAttribute('aria-live', type === MESSAGE_TYPES.ERROR ? 'assertive' : 'polite');

        // Auto-hide after duration
        if (duration > 0) {
            this.currentTimeout = setTimeout(() => {
                this.clear();
            }, duration);
        }

        return this;
    }

    /**
     * Show a success message
     */
    success(text, duration = 3000) {
        return this.show(text, MESSAGE_TYPES.SUCCESS, duration);
    }

    /**
     * Show an error message
     */
    error(text, duration = 5000) {
        return this.show(text, MESSAGE_TYPES.ERROR, duration);
    }

    /**
     * Show a warning message
     */
    warning(text, duration = 4000) {
        return this.show(text, MESSAGE_TYPES.WARNING, duration);
    }

    /**
     * Show an info message
     */
    info(text, duration = 3000) {
        return this.show(text, MESSAGE_TYPES.INFO, duration);
    }

    /**
     * Clear the current message
     */
    clear() {
        if (!this.messageArea) return;

        this.messageArea.textContent = '';
        this.messageArea.className = 'message-area';
        this.messageArea.removeAttribute('aria-live');

        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
    }

    /**
     * Show a message with an icon
     * @param {string} icon - Emoji or icon character
     * @param {string} text - Message text
     * @param {string} type - Message type
     * @param {number} duration - Duration in ms
     */
    showWithIcon(icon, text, type = MESSAGE_TYPES.INFO, duration = 3000) {
        return this.show(`${icon} ${text}`, type, duration);
    }

    /**
     * Show verification result
     * @param {boolean} valid - Whether verification passed
     * @param {number} score - Score percentage
     * @param {number} failedCases - Number of failed cases (if any)
     */
    showVerificationResult(valid, score = 100, failedCases = 0) {
        if (valid) {
            this.success(`✅ Success! Score: ${score}%`);
        } else {
            this.error(`❌ Failed. ${failedCases} incorrect case${failedCases !== 1 ? 's' : ''}.`);
        }
    }

    /**
     * Show simulation status
     * @param {Object} simulation - Simulation state object
     */
    showSimulationStatus(simulation) {
        if (!simulation) return;

        if (simulation.hasMetastability) {
            this.warning(`⚠️ Metastable state detected! ${simulation.physicsNote || ''}`);
        } else if (simulation.oscillating) {
            this.warning(`⚡ Circuit oscillating! ${simulation.physicsNote || ''}`);
        }
    }
}

// Singleton instance
export const MessageDisplay = new MessageDisplayClass();
