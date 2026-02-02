/**
 * EventBus - Central nervous system for the game
 * Implements the Observer/Pub-Sub pattern
 * Allows decoupled communication between systems
 */
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name (e.g., 'GATE_PLACED', 'LEVEL_COMPLETE')
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {Object} data - Payload
     */
    emit(event, data = {}) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Subscribe to an event only once
     */
    once(event, callback) {
        const unsubscribe = this.on(event, (data) => {
            unsubscribe();
            callback(data);
        });
        return unsubscribe;
    }
}

// Global event bus instance
export const globalEvents = new EventBus();

// Event type constants
export const Events = {
    // Simulation events
    SIMULATION_TICK: 'SIMULATION_TICK',
    SIMULATION_RESET: 'SIMULATION_RESET',
    SIGNAL_PROPAGATED: 'SIGNAL_PROPAGATED',
    SIMULATION_PAUSED: 'SIMULATION_PAUSED',
    SIMULATION_RESUMED: 'SIMULATION_RESUMED',
    SIMULATION_STEP: 'SIMULATION_STEP',
    
    // Circuit events
    GATE_PLACED: 'GATE_PLACED',
    GATE_REMOVED: 'GATE_REMOVED',
    WIRE_CONNECTED: 'WIRE_CONNECTED',
    WIRE_DISCONNECTED: 'WIRE_DISCONNECTED',
    CIRCUIT_SHORT: 'CIRCUIT_SHORT',
    CIRCUIT_LIMIT_REACHED: 'CIRCUIT_LIMIT_REACHED',
    INPUT_TOGGLED: 'INPUT_TOGGLED',
    
    // Game events
    LEVEL_LOADED: 'LEVEL_LOADED',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    LEVEL_FAILED: 'LEVEL_FAILED',
    PUZZLE_VERIFIED: 'PUZZLE_VERIFIED',
    
    // UI events
    MODE_CHANGED: 'MODE_CHANGED',
    GATE_SELECT: 'GATE_SELECT',
    HINT_REQUESTED: 'HINT_REQUESTED',
    TUTORIAL_STEP: 'TUTORIAL_STEP',
    ZOOM_CHANGED: 'ZOOM_CHANGED',
    ZOOM_UPDATED: 'ZOOM_UPDATED',
    UI_OVERLAY_OPENED: 'UI_OVERLAY_OPENED',
    UI_OVERLAY_CLOSED: 'UI_OVERLAY_CLOSED',
    GAME_START_REQUESTED: 'GAME_START_REQUESTED',
    
    // Progress events
    XP_GAINED: 'XP_GAINED',
    ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
    TIER_UNLOCKED: 'TIER_UNLOCKED'
};
