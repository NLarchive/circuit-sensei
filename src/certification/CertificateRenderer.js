/**
 * CertificateRenderer — Renders formal certificates to image / PDF
 *
 * Uses pluggable templates + styles from the module subfolders.
 * html2canvas is lazily loaded (Vite-bundled or CDN fallback).
 */

import defaultConfig from './config/default.js';
import formalStyles  from './styles/formal.js';
import formalTemplate from './templates/formal.js';

/* ──────── html2canvas lazy loader ──────── */
let _html2canvas = null;

async function ensureHtml2Canvas() {
    if (_html2canvas) return _html2canvas;
    try {
        const mod = await import('html2canvas');
        _html2canvas = mod.default || mod;
    } catch (_e) {
        console.warn('Dynamic import of html2canvas failed, falling back to CDN', _e);
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload  = () => resolve();
            script.onerror = () => reject(new Error('Failed to load html2canvas from CDN'));
            document.head.appendChild(script);
        });
        if (window.html2canvas) {
            _html2canvas = window.html2canvas;
        } else {
            throw new Error('html2canvas not available after CDN load');
        }
    }
    return _html2canvas;
}

/* ──────── Template registry ──────── */
const TEMPLATES = { formal: formalTemplate };
const STYLES    = { formal: formalStyles };

export class CertificateRenderer {
    constructor(config = defaultConfig) {
        this.config      = config;
        this.containerId = 'certificate-render-container';
        this.styleId     = 'certificate-renderer-styles';
        this.initialized = false;
        this.templateName = config.defaultTemplate || 'formal';
    }

    /* ── public: register additional templates ── */
    static registerTemplate(name, templateFn, styleCss) {
        TEMPLATES[name] = templateFn;
        if (styleCss) STYLES[name] = styleCss;
    }

    /* ── init (creates hidden container + injects CSS) ── */
    init() {
        if (this.initialized) return;
        this._createContainer();
        this._addStyles();
        this.initialized = true;
    }

    _createContainer() {
        if (document.getElementById(this.containerId)) return;
        const el = document.createElement('div');
        el.id = this.containerId;
        el.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;pointer-events:none;z-index:-1;';
        document.body.appendChild(el);
    }

    _addStyles() {
        if (document.getElementById(this.styleId)) return;
        const style = document.createElement('style');
        style.id = this.styleId;
        style.textContent = STYLES[this.templateName] || STYLES.formal;
        document.head.appendChild(style);
    }

    /* ── helpers ── */
    generateCertificateId(certification) {
        const ts = certification?.issuedAt
            ? new Date(certification.issuedAt).getTime()
            : Date.now();
        const tierCode = { advanced: 'ADV', intermediate: 'INT', simple: 'SMP', 'in-progress': 'PRG' }[certification?.certificationTier] || 'UNK';
        const hash = Math.abs(ts).toString(36).toUpperCase().slice(-6);
        return `NL-${tierCode}-${hash}`;
    }

