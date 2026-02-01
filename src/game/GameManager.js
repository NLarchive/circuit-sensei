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
        this.mode = 'STORY'; // STORY, SANDBOX, ENDLESS, CUSTOM
        this.difficulty = 1;
        
        // Player progress
        this.progress = {
            xp: 0,
            completedLevels: {}, // { levelId: { easy: false, medium: false, hard: false } }
            unlockedTiers: ['intro', 'tier_1'],
            achievements: [],
            highScores: {},
            // Persist last selected variant per level: { levelId: 'easy' }
            selectedVariants: {}
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
        } else if (mode === 'SANDBOX') {
            this.startSandbox();
        } else if (mode === 'ENDLESS') {
            this.startEndless();
        } else if (mode === 'CUSTOM') {
            this.startCustom();
        }

        globalEvents.emit(Events.MODE_CHANGED, { mode });
    }

    /**
     * Start custom mode (Level Editor / Custom Puzzle)
     */
    startCustom(config = {}) {
        this.currentLevel = LevelGenerator.generateCustomLevel({
            ...config,
            gates: config.gates || Object.keys(this.gates)
        });

        globalEvents.emit(Events.LEVEL_LOADED, {
            level: this.currentLevel,
            mode: 'CUSTOM',
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

        // Load theory if not already loaded
        if (!baseLevel.introText) {
            const fullLevel = await StoryLoader.loadLevel(baseLevel.id, true);
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
        const variantsForLevel = this.levelVariants && this.levelVariants[baseLevel.id];
        let levelToLoad = baseLevel;
        if (variantsForLevel && variantsForLevel[variant]) {
            const variantLevel = variantsForLevel[variant];
            const merged = { ...baseLevel, ...variantLevel };

            // Preserve base identifiers and educational content if not specifically overridden by variant
            merged.id = baseLevel.id;
            merged.tier = baseLevel.tier;
            
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

        this.currentLevel = levelToLoad;
        this.currentVariant = variant; // Track current variant
        this.state = 'PLAYING';

        const showIntro = options && options.showIntro === false ? false : true;

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
        const xpReward = this.currentLevel.xpReward || 0;
        const bonusXP = Math.round(xpReward * (score / 100));

        // Update progress for the variant
        if (!this.progress.completedLevels[levelId]) {
            this.progress.completedLevels[levelId] = { easy: false, medium: false, hard: false };
        }
        this.progress.completedLevels[levelId][this.currentVariant] = true;

        this.progress.xp += bonusXP;

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

        globalEvents.emit(Events.XP_GAINED, {
            amount: bonusXP,
            total: this.progress.xp
        });
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
     * Start sandbox mode (free play)
     */
    startSandbox() {
        const sandboxLevel = LevelGenerator.generateSandboxLevel();
        // Populate available gates with all gates
        sandboxLevel.availableGates = Object.keys(this.gates);
        this.currentLevel = sandboxLevel;

        globalEvents.emit(Events.LEVEL_LOADED, {
            level: this.currentLevel,
            mode: 'SANDBOX',
            showIntro: true
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
     */
    getLowestUncompletedVariant(levelId) {
        if (!levelId || !this.levelVariants) return 'easy';
        const variants = this.levelVariants[levelId] || {};
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

            // Ensure selectedVariants exists (migrate older saves)
            if (!this.progress.selectedVariants || typeof this.progress.selectedVariants !== 'object') {
                this.progress.selectedVariants = {};
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
