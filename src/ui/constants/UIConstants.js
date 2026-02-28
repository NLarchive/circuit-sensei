/**
 * UIConstants - Centralized UI constants
 * Single source of truth for labels, icons, and configuration values
 */

export const DIFFICULTY_LABELS = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard',
    'expert': 'Expert'
};

export const TIER_ICONS = {
    'intro': '🚀',
    'tier_1': '🔋',
    'tier_2': '🔌',
    'tier_3': '🧮',
    'tier_4': '💾',
    'tier_5': '🚦',
    'tier_6': '🖥️'
};

export const TIER_ORDER = ['intro', 'tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5', 'tier_6'];

export const MESSAGE_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning'
};

export const INTERACTION_MODES = {
    // SELECT and WIRE are unified; all interaction works in one mode.
    // Only PROBE is distinct (used by the logic analyzer).
    WIRE: 'wire',
    PROBE: 'probe'
};

export const BREAKPOINTS = {
    MOBILE_SM: 400,
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    DESKTOP_LG: 1280
};

export const Z_INDEX = {
    CANVAS: 1,
    SIDEBAR: 10,
    NAVBAR: 940,
    SIDEBAR_MOBILE: 950,
    SIDEBAR_BACKDROP: 945,
    OVERLAY: 1000,
    TOOLTIP: 1100,
    MODAL: 1200
};

export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
};

// Keyboard shortcuts mapping
export const KEYBOARD_SHORTCUTS = {
    UNDO: { key: 'z', ctrl: true, description: 'Undo last action' },
    REDO: { key: 'y', ctrl: true, description: 'Redo last action' },
    REDO_ALT: { key: 'z', ctrl: true, shift: true, description: 'Redo last action' },
    DELETE: { key: 'Delete', description: 'Delete selected component' },
    ESCAPE: { key: 'Escape', description: 'Cancel current action / Close overlay' },
    HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
    INFO: { key: 'i', description: 'Show controls reference' },
    RESET: { key: 'r', ctrl: true, description: 'Reset circuit' },
    VERIFY: { key: 'Enter', ctrl: true, description: 'Verify solution' },
    ZOOM_IN: { key: '+', ctrl: true, description: 'Zoom in' },
    ZOOM_OUT: { key: '-', ctrl: true, description: 'Zoom out' },
    ZOOM_RESET: { key: '0', ctrl: true, description: 'Reset zoom' }
};
