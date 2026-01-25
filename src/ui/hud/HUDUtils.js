export const HUDUtils = {
    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    formatEquation(eq, prerenderedHtml = null) {
        if (prerenderedHtml) {
            return prerenderedHtml;
        }
        
        if (!eq) return '';
        
        let escaped = this.escapeHtml(String(eq));
        
        escaped = escaped.replace(/\\times/g, '×');
        escaped = escaped.replace(/\\cdot/g, '·');
        escaped = escaped.replace(/\\pm/g, '±');
        escaped = escaped.replace(/\\approx/g, '≈');
        escaped = escaped.replace(/\\Delta/g, 'Δ');
        escaped = escaped.replace(/\\Omega/g, 'Ω');
        escaped = escaped.replace(/\\mu/g, 'μ');
        escaped = escaped.replace(/\\phi/g, 'φ');
        escaped = escaped.replace(/\\theta/g, 'θ');
        escaped = escaped.replace(/\\Sigma/g, 'Σ');
        escaped = escaped.replace(/\\sum/g, 'Σ');
        escaped = escaped.replace(/\\oplus/g, '⊕');
        escaped = escaped.replace(/\\le/g, '≤');
        escaped = escaped.replace(/\\ge/g, '≥');
        escaped = escaped.replace(/\\lceil/g, '⌈');
        escaped = escaped.replace(/\\rceil/g, '⌉');
        escaped = escaped.replace(/\\lfloor/g, '⌊');
        escaped = escaped.replace(/\\rfloor/g, '⌋');
        escaped = escaped.replace(/\\to/g, '→');
        
        escaped = escaped.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
        escaped = escaped.replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>');
        
        escaped = escaped.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
        escaped = escaped.replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>');

        escaped = escaped.replace(/\\text\{([^}]+)\}/g, '$1');

        escaped = escaped.replace(/\\bar\{([^}]+)\}/g, '<span style="text-decoration: overline;">$1</span>');
        escaped = escaped.replace(/\\overline\{([^}]+)\}/g, '<span style="text-decoration: overline;">$1</span>');
        
        return escaped;
    },

    formatStoryText(text) {
        if (!text) return '';

        const normalized = String(text).replace(/\r\n/g, '\n').trim();
        if (!normalized) return '';

        const blocks = normalized.split(/\n{2,}/);
        return blocks.map(block => this.formatStoryBlock(block)).join('');
    },

    formatStoryBlock(block) {
        const trimmed = String(block || '').trim();
        if (!trimmed) return '';

        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

        const isUnorderedList = lines.length > 1 && lines.every(l => /^[-•]\s+/.test(l));
        const isOrderedList = lines.length > 1 && lines.every(l => /^\d+\.\s+/.test(l));

        if (isUnorderedList) {
            const items = lines.map(l => `<li>${this.escapeHtml(l.replace(/^[-•]\s+/, ''))}</li>`).join('');
            return `<ul>${items}</ul>`;
        }
        if (isOrderedList) {
            const items = lines.map(l => `<li>${this.escapeHtml(l.replace(/^\d+\.\s+/, ''))}</li>`).join('');
            return `<ol>${items}</ol>`;
        }

        const singleLine = lines.join(' ');

        const titleMatch = singleLine.match(/^([A-Za-z0-9][A-Za-z0-9\s&\-–—'’()]+):\s+(.+)$/);
        if (titleMatch) {
            const heading = this.escapeHtml(titleMatch[1]);
            const rest = titleMatch[2];
            return `<h4>${heading}</h4>${this.splitLongTextToParagraphs(rest).map(p => `<p>${p}</p>`).join('')}`;
        }

        return this.splitLongTextToParagraphs(singleLine).map(p => `<p>${p}</p>`).join('');
    },

    splitLongTextToParagraphs(text) {
        const safe = this.escapeHtml(String(text || '').trim());
        if (!safe) return [];

        if (safe.length <= 260) return [safe];

        const sentences = safe
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(Boolean);

        const paragraphs = [];
        let current = '';
        for (const sentence of sentences) {
            const candidate = current ? `${current} ${sentence}` : sentence;
            if (candidate.length > 320 && current) {
                paragraphs.push(current);
                current = sentence;
            } else {
                current = candidate;
            }
        }
        if (current) paragraphs.push(current);
        return paragraphs;
    }
};
