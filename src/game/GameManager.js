import { globalEvents, Events } from './EventBus.js';
import { LevelGenerator } from './generators/LevelGenerator.js';
import { StoryLoader } from '../utils/StoryLoader.js';
import { AchievementSystem } from './systems/AchievementSystem.js';

/**
 * GameManager - Main game state machine
 * Handles game modes, level progression, and scoring
 */
export class GameManager {
    constructor() {
        this.currentLevel = null;
        this.currentLevelIndex = 0;
        this.currentVariant = 'easy'; // Track current variant
        this.levels = [];
        this.tiers = {};
        this.gates = {};
        this.gatesIndexLower = new Map();
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, COMPLETE
        this.mode = 'STORY'; // STORY, DESIGNER, ENDLESS
        this.difficulty = 1;
        
        // Player progress
        this.progress = {
            xp: 0,
            completedLevels: {}, // { levelId: { easy: false, medium: false, hard: false } }
            usedHints: {}, // { levelId: { easy: true, medium: false, hard: false } }
            unlockedTiers: ['intro', 'tier_1'],
            achievements: [],
            highScores: {},
            // Persist last selected variant per level: { levelId: 'easy' }
            selectedVariants: {},
            devMode: false // State of the dev-unlock toggle
        };

        // Current session tracked data for achievements/stats
        this.sessionStats = {
            gatesPlaced: 0,
            wiresConnected: 0,
            simulationsRun: 0
        };

        this.loadProgress();
        this.setupEventListeners();
        
        // Initialize systems
        this.achievementSystem = new AchievementSystem(this);

        // Lightweight summary of variants used for roadmap rendering
        this.levelVariantsSummary = {};
    }

    /**
     * Return the best available variant info for roadmap (full variants if available, otherwise summary)
     */
    getVariantsForLevel(levelId) {
        if (this.levelVariants && this.levelVariants[levelId]) return this.levelVariants[levelId];
        if (this.levelVariantsSummary && this.levelVariantsSummary[levelId]) return this.levelVariantsSummary[levelId];

        // Fallback: use lightweight info available on the level index entry (puzzleFiles)
        if (this.levels && Array.isArray(this.levels)) {
            const entry = this.levels.find(l => l.id === levelId);
            if (entry && entry.puzzleFiles) {
                const res = {};
                for (const v of Object.keys(entry.puzzleFiles)) {
                    res[v] = { xpReward: entry.xpReward || 0 };
                }
                return res;
            }
        }

        return {};
    }

    /**
     * Initialize the game
     */
    async init() {
        const success = await this.loadGameData();
        if (success) {
            // Check if we should resume or start fresh
            if (this.progress.completedLevels.length > 0) {
                this.startGame('STORY');
            } else {
                this.startGame('STORY');
            }
        }
        return success;
    }

    /**
     * Load game data from JSON files
     */
    async loadGameData() {
        try {
            const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
            const [gatesRes, storyData] = await Promise.all([
                fetch(`${base}data/gates.json`),
                StoryLoader.loadStoryData(false, false)
            ]);

            this.gates = await gatesRes.json();
            this.buildGateIndex();
            this.levels = storyData.levels;
            this.levels.forEach(level => {
                if (level && !level.baseTitle) {
                    level.baseTitle = level.title;
                }
            });
            this.tiers = storyData.tiers;
            this.levelVariants = storyData.variants || {}; // { levelId: {original, easy, hard} }

            // Load lightweight variants summary (fast, used by roadmap)
            try {
                const summary = await StoryLoader.loadVariantsSummary();
                this.levelVariantsSummary = summary || {};
            } catch (e) {
                console.warn('Failed to load level variants summary:', e);
            }

            console.log('Game data loaded:', {
                gates: Object.keys(this.gates).length,
                levels: this.levels.length,
                tiers: Object.keys(this.tiers).length,
                variants: Object.keys(this.levelVariants || {}).length
            });

            // Ensure progress is synced with newly loaded levels/variants
            this.recalculateProgressXP();
            this.recalculateTiers();

            return true;
        } catch (error) {
            console.error('Failed to load game data:', error);
            return false;
        }
    }

    buildGateIndex() {
        this.gatesIndexLower = new Map();
        for (const [key, gate] of Object.entries(this.gates || {})) {
            const lowerKey = String(key).toLowerCase();
            this.gatesIndexLower.set(lowerKey, gate);
            if (gate && typeof gate === 'object' && gate.id) {
                this.gatesIndexLower.set(String(gate.id).toLowerCase(), gate);
            }
        }
    }