    formatCertificateDate(isoDate) {
        if (!isoDate) return 'In Progress';
        return new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    /* ── build HTML using template ── */
    buildCertificateHTML(certification, recipientName) {
        const cert   = certification || {};
        const config = this.config;
        const name   = recipientName || this._loadRecipientName();

        const data = {
            recipientName:      name,
            certificationTier:  cert.certificationTier || 'in-progress',
            certificationLabel: cert.certificationLabel || config.tiers['in-progress'].label,
            tierDescription:    cert.tierDescription || config.tiers[cert.certificationTier || 'in-progress'].description,
            topicsCovered:      cert.topicsCovered || config.tiers[cert.certificationTier || 'in-progress'].topicsCovered,
            score:              cert.score || 0,
            metrics:            cert.metrics || {},
            titles:             cert.titles || [],
            hintless:           cert.hintless || {},
            certId:             this.generateCertificateId(cert),
            issuedDate:         this.formatCertificateDate(cert.issuedAt),
            skills:             cert.skills || config.skills,
        };

        const templateFn = TEMPLATES[this.templateName] || TEMPLATES.formal;
        return templateFn(data, config);
    }

    _loadRecipientName() {
        try {
            return localStorage.getItem(this.config.recipient.nameStorageKey)
                || this.config.recipient.defaultName;
        } catch (_e) { return this.config.recipient.defaultName; }
    }

    /* ── render to data-URL image ── */
    async renderToImage(certification, recipientName) {
        this.init();
        const container = document.getElementById(this.containerId);
        if (!container) throw new Error('Certificate render container not found');

        container.innerHTML = this.buildCertificateHTML(certification, recipientName);
        await new Promise(r => requestAnimationFrame(r));

        const certEl = container.querySelector('.formal-certificate');
        if (!certEl) throw new Error('Certificate element not found');

        const h2c = await ensureHtml2Canvas();
        const canvas = await h2c(certEl, { scale: 2, useCORS: true, backgroundColor: '#fefefe', logging: false });
        container.innerHTML = '';
        return canvas.toDataURL('image/png');
    }

    /* ── download PNG ── */
    async downloadCertificate(certification, recipientName) {
        try {
            const dataUrl = await this.renderToImage(certification, recipientName);
            const link    = document.createElement('a');
            const certId  = this.generateCertificateId(certification);
            link.download  = `${this.config.company.name}_Certificate_${certId}.png`;
            link.href      = dataUrl;
            link.click();
            return { success: true };
        } catch (error) {
            console.error('Failed to download certificate:', error);
            return { success: false, error: error.message };
        }
    }

    /* ── share (native > clipboard + WhatsApp) ── */
    async shareCertificate(certification, recipientName) {
        const cert      = certification || {};
        const shareText = this.buildShareText(cert);
        const shareUrl  = window.location.href;

        if (navigator.share && navigator.canShare) {
            try {
                const dataUrl = await this.renderToImage(cert, recipientName);
                const blob    = await (await fetch(dataUrl)).blob();
                const file    = new File([blob], `${this.config.company.name}_Certificate.png`, { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ title: `My ${this.config.company.name} Certification`, text: shareText, files: [file], url: shareUrl });
                    return { success: true, method: 'native-share' };
                }
            } catch (err) {
                if (err.name === 'AbortError') return { success: false, canceled: true };
            }
        }

        if (navigator.share) {
            try {
                await navigator.share({ title: `My ${this.config.company.name} Certification`, text: shareText, url: shareUrl });
                return { success: true, method: 'native-text' };
            } catch (err) {
                if (err.name === 'AbortError') return { success: false, canceled: true };
            }
        }

        // Fallback: clipboard + WhatsApp
        const fullText = `${shareText}\n${shareUrl}`;
        let copied = false;
        if (navigator.clipboard?.writeText) {
            try { await navigator.clipboard.writeText(fullText); copied = true; } catch (_e) { /* noop */ }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank', 'noopener,noreferrer');
        return { success: true, method: 'fallback', copied };
    }

    /* ── build share text (uses config templates) ── */
    buildShareText(certification) {
        const cert = certification || {};
        const cfg  = this.config;

        if (!cert.hasBaseCertification) {
            return cfg.share.inProgressTemplate(cert.score || 0);
        }

        const tierEmoji = { advanced: '🏆', intermediate: '🎯', simple: '✅' }[cert.certificationTier] || '📜';
        const titles    = cert.titles || [];
        const isHintless = cert.hintless?.all;

        let text = `${tierEmoji} ${cfg.share.completedTemplate(cert.certificationLabel)}\n\n`;
        text += `📊 Score: ${cert.score}/100\n`;
        text += `✨ XP: ${cert.metrics?.xp || 0}/${cert.metrics?.availableXP || 0}\n`;
        text += `⭐ Stars: ${cert.metrics?.earnedStars || 0}/${cert.metrics?.totalStars || 0}\n`;

        if (isHintless) text += `🎖️ Completed WITHOUT using any hints!\n`;
        if (titles.length > 0) text += `\n🏅 Honors: ${titles.join(' • ')}\n`;
        text += `\n${cfg.share.hashtags}`;
        return text;
    }

    /* ── show inline preview modal ── */
    showPreview(certification, recipientName) {
        this.init();

        const existing = document.getElementById('certificate-preview-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'certificate-preview-modal';
        modal.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;
            background:rgba(0,0,0,0.85);z-index:10000;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            padding:20px;box-sizing:border-box;
        `;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'max-width:100%;max-height:calc(100vh - 120px);overflow:auto;transform-origin:top center;';
        wrapper.innerHTML = this.buildCertificateHTML(certification, recipientName);

        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;gap:15px;margin-top:20px;';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn primary';
        downloadBtn.innerHTML = '📥 Download Certificate';
        downloadBtn.onclick = async () => {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '⏳ Generating...';
            const res = await this.downloadCertificate(certification, recipientName);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = res.success ? '✅ Downloaded!' : '❌ Failed';
            setTimeout(() => { downloadBtn.innerHTML = '📥 Download Certificate'; }, 2000);
        };

        const shareBtn = document.createElement('button');
        shareBtn.className = 'btn secondary';
        shareBtn.innerHTML = '📤 Share Certificate';
        shareBtn.onclick = async () => {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '⏳ Preparing...';
            const res = await this.shareCertificate(certification, recipientName);
            shareBtn.disabled = false;
            if (res.canceled) { shareBtn.innerHTML = '📤 Share Certificate'; }
            else if (res.success) { shareBtn.innerHTML = res.copied ? '✅ Shared & Copied!' : '✅ Shared!'; }
            else { shareBtn.innerHTML = '❌ Failed'; }
            setTimeout(() => { shareBtn.innerHTML = '📤 Share Certificate'; }, 2000);
        };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.innerHTML = '✕ Close';
        closeBtn.onclick = () => modal.remove();

        btns.append(downloadBtn, shareBtn, closeBtn);
        modal.append(wrapper, btns);

        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        const handleEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); } };
        document.addEventListener('keydown', handleEsc);

        document.body.appendChild(modal);
    }
}

/* Singleton default instance */
export const certificateRenderer = new CertificateRenderer();
export default CertificateRenderer;
