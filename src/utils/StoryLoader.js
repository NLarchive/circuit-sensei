/**
 * StoryLoader - Loads story data from the new separated level system
 * 
 * NEW STRUCTURE:
 * - levels-index.json: Lightweight index with file references
 * - level-theory/: Educational content (1 file per base level)
 * - level-puzzles/: Game challenges (1 file per variant)
 * 
 * This loader fetches from the index, then lazy-loads theory and puzzles on demand.
 */
export class StoryLoader {
    static _indexCache = null;
    static _theoryCache = new Map();
    static _puzzleCache = new Map();
    
    // Legacy support: also cache manifest if old code still references it
    static _manifestCache = null;

    /**
     * Load and cache the levels index (lightweight)
     */
    static async loadIndex() {
        if (this._indexCache) return this._indexCache;
        try {
            const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
            const response = await fetch(`${base}story/levels-index.json`);
            this._indexCache = await response.json();
            return this._indexCache;
        } catch (error) {
            console.error('Failed to load levels index:', error);
            return null;
        }
    }

    /**
     * Legacy: Load manifest (for backward compatibility)
     * Now redirects to index but maintains API
     */
    static async loadManifest() {
        if (this._manifestCache) return this._manifestCache;
        
        // Load from new index and reconstruct manifest-like structure
        const index = await this.loadIndex();
        if (!index) return null;
        
        // Build a manifest-compatible structure by loading all levels fully
        const levels = [];
        for (const entry of index.levels) {
            const fullLevel = await this.loadLevel(entry.id);
            if (fullLevel) {
                levels.push(fullLevel);
            }
        }
        
        this._manifestCache = {
            $schema: './levels-manifest.schema.json',
            version: index.version,
            description: index.description,
            levels
        };
        
        return this._manifestCache;
    }

    /**
     * Load all tiers metadata
     */
    static async loadTiers() {
        try {
            const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
            const response = await fetch(`${base}story/tiers.json`);
            return await response.json();
        } catch (error) {
            console.error('Failed to load tiers:', error);
            return {};
        }
    }

    /**
     * Load theory content for a specific level
     * @param {string} levelId - Base level ID (e.g., 'level_01')
     */
    static async loadTheory(levelId) {
        if (this._theoryCache.has(levelId)) {
            return this._theoryCache.get(levelId);
        }
        
        try {
            const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
            const response = await fetch(`${base}story/level-theory/${levelId}.json`);
            const theory = await response.json();
            this._theoryCache.set(levelId, theory);
            return theory;
        } catch (error) {
            console.error(`Failed to load theory for ${levelId}:`, error);
            return null;
        }
    }

    /**
     * Load puzzle content for a specific variant
     * @param {string} puzzleId - Full variant ID (e.g., 'level_01_easy')
     */
    static async loadPuzzle(puzzleId) {
        if (this._puzzleCache.has(puzzleId)) {
            return this._puzzleCache.get(puzzleId);
        }
        
        try {
            const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
            const response = await fetch(`${base}story/level-puzzles/${puzzleId}.json`);
            const puzzle = await response.json();
            this._puzzleCache.set(puzzleId, puzzle);
            return puzzle;
        } catch (error) {
            console.error(`Failed to load puzzle for ${puzzleId}:`, error);
            return null;
        }
    }

    /**
     * Load a specific level by ID from the index
     * Returns merged theory + base puzzle data
     * @param {string} levelId - Base level ID (e.g., 'level_01')
     */
    static async loadLevel(levelId, loadTheory = true) {
        try {
            const index = await this.loadIndex();
            if (!index) return null;
            
            const entry = index.levels.find(l => l.id === levelId);
            if (!entry) return null;
            
            if (!loadTheory) {
                return entry;
            }
            
            // Load theory
            const theory = await this.loadTheory(levelId);
            
            // Merge index entry with theory
            const level = {
                ...entry,
                ...theory
            };
            
            // Remove file references from the merged result
            delete level.theoryFile;
            delete level.puzzleFiles;
            
            return level;
        } catch (error) {
            console.error(`Failed to load level ${levelId}:`, error);
            return null;
        }
    }

    /**
     * Load all levels (in order) from the index
     * Returns full level data (index + theory)
     */
    static async loadAllLevels(loadTheory = true) {
        try {
            const index = await this.loadIndex();
            if (!index) return [];
            
            // Load all levels with their theory
            const levels = await Promise.all(
                index.levels.map(entry => this.loadLevel(entry.id, loadTheory))
            );
            
            return levels.filter(l => l !== null);
        } catch (error) {
            console.error('Failed to load all levels:', error);
            return [];
        }
    }