    resolveGateMeta(gateId) {
        if (!gateId) return null;
        const direct = this.gates[gateId];
        if (direct) return direct;

        const lower = String(gateId).toLowerCase();
        return this.gatesIndexLower.get(lower) || null;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        globalEvents.on(Events.PUZZLE_VERIFIED, (data) => {
            if (data.valid && this.state === 'PLAYING') {
                this.completeLevel(data.score);
            }
        });

        // Track session stats for achievements
        globalEvents.on(Events.GATE_PLACED, () => {
            if (this.sessionStats) this.sessionStats.gatesPlaced++;
        });

        globalEvents.on(Events.WIRE_CONNECTED, () => {
            if (this.sessionStats) this.sessionStats.wiresConnected++;
        });

        globalEvents.on(Events.HINT_REQUESTED, (data = {}) => {
            const levelId = data.levelId || this.currentLevel?.id;
            const variant = data.variant || this.currentVariant || 'easy';
            const stats = this.registerHintUse(levelId, variant);

            globalEvents.emit(Events.HINT_USAGE_UPDATED, {
                ...stats,
                levelId: this.normalizeLevelId(levelId),
                variant: this.normalizeVariant(variant)
            });
        });
    }

    normalizeLevelId(levelId) {
        if (!levelId) return '';
        return String(levelId).replace(/_(easy|medium|hard|original)$/i, '');
    }

    normalizeVariant(variant) {
        const normalized = String(variant || 'easy').toLowerCase();
        return ['easy', 'medium', 'hard', 'original'].includes(normalized) ? normalized : 'easy';
    }

    registerHintUse(levelId, variant) {
        const normalizedLevelId = this.normalizeLevelId(levelId);
        const normalizedVariant = this.normalizeVariant(variant);

        if (!normalizedLevelId) {
            return {
                counted: false,
                used: this.getUsedHintsCount(),
                total: this.getTotalHintsCount()
            };
        }

        if (!this.progress.usedHints[normalizedLevelId]) {
            this.progress.usedHints[normalizedLevelId] = { easy: false, medium: false, hard: false, original: false };
        }

        const alreadyCounted = this.progress.usedHints[normalizedLevelId][normalizedVariant] === true;

        if (!alreadyCounted) {
            this.progress.usedHints[normalizedLevelId][normalizedVariant] = true;
            this.saveProgress();
        }

        return {
            counted: !alreadyCounted,
            used: this.getUsedHintsCount(),
            total: this.getTotalHintsCount()
        };
    }

    getUsedHintsCount() {
        const usedHints = this.progress.usedHints || {};
        return Object.values(usedHints).reduce((total, variants) => {
            if (!variants || typeof variants !== 'object') return total;
            return total + Object.values(variants).filter(Boolean).length;
        }, 0);
    }

    getTotalHintsCount() {
        if (!Array.isArray(this.levels)) return 0;

        return this.levels.reduce((total, level) => {
            if (!level || level.isIndex) return total;

            const variants = this.getVariantsForLevel(level.id) || {};
            const variantCount = Object.keys(variants).length;

            if (variantCount > 0) {
                return total + variantCount;
            }

            return total + (level.hint ? 1 : 0);
        }, 0);
    }

    getHintStats() {
        return {
            used: this.getUsedHintsCount(),
            total: this.getTotalHintsCount()
        };
    }

    /**
     * Start the game in a specific mode
     */
    startGame(mode = 'STORY') {
        this.mode = mode;
        this.state = 'PLAYING';

        if (mode === 'STORY') {
            // Story mode is roadmap-driven: do not auto-load a level here.
            // Loading the "next uncompleted" level caused Story to jump ahead
            // (e.g., landing on Level 2 info) instead of showing the roadmap.
        } else if (mode === 'DESIGNER') {
            this.startDesigner();
        } else if (mode === 'ENDLESS') {
            this.startEndless();
        }

        globalEvents.emit(Events.MODE_CHANGED, { mode });
    }

    /**
     * Start designer mode (professional circuit design workbench)
     */
    startDesigner(config = {}) {
        this.currentLevel = LevelGenerator.generateDesignerLevel({
            ...config,
            gates: config.gates || Object.keys(this.gates)
        });

        // Ensure all gates are available
        this.currentLevel.availableGates = Object.keys(this.gates);

        globalEvents.emit(Events.LEVEL_LOADED, {
            level: this.currentLevel,
            mode: 'DESIGNER',
            showIntro: true
        });
    }

