import { globalEvents, Events } from '../game/EventBus.js';

/**
 * Analytics - Tracks game events and performance metrics
 * Can be extended to send data to a backend or external service
 */
export class Analytics {
    constructor() {
        this.sessionStartTime = Date.now();
        this.eventsLog = [];
        this.setupListeners();
        console.log('[Analytics] System initialized');
    }

    setupListeners() {
        const trackedEvents = [
            Events.LEVEL_LOADED,
            Events.LEVEL_COMPLETE,
            Events.LEVEL_FAILED,
            Events.GATE_PLACED,
            Events.GATE_REMOVED,
            Events.WIRE_CONNECTED,
            Events.WIRE_DISCONNECTED,
            Events.CIRCUIT_SHORT,
            Events.SIMULATION_TICK,
            Events.ZOOM_CHANGED,
            Events.MODE_CHANGED,
            Events.GATE_SELECT,
            Events.INPUT_TOGGLED,
            Events.PUZZLE_VERIFIED,
            Events.ACHIEVEMENT_UNLOCKED,
            Events.TIER_UNLOCKED,
            Events.UI_OVERLAY_OPENED,
            Events.UI_OVERLAY_CLOSED,
            'PROBE_PIN'
        ];

        trackedEvents.forEach(event => {
            globalEvents.on(event, (data) => this.track(event, data));
        });
    }

    track(event, data) {
        const timestamp = Date.now();
        const relativeTime = timestamp - this.sessionStartTime;
        
        const entry = {
            event,
            timestamp,
            relativeTime,
            data
        };

        this.eventsLog.push(entry);

        // Limit log size in memory
        if (this.eventsLog.length > 1000) {
            this.eventsLog.shift();
        }

        // For now, just log to console in dev mode
        if (import.meta.env?.DEV) {
            // Only log non-spammy events
            if (event !== Events.SIMULATION_TICK && event !== Events.ZOOM_CHANGED) {
                console.debug(`[Analytics] ${event}`, data);
            }
        }
    }

    getSessionDuration() {
        return (Date.now() - this.sessionStartTime) / 1000;
    }

    getReport() {
        return {
            duration: this.getSessionDuration(),
            totalEvents: this.eventsLog.length,
            events: this.eventsLog
        };
    }
}

export const analytics = new Analytics();