    /**
     * Deep merge base data with variant override
     */
    static _mergeVariant(baseData, variantName, puzzleData) {
        if (!puzzleData) return null;
        
        // Deep merge helper
        const deepMerge = (target, source) => {
            if (source === undefined) return target;
            if (source === null) return null;
            if (typeof source !== 'object') return source;
            if (Array.isArray(source)) return [...source];
            
            const result = { ...target };
            for (const [key, value] of Object.entries(source)) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && target[key] && typeof target[key] === 'object') {
                    result[key] = deepMerge(target[key], value);
                } else {
                    result[key] = value;
                }
            }
            return result;
        };
        
        // Merge puzzle data on top of base level data
        const merged = deepMerge(baseData, puzzleData);
        merged.id = puzzleData.id || `${baseData.id}_${variantName}`;
        merged.baseId = baseData.id;
        merged.variant = variantName;
        
        return merged;
    }

    /**
     * Load a specific variant of a level
     * @param {string} baseLevelId - Base level ID (e.g., 'level_01')
     * @param {string} variantName - Variant name ('easy', 'medium', 'hard')
     */
    static async loadLevelVariant(baseLevelId, variantName) {
        try {
            // Load base level (index + theory)
            const baseLevel = await this.loadLevel(baseLevelId);
            if (!baseLevel) return null;
            
            // Load puzzle for this variant
            const puzzleId = `${baseLevelId}_${variantName}`;
            const puzzle = await this.loadPuzzle(puzzleId);
            if (!puzzle) return null;
            
            // Merge base level with puzzle
            return this._mergeVariant(baseLevel, variantName, puzzle);
        } catch (error) {
            console.error(`Failed to load variant ${baseLevelId}_${variantName}:`, error);
            return null;
        }
    }

    /**
     * Extract variants for a specific level
     * Returns an object with keys 'easy', 'medium', 'hard' when present
     */
    static async loadLevelVariants(baseLevelId) {
        try {
            const index = await this.loadIndex();
            if (!index) return {};
            
            const entry = index.levels.find(l => l.id === baseLevelId);
            if (!entry || !entry.puzzleFiles) return {};
            
            // Load base level data (for merging)
            const baseLevel = await this.loadLevel(baseLevelId);
            if (!baseLevel) return {};
            
            const variants = {};
            const variantNames = ['easy', 'medium', 'hard'];
            
            for (const v of variantNames) {
                if (entry.puzzleFiles[v]) {
                    const puzzle = await this.loadPuzzle(`${baseLevelId}_${v}`);
                    if (puzzle) {
                        variants[v] = this._mergeVariant(baseLevel, v, puzzle);
                    }
                }
            }
            
            return variants;
        } catch (error) {
            console.error(`Failed to load variants for ${baseLevelId}:`, error);
            return {};
        }
    }

    /**
     * Load levels for a specific tier
     */
    static async loadLevelsByTier(tierId) {
        const allLevels = await this.loadAllLevels();
        return allLevels.filter(level => level.tier === tierId);
    }

    /**
     * Load complete story data (tiers + levels + variants)
     */
    static async loadStoryData(loadTheory = true, loadVariants = true) {
        const [tiers, levels] = await Promise.all([
            this.loadTiers(),
            this.loadAllLevels(loadTheory)
        ]);

        let variants = {};
        if (loadVariants) {
            // Extract variants for each level
            for (const lvl of levels) {
                if (!lvl || !lvl.id) continue;
                const v = await this.loadLevelVariants(lvl.id);
                if (v && Object.keys(v).length) variants[lvl.id] = v;
            }
        }

        return { tiers, levels, variants };
    }

    /**
     * Preload all data (for faster subsequent access)
     */
    static async preloadAll() {
        console.log('Preloading all level data...');
        const start = performance.now();
        
        await this.loadStoryData();
        
        const elapsed = performance.now() - start;
        console.log(`Preload complete in ${elapsed.toFixed(0)}ms`);
    }

    /**
     * Load all level variants (for deferred loading)
     */
    static async loadAllVariants() {
        const index = await this.loadIndex();
        if (!index) return {};

        const variants = {};
        for (const entry of index.levels) {
            if (!entry.puzzleFiles) continue;
            const v = await this.loadLevelVariants(entry.id);
            if (v && Object.keys(v).length) variants[entry.id] = v;
        }
        return variants;
    }
}
