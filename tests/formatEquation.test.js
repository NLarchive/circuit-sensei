import { describe, it, expect } from 'vitest';

// Test the formatEquation fallback behavior
// (No longer testing complex LaTeX parsing; that's handled by build-time KaTeX)
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatEquation(eq, prerenderedHtml = null) {
    // If pre-rendered HTML from KaTeX build-time is available, use it
    if (prerenderedHtml) {
        return prerenderedHtml;
    }
    
    // Fallback for simple inline formulas (not pre-rendered)
    if (!eq) return '';
    
    return escapeHtml(String(eq));
}

describe('formatEquation', () => {
    it('returns pre-rendered HTML when available', () => {
        const prerendered = '<span class="katex"><span>x</span></span>';
        expect(formatEquation('any input', prerendered)).toBe(prerendered);
    });

    it('escapes HTML in fallback mode', () => {
        expect(formatEquation('<script>')).toBe('&lt;script&gt;');
        expect(formatEquation('a & b')).toBe('a &amp; b');
    });

    it('returns empty string for null/empty input', () => {
        expect(formatEquation('')).toBe('');
        expect(formatEquation(null)).toBe('');
    });

    it('handles plain text without modification in fallback', () => {
        expect(formatEquation('simple text')).toBe('simple text');
        expect(formatEquation('V = I × R')).toBe('V = I × R');
    });
});