    /**
     * Load a specific level by index or ID
     */
    /**
     * Load a level by index or ID and optionally select a variant (original|easy|hard)
     * options: { showIntro: true|false }
     */
    async loadLevel(levelIdOrIndex, variant = 'easy', options = {}) {
        const requestId = options.requestId || `load-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const signal = options.signal;
        this.activeLoadRequestId = requestId;
        let baseLevel;

        if (typeof levelIdOrIndex === 'number') {
            baseLevel = this.levels[levelIdOrIndex];
            this.currentLevelIndex = levelIdOrIndex;
        } else {
            baseLevel = this.levels.find(l => l.id === levelIdOrIndex);
            this.currentLevelIndex = this.levels.indexOf(baseLevel);
        }

        if (!baseLevel) {
            console.error('Level not found:', levelIdOrIndex);
            return false;
        }

        if (!baseLevel.baseTitle) {
            baseLevel.baseTitle = baseLevel.title;
        }

        // Load theory if not already loaded
        if (signal && signal.aborted) return false;

        if (!baseLevel.introText) {
            const fullLevel = await StoryLoader.loadLevel(baseLevel.id, true);
            if (signal && signal.aborted) return false;
            if (this.activeLoadRequestId !== requestId) return false;
            if (fullLevel) {
                // Merge theory into baseLevel
                Object.assign(baseLevel, fullLevel);
                // Update in this.levels
                const index = this.levels.indexOf(baseLevel);
                if (index >= 0) {
                    this.levels[index] = baseLevel;
                }
            }
        }

        // If variant available, merge it on top of the base level.
        // Variants are intended to change gameplay constraints (gate limits, available gates, XP),
        // while preserving educational content (introText, storyText, physicsDetails, visuals).
        if (signal && signal.aborted) return false;
        if (this.activeLoadRequestId !== requestId) return false;

        const variantsForLevel = this.levelVariants && this.levelVariants[baseLevel.id];
        let levelToLoad = baseLevel;
        if (variantsForLevel && variantsForLevel[variant]) {
            const variantLevel = variantsForLevel[variant];
            const merged = { ...baseLevel, ...variantLevel };

            // Preserve base identifiers and educational content if not specifically overridden by variant
            merged.id = baseLevel.id;
            merged.tier = baseLevel.tier;
            merged.baseTitle = baseLevel.baseTitle; // Keep track of base title for UI consistency
            
            // Allow variant to override these if provided, otherwise fall back to base
            merged.title = variantLevel.title || baseLevel.title;
            merged.description = variantLevel.description || baseLevel.description;
            merged.objective = variantLevel.objective || baseLevel.objective;
            merged.introText = variantLevel.introText || baseLevel.introText;
            merged.hint = variantLevel.hint || baseLevel.hint;

            // Preserve story/physics from base (usually consistent across variants)
            merged.storyText = baseLevel.storyText;
            merged.physicsDetails = baseLevel.physicsDetails;
            merged.physicsVisual = variantLevel.physicsVisual || baseLevel.physicsVisual;

            levelToLoad = merged;
        }

        if (signal && signal.aborted) return false;
        if (this.activeLoadRequestId !== requestId) return false;

        this.currentLevel = levelToLoad;
        this.currentVariant = variant; // Track current variant
        this.state = 'PLAYING';

        const showIntro = options && options.showIntro === false ? false : true;

        if (signal && signal.aborted) return false;
        if (this.activeLoadRequestId !== requestId) return false;

        globalEvents.emit(Events.LEVEL_LOADED, {
            level: levelToLoad,
            index: this.currentLevelIndex,
            tier: this.tiers[levelToLoad.tier || baseLevel.tier],
            showIntro
        });

        return true;
    }

    /**
     * Get the next uncompleted level
     */
    getNextUncompletedLevel() {
        const nextIndex = this.levels.findIndex(
            level => !level.isIndex && (!this.progress.completedLevels[level.id] || !this.progress.completedLevels[level.id].easy)
        );
        return nextIndex >= 0 ? nextIndex : 1; // Default to level_01 (index 1) if all completed
    }

    /**
     * Complete current level and award XP
     */
    completeLevel(score = 100) {
        if (!this.currentLevel) return;

        const levelId = this.currentLevel.id.replace(/_(easy|medium|hard)$/, ''); // Get base level ID
        const oldXP = this.progress.xp;

        // Update progress for the variant
        if (!this.progress.completedLevels[levelId]) {
            this.progress.completedLevels[levelId] = { easy: false, medium: false, hard: false, original: false };
        }
        
        // Mark as completed
        this.progress.completedLevels[levelId][this.currentVariant] = true;

        // Re-calculate the total XP based on actual completions (prevents farming)
        this.recalculateProgressXP();
        const bonusXP = Math.max(0, this.progress.xp - oldXP);

        // Check for tier unlock
        this.checkTierUnlocks();

        // Save progress
        this.saveProgress();

        this.state = 'COMPLETE';

        globalEvents.emit(Events.LEVEL_COMPLETE, {
            level: this.currentLevel,
            score,
            xpEarned: bonusXP,
            totalXP: this.progress.xp
        });

        if (bonusXP > 0) {
            globalEvents.emit(Events.XP_GAINED, {
                amount: bonusXP,
                total: this.progress.xp
            });
        }
    }

    /**
     * Re-calculate total XP based on completed levels and their rewards
     */
    recalculateProgressXP() {
        if (this.progress.devMode) {
            this.progress.xp = 9999;
            return 9999;
        }
        let totalXP = 0;
        if (!this.progress.completedLevels) {
            this.progress.xp = 0;
            return 0;
        }

        for (const [levelId, variants] of Object.entries(this.progress.completedLevels)) {
            const variantsData = this.getVariantsForLevel(levelId);
            
            // Check easy, medium, hard, and legacy 'original'
            ['easy', 'medium', 'hard', 'original'].forEach(v => {
                if (variants[v] && variantsData && variantsData[v]) {
                    totalXP += (variantsData[v].xpReward || 0);
                } else if (variants[v] && v === 'original') {
                    // Fallback for legacy 'original' variant
                    const level = this.levels?.find(l => l.id === levelId);
                    if (level) totalXP += (level.xpReward || 0);
                }
            });
        }
        
        this.progress.xp = totalXP;
        return totalXP;
    }

    /**
     * Re-calculate unlocked tiers based on current XP
     */
    recalculateTiers() {
        if (this.progress.devMode) {
            this.progress.unlockedTiers = ['intro', 'tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5', 'tier_6'];
            return this.progress.unlockedTiers;
        }
        // Reset to initial state
        this.progress.unlockedTiers = ['intro', 'tier_1'];
        // Re-apply tier unlocks based on XP
        this.checkTierUnlocks();
        return this.progress.unlockedTiers;
    }

    /**
     * Check if new tiers should be unlocked
     */
    checkTierUnlocks() {
        const tierThresholds = {
            'tier_2': 200,   // After Silicon Age
            'tier_3': 600,   // After Boolean Algebra
            'tier_4': 1100,  // After Combinational Logic
            'tier_5': 1800,  // After Sequential Logic
            'tier_6': 2300   // After FSMs
        };

        Object.entries(tierThresholds).forEach(([tier, threshold]) => {
            if (this.progress.xp >= threshold && !this.progress.unlockedTiers.includes(tier)) {
                this.progress.unlockedTiers.push(tier);
                globalEvents.emit(Events.TIER_UNLOCKED, { tier, tierData: this.tiers[tier] });
            }
        });
    }



    /**
     * Start endless mode
     */
    startEndless() {
        this.difficulty = Math.floor(this.progress.xp / 100) + 1;
        this.currentLevel = LevelGenerator.generate(this.difficulty);

        globalEvents.emit(Events.LEVEL_LOADED, {
            level: this.currentLevel,
            mode: 'ENDLESS',
            showIntro: true
        });
    }

    /**
     * Generate next endless challenge (after completing current)
     */
    nextEndlessChallenge() {
        if (this.mode !== 'ENDLESS') return false;
        this.difficulty = Math.min(this.difficulty + 1, 15);
        this.currentLevel = LevelGenerator.generate(this.difficulty);

        globalEvents.emit(Events.LEVEL_LOADED, {
            level: this.currentLevel,
            mode: 'ENDLESS',
            showIntro: true
        });
        return true;
    }

    /**
     * Go to next level (preserves current difficulty variant)
     */
    nextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.loadLevel(this.currentLevelIndex + 1, this.currentVariant || 'original');
            return true;
        }
        return false;
    }

    /**
     * Get the lowest (easiest) uncompleted variant for a base level id.
     * If all variants are completed, returns the highest available variant.
     * Uses same fallback chain as getVariantsForLevel() for consistency.
     */
    getLowestUncompletedVariant(levelId) {
        if (!levelId) return 'easy';
        
        // Use the same fallback chain as getVariantsForLevel() for consistency
        const variants = this.getVariantsForLevel(levelId);
        if (!variants || Object.keys(variants).length === 0) return 'easy';
        
        const completed = (this.progress.completedLevels && this.progress.completedLevels[levelId]) || {};
        const order = ['easy','medium','hard'];
        for (const v of order) {
            if (variants[v] && !completed[v]) return v;
        }
        // All variants completed - return highest available variant
        const reverseOrder = ['hard','medium','easy'];
        for (const v of reverseOrder) {
            if (variants[v]) return v;
        }
        return 'easy';
    }

    /**
     * Restart current level
     */
    restartLevel() {
        if (this.currentLevel) {
            this.loadLevel(this.currentLevelIndex, this.currentVariant || 'original');
        }
    }

    /**
     * Get available gates for current level
     */
    getAvailableGates() {
        if (!this.currentLevel) return [];
        
        const availableGates = this.currentLevel.availableGates || [];
        const gateIds = [...availableGates];
        
        // Ensure input and output are always available for recovery
        if (!gateIds.includes('input')) gateIds.unshift('input');
        if (!gateIds.includes('output')) gateIds.push('output');

        return gateIds.map(gateId => {
            const meta = this.resolveGateMeta(gateId);
            if (!meta) {
                return {
                    id: gateId,
                    name: String(gateId),
                    description: 'Gate metadata missing in /data/gates.json',
                    inputs: 2,
                    outputs: 1
                };
            }
            return {
                id: gateId,
                ...meta
            };
        });
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        try {
            localStorage.setItem('logicArchitect_progress', JSON.stringify(this.progress));
        } catch (e) {
            console.warn('Could not save progress:', e);
        }
    }

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('logicArchitect_progress');
            if (saved) {
                this.progress = { ...this.progress, ...JSON.parse(saved) };
            }
            
            // Migrate old completedLevels array to new object format
            if (Array.isArray(this.progress.completedLevels)) {
                const migrated = {};
                this.progress.completedLevels.forEach(levelId => {
                    migrated[levelId] = { original: true, easy: false, hard: false };
                });
                this.progress.completedLevels = migrated;
            }
            
            // Ensure completedLevels is an object
            if (typeof this.progress.completedLevels !== 'object' || Array.isArray(this.progress.completedLevels)) {
                this.progress.completedLevels = {};
            }

            // Ensure usedHints exists
            if (!this.progress.usedHints || typeof this.progress.usedHints !== 'object' || Array.isArray(this.progress.usedHints)) {
                this.progress.usedHints = {};
            }

            // Ensure selectedVariants exists (migrate older saves)
            if (!this.progress.selectedVariants || typeof this.progress.selectedVariants !== 'object') {
                this.progress.selectedVariants = {};
            }

            // Ensure devMode exists
            if (this.progress.devMode === undefined) {
                this.progress.devMode = false;
            }
            
            // Retroactive fix: 'intro' and 'tier_1' should ALWAYS be unlocked
            if (Array.isArray(this.progress.unlockedTiers)) {
                if (!this.progress.unlockedTiers.includes('intro')) {
                    this.progress.unlockedTiers.unshift('intro');
                }
                if (!this.progress.unlockedTiers.includes('tier_1')) {
                    this.progress.unlockedTiers.push('tier_1');
                }
            } else {
                this.progress.unlockedTiers = ['intro', 'tier_1'];
            }
        } catch (e) {
            console.warn('Could not load progress:', e);
        }
    }

    /**
     * Reset all progress
     */
    resetProgress() {
        this.progress = {
            xp: 0,
            completedLevels: {},
            usedHints: {},
            unlockedTiers: ['tier_1'],
            achievements: [],
            highScores: {},
            selectedVariants: {}
        };
        this.saveProgress();
    }

    /**
     * Get player stats
     */
    getStats() {
        const completedCount = Object.values(this.progress.completedLevels).filter(
            variants => variants.original || variants.easy || variants.hard
        ).length;
        return {
            xp: this.progress.xp,
            completedLevels: completedCount,
            totalLevels: this.levels.length,
            unlockedTiers: this.progress.unlockedTiers,
            achievements: this.progress.achievements.length
        };
    }
}

export const gameManager = new GameManager();
