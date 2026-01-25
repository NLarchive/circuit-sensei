import { gameManager } from '../../game/GameManager.js';
import { HUDUtils } from './HUDUtils.js';
import { DataLoader } from '../../utils/DataLoader.js';

export const HUDGlossary = {
    async showGlossary(initialTab = 'acronyms') {
        const overlay = document.getElementById('glossary-overlay');
        
        await DataLoader.preload();
        
        document.querySelectorAll('.glossary-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === initialTab);
        });
        
        document.getElementById('glossary-search-input').value = '';
        
        this.renderGlossaryTab(initialTab);
        // Ensure inline term click binding is installed once
        this.bindTermClicks();
        
        overlay.classList.remove('hidden');
    },

    async renderGlossaryTab(tabName) {
        const listEl = document.getElementById('glossary-list');
        const glossary = await DataLoader.getGlossary();
        const formulas = await DataLoader.getFormulas();
        
        if (!glossary && !formulas) {
            listEl.innerHTML = '<p class="glossary-error">Could not load reference data.</p>';
            return;
        }
        
        let html = '';
        switch (tabName) {
            case 'acronyms':
                html = this.renderAcronymsList(glossary?.acronyms || {});
                break;
            case 'terms':
                html = this.renderTermsList(glossary?.terms || {});
                break;
            case 'formulas':
                html = this.renderFormulasList(formulas?.formulas || {});
                break;
            case 'current':
                html = this.renderCurrentLevelTerms(glossary, formulas);
                break;
            default:
                html = '<p>Unknown tab</p>';
        }
        
        listEl.innerHTML = html;
        
        listEl.querySelectorAll('.glossary-item-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.closest('.glossary-item');
                item.classList.toggle('expanded');
            });
        });
    },

    renderAcronymsList(acronyms) {
        const sorted = Object.entries(acronyms).sort((a, b) => a[0].localeCompare(b[0]));
        
        if (sorted.length === 0) {
            return '<p class="glossary-empty">No acronyms found.</p>';
        }
        
        return `
            <div class="glossary-section">
                <h3>Acronyms (${sorted.length})</h3>
                <div class="glossary-items">
                    ${sorted.map(([key, data]) => `
                        <div class="glossary-item" data-key="${HUDUtils.escapeHtml(String(key).toLowerCase())}">
                            <div class="glossary-item-header">
                                <span class="glossary-term">${HUDUtils.escapeHtml(key)}</span>
                                <span class="glossary-expansion">${HUDUtils.escapeHtml(data.expansion || '')}</span>
                                <span class="glossary-origin">Level ${this.extractLevelNumber(data.origin_level)}</span>
                            </div>
                            <div class="glossary-item-body">
                                <p class="glossary-definition">${HUDUtils.escapeHtml(data.definition || '')}</p>
                                ${data.category ? `<span class="glossary-category">${HUDUtils.escapeHtml(data.category)}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderTermsList(terms) {
        const sorted = Object.entries(terms).sort((a, b) => a[0].localeCompare(b[0]));
        
        if (sorted.length === 0) {
            return '<p class="glossary-empty">No terms found.</p>';
        }
        
        // Group by category
        const byCategory = {};
        sorted.forEach(([key, data]) => {
            const cat = data.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push([key, data]);
        });
        
        return Object.entries(byCategory).map(([category, items]) => `
            <div class="glossary-section">
                <h3>${this.formatCategoryName(category)} (${items.length})</h3>
                <div class="glossary-items">
                    ${items.map(([key, data]) => `
                        <div class="glossary-item" data-key="${HUDUtils.escapeHtml(String(key).toLowerCase())}">
                            <div class="glossary-item-header">
                                <span class="glossary-term">${HUDUtils.escapeHtml(data.name || key)}</span>
                                <span class="glossary-origin">Level ${this.extractLevelNumber(data.origin_level)}</span>
                            </div>
                            <div class="glossary-item-body">
                                <p class="glossary-definition">${HUDUtils.escapeHtml(data.definition || '')}</p>
                                ${data.why ? `<p class="glossary-why"><strong>Why:</strong> ${HUDUtils.escapeHtml(data.why)}</p>` : ''}
                                ${data.analogy ? `<p class="glossary-analogy"><strong>Analogy:</strong> ${HUDUtils.escapeHtml(data.analogy)}</p>` : ''}
                                ${data.formula ? `<p class="glossary-formula"><strong>Formula:</strong> <code>${HUDUtils.escapeHtml(data.formula)}</code></p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    renderFormulasList(formulas) {
        const sorted = Object.entries(formulas).sort((a, b) => {
            const levelA = this.extractLevelNumber(a[1].origin_level);
            const levelB = this.extractLevelNumber(b[1].origin_level);
            return levelA - levelB;
        });
        
        if (sorted.length === 0) {
            return '<p class="glossary-empty">No formulas found.</p>';
        }
        
        // Group by category
        const byCategory = {};
        sorted.forEach(([key, data]) => {
            const cat = data.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push([key, data]);
        });
        
        return Object.entries(byCategory).map(([category, items]) => `
            <div class="glossary-section">
                <h3>${this.formatCategoryName(category)} (${items.length})</h3>
                <div class="glossary-items">
                    ${items.map(([key, data]) => `
                        <div class="glossary-item formula-item" data-key="${HUDUtils.escapeHtml(String(key).toLowerCase())}">
                            <div class="glossary-item-header">
                                <span class="glossary-term">${HUDUtils.escapeHtml(data.name || key)}</span>
                                <code class="glossary-formula-code">${HUDUtils.formatEquation(data.formula || '', data.html)}</code>
                                <span class="glossary-origin">Level ${this.extractLevelNumber(data.origin_level)}</span>
                            </div>
                            <div class="glossary-item-body">
                                ${data.meaning ? `<p class="glossary-meaning">${HUDUtils.escapeHtml(data.meaning)}</p>` : ''}
                                ${this.renderFormulaVariables(data.variables)}
                                ${data.example ? `
                                    <div class="glossary-example">
                                        <strong>Example:</strong>
                                        <p>${HUDUtils.escapeHtml(data.example.problem || '')}</p>
                                        ${data.example.solution ? `<p class="example-solution">${HUDUtils.escapeHtml(data.example.solution)}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    renderFormulaVariables(variables) {
        if (!variables || typeof variables !== 'object') return '';
        
        const entries = Object.entries(variables);
        if (entries.length === 0) return '';
        
        return `
            <div class="formula-variables">
                <strong>Variables:</strong>
                <ul>
                    ${entries.map(([symbol, data]) => {
                        if (typeof data === 'string') {
                            return `<li><span class="var-symbol">${HUDUtils.escapeHtml(symbol)}</span> = ${HUDUtils.escapeHtml(data)}</li>`;
                        }
                        return `<li>
                            <span class="var-symbol">${HUDUtils.escapeHtml(symbol)}</span> = ${HUDUtils.escapeHtml(data.name || data.meaning || '')}
                            ${data.units ? `<span class="var-units">[${HUDUtils.escapeHtml(data.units)}]</span>` : ''}
                        </li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    },

    renderCurrentLevelTerms(glossary, formulas) {
        const level = gameManager.currentLevel;
        if (!level) {
            return '<p class="glossary-empty">No level loaded.</p>';
        }
        
        const levelId = level.id;
        const levelNum = this.extractLevelNumber(levelId);
        
        // Get terms introduced at or before this level
        const relevantTerms = [];
        const relevantFormulas = [];
        
        if (glossary) {
            // Collect acronyms
            Object.entries(glossary.acronyms || {}).forEach(([key, data]) => {
                const termLevel = this.extractLevelNumber(data.origin_level);
                if (termLevel <= levelNum) {
                    relevantTerms.push({ type: 'acronym', key, data, level: termLevel });
                }
            });
            
            // Collect terms
            Object.entries(glossary.terms || {}).forEach(([key, data]) => {
                const termLevel = this.extractLevelNumber(data.origin_level);
                if (termLevel <= levelNum) {
                    relevantTerms.push({ type: 'term', key, data, level: termLevel });
                }
            });
        }
        
        if (formulas) {
            Object.entries(formulas.formulas || {}).forEach(([key, data]) => {
                const formulaLevel = this.extractLevelNumber(data.origin_level);
                if (formulaLevel <= levelNum) {
                    relevantFormulas.push({ key, data, level: formulaLevel });
                }
            });
        }
        
        // Sort by level (most recent first)
        relevantTerms.sort((a, b) => b.level - a.level);
        relevantFormulas.sort((a, b) => b.level - a.level);
        
        // Terms introduced THIS level
        const newTerms = relevantTerms.filter(t => t.level === levelNum);
        const previousTerms = relevantTerms.filter(t => t.level < levelNum);
        const newFormulas = relevantFormulas.filter(f => f.level === levelNum);
        const previousFormulas = relevantFormulas.filter(f => f.level < levelNum);
        
        let html = `<h3>Level ${levelNum}: ${HUDUtils.escapeHtml(level.title)}</h3>`;
        
        // New terms for this level
        if (newTerms.length > 0 || newFormulas.length > 0) {
            html += `
                <div class="glossary-section current-level-new">
                    <h4>📍 New in This Level</h4>
                    ${newTerms.length > 0 ? `
                        <div class="glossary-items">
                            ${newTerms.map(t => this.renderCurrentLevelItem(t)).join('')}
                        </div>
                    ` : ''}
                    ${newFormulas.length > 0 ? `
                        <div class="glossary-items">
                            ${newFormulas.map(f => this.renderCurrentFormulaItem(f)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Previous terms (collapsed by default)
        if (previousTerms.length > 0 || previousFormulas.length > 0) {
            html += `
                <div class="glossary-section current-level-previous">
                    <details>
                        <summary>📚 Previously Introduced (${previousTerms.length + previousFormulas.length} items)</summary>
                        <div class="glossary-items">
                            ${previousTerms.map(t => this.renderCurrentLevelItem(t)).join('')}
                            ${previousFormulas.map(f => this.renderCurrentFormulaItem(f)).join('')}
                        </div>
                    </details>
                </div>
            `;
        }
        
        return html;
    },

    renderCurrentLevelItem(item) {
        const { type, key, data, level } = item;
        const isAcronym = type === 'acronym';
        
        return `
            <div class="glossary-item compact" data-key="${HUDUtils.escapeHtml(String(key).toLowerCase())}">
                <div class="glossary-item-header">
                    <span class="glossary-term">${HUDUtils.escapeHtml(isAcronym ? key : (data.name || key))}</span>
                    ${isAcronym ? `<span class="glossary-expansion">${HUDUtils.escapeHtml(data.expansion || '')}</span>` : ''}
                    <span class="glossary-origin">L${level}</span>
                </div>
                <div class="glossary-item-body">
                    <p class="glossary-definition">${HUDUtils.escapeHtml(data.definition || '')}</p>
                </div>
            </div>
        `;
    },

    renderCurrentFormulaItem(item) {
        const { key, data, level } = item;
        
        return `
            <div class="glossary-item formula-item compact" data-key="${HUDUtils.escapeHtml(String(key).toLowerCase())}">
                <div class="glossary-item-header">
                    <span class="glossary-term">${HUDUtils.escapeHtml(data.name || key)}</span>
                    <code class="glossary-formula-code">${HUDUtils.formatEquation(data.formula || '', data.html)}</code>
                    <span class="glossary-origin">L${level}</span>
                </div>
                <div class="glossary-item-body">
                    <p class="glossary-meaning">${HUDUtils.escapeHtml(data.meaning || '')}</p>
                </div>
            </div>
        `;
    },

    filterGlossary(searchTerm) {
        const items = document.querySelectorAll('.glossary-item');
        const term = String(searchTerm || '').toLowerCase().trim();
        
        items.forEach(item => {
            if (!term) {
                item.style.display = '';
                return;
            }
            
            const key = item.dataset.key || '';
            const text = (item.textContent || '').toLowerCase();
            
            if (key.includes(term) || text.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    extractLevelNumber(levelId) {
        if (!levelId) return 0;
        const match = String(levelId).match(/level_(\d+|boss)/i);
        if (match) {
            if (match[1].toLowerCase() === 'boss') return 20;
            return parseInt(match[1], 10);
        }
        return 0;
    },

    formatCategoryName(category) {
        if (!category) return 'Other';
        return String(category)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    },

    // Small helper to escape regex special characters for term matching
    escapeRegex(string) {
        return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Replace known glossary/formula terms in provided HTML with clickable term links.
     */
    async linkifyTerms(html) {
        const glossary = await DataLoader.getGlossary();
        const formulas = await DataLoader.getFormulas();
        if (!glossary && !formulas) return html;

        const terms = [];
        if (glossary?.acronyms) Object.keys(glossary.acronyms).forEach(k => terms.push(k));
        if (glossary?.terms) Object.keys(glossary.terms).forEach(k => terms.push(k));
        if (formulas?.formulas) Object.keys(formulas.formulas).forEach(k => terms.push(k));

        // Sort longest-first to avoid partial matches (e.g. "CPU" before "CP")
        terms.sort((a, b) => b.length - a.length);

        let result = html;
        terms.forEach(term => {
            const regex = new RegExp(`\\b(${this.escapeRegex(term)})\\b`, 'gi');
            result = result.replace(regex, (match) => `<span class="term-link" data-term="${HUDUtils.escapeHtml(term)}">${match}</span>`);
        });

        return result;
    },

    /**
     * Show a popup with a term definition (used by inline term links).
     */
    async showTermPopup(termKey, x, y) {
        const popup = document.getElementById('term-popup');
        const titleEl = document.getElementById('term-popup-title');
        const bodyEl = document.getElementById('term-popup-body');

        const glossary = await DataLoader.getGlossary();
        const formulas = await DataLoader.getFormulas();

        const termLower = String(termKey || '').toLowerCase().replace(/[_-]/g, ' ');

        // Search in acronyms
        let found = null;
        if (glossary?.acronyms) {
            for (const [key, data] of Object.entries(glossary.acronyms)) {
                if (key.toLowerCase() === termLower || key.toLowerCase() === String(termKey).toLowerCase()) {
                    found = { type: 'acronym', key, data };
                    break;
                }
            }
        }

        // Search in terms
        if (!found && glossary?.terms) {
            for (const [key, data] of Object.entries(glossary.terms)) {
                const keyNorm = key.toLowerCase().replace(/[_-]/g, ' ');
                if (keyNorm === termLower || (data.name && data.name.toLowerCase() === termLower)) {
                    found = { type: 'term', key, data };
                    break;
                }
            }
        }

        // Search in formulas
        if (!found && formulas?.formulas) {
            for (const [key, data] of Object.entries(formulas.formulas)) {
                const keyNorm = key.toLowerCase().replace(/[_-]/g, ' ');
                if (keyNorm === termLower || (data.name && data.name.toLowerCase() === termLower)) {
                    found = { type: 'formula', key, data };
                    break;
                }
            }
        }

        if (!found) {
            titleEl.textContent = termKey;
            bodyEl.innerHTML = '<p>No definition found.</p>';
        } else if (found.type === 'acronym') {
            titleEl.textContent = found.key;
            bodyEl.innerHTML = `
                <p class="term-expansion"><strong>${HUDUtils.escapeHtml(found.data.expansion || '')}</strong></p>
                <p>${HUDUtils.escapeHtml(found.data.definition || '')}</p>
                <p class="term-origin">Introduced in Level ${this.extractLevelNumber(found.data.origin_level)}</p>
            `;
        } else if (found.type === 'term') {
            titleEl.textContent = found.data.name || found.key;
            bodyEl.innerHTML = `
                <p>${HUDUtils.escapeHtml(found.data.definition || '')}</p>
                ${found.data.why ? `<p><strong>Why:</strong> ${HUDUtils.escapeHtml(found.data.why)}</p>` : ''}
                ${found.data.analogy ? `<p><strong>Analogy:</strong> ${HUDUtils.escapeHtml(found.data.analogy)}</p>` : ''}
                <p class="term-origin">Introduced in Level ${this.extractLevelNumber(found.data.origin_level)}</p>
            `;
        } else if (found.type === 'formula') {
            titleEl.textContent = found.data.name || found.key;
            bodyEl.innerHTML = `
                <p class="formula-display"><code>${HUDUtils.formatEquation(found.data.formula || '', found.data.html)}</code></p>
                <p>${HUDUtils.escapeHtml(found.data.meaning || '')}</p>
                ${this.renderFormulaVariables(found.data.variables)}
                <p class="term-origin">Introduced in Level ${this.extractLevelNumber(found.data.origin_level)}</p>
            `;
        }

        // Position popup (keep it onscreen)
        popup.style.left = `${Math.min(x, window.innerWidth - 320)}px`;
        popup.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
        popup.classList.remove('hidden');
    },

    /**
     * Bind document-level click handler to open term popups when .term-link is clicked
     */
    bindTermClicks() {
        if (window._hudGlossaryTermBound) return;
        window._hudGlossaryTermBound = true;
        const self = this;
        document.addEventListener('click', function (ev) {
            const el = ev.target && ev.target.closest && ev.target.closest('.term-link');
            if (!el) return;
            ev.preventDefault();
            self.showTermPopup(el.dataset.term, ev.clientX, ev.clientY);
        });
    },
};
