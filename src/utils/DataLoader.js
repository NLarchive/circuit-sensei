/**
 * DataLoader - Centralized data loading utilities
 * Single source of truth for glossary and formula data
 * Prevents duplicate fetch calls and ensures consistent caching
 */

let _glossaryData = null;
let _formulaData = null;
let _glossaryPromise = null;
let _formulaPromise = null;

export const DataLoader = {
    /**
     * Load glossary data with caching
     * @returns {Promise<Object|null>} Glossary data or null if failed
     */
    async getGlossary() {
        if (_glossaryData) return _glossaryData;
        if (_glossaryPromise) return _glossaryPromise;

        _glossaryPromise = fetch('./story/glossary.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load glossary');
                return response.json();
            })
            .then(data => {
                _glossaryData = data;
                _glossaryPromise = null;
                return data;
            })
            .catch(e => {
                console.warn('Could not load glossary:', e);
                _glossaryPromise = null;
                return null;
            });

        return _glossaryPromise;
    },

    /**
     * Load formula data with caching
     * @returns {Promise<Object|null>} Formula data or null if failed
     */
    async getFormulas() {
        if (_formulaData) return _formulaData;
        if (_formulaPromise) return _formulaPromise;

        _formulaPromise = fetch('./story/formulas.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load formulas');
                return response.json();
            })
            .then(data => {
                _formulaData = data;
                _formulaPromise = null;
                return data;
            })
            .catch(e => {
                console.warn('Could not load formulas:', e);
                _formulaPromise = null;
                return null;
            });

        return _formulaPromise;
    },

    /**
     * Preload both glossary and formula data
     * Useful for initializing the app
     */
    async preload() {
        return Promise.all([this.getGlossary(), this.getFormulas()]);
    },

    /**
     * Clear cache (useful for testing or forcing refresh)
     */
    clearCache() {
        _glossaryData = null;
        _formulaData = null;
        _glossaryPromise = null;
        _formulaPromise = null;
    }
};
