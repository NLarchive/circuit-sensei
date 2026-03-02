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

    /* ── share (web-only: modal with social links) ── */
    async shareCertificate(certification, recipientName) { // eslint-disable-line no-unused-vars
        const cert      = certification || {};
        const shareText = this.buildShareText(cert);
        const shareUrl  = window.location.href;

        // Copy text to clipboard
        let copied = false;
        const fullText = `${shareText}\n${shareUrl}`;
        if (navigator.clipboard?.writeText) {
            try { await navigator.clipboard.writeText(fullText); copied = true; } catch (_e) { /* noop */ }
        }

        // Show social share modal
        this.showShareModal(shareText, shareUrl, copied);
        return { success: true, method: 'web-share-modal', copied };
    }

    /* ── show share modal with social platform links ── */
    showShareModal(shareText, shareUrl, copied) {
        const existing = document.getElementById('certificate-share-modal');
        if (existing) existing.remove();

        const companyName  = this.config.company.name;
        const fullText     = `${shareText}\n${shareUrl}`;
        const tweetText    = encodeURIComponent(shareText);
        const encodedUrl   = encodeURIComponent(shareUrl);
        const encodedFull  = encodeURIComponent(fullText);
        const mailSubject  = encodeURIComponent(`Check out my ${companyName} Certificate`);
        const mailBody     = encodeURIComponent(`${shareText}\n\n${shareUrl}`);

        /* Platform definitions — all open browser tabs, no app-store redirects */
        const platforms = [
            {
                name: 'WhatsApp Web',
                color: '#25d366',
                /* web.whatsapp.com requires desktop login — no app download */
                url: `https://web.whatsapp.com/send?text=${encodedFull}`,
                svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.557 4.115 1.532 5.842L.057 23.57a.5.5 0 0 0 .614.614l5.757-1.473A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.51-5.163-1.4l-.37-.219-3.818.977.994-3.79-.24-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`
            },
            {
                name: 'LinkedIn',
                color: '#0077b5',
                url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
            },
            {
                name: 'Twitter / X',
                color: '#000',
                url: `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`,
                svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
            },
            {
                name: 'Facebook',
                color: '#1877f2',
                url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
            },
            {
                name: 'Email',
                color: '#555',
                url: `mailto:?subject=${mailSubject}&body=${mailBody}`,
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>`
            }
        ];

        /* ── Build modal DOM ── */
        const modal = document.createElement('div');
        modal.id = 'certificate-share-modal';
        modal.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;
            background:rgba(0,0,0,0.82);z-index:11000;
            display:flex;align-items:center;justify-content:center;
            padding:20px;box-sizing:border-box;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            background:#1a1a2e;border-radius:12px;padding:28px 28px 24px;
            width:100%;max-width:380px;
            box-shadow:0 16px 48px rgba(0,0,0,0.5);
            color:#eee;
        `;

        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
        const titleEl = document.createElement('h2');
        titleEl.textContent = 'Share Certificate';
        titleEl.style.cssText = 'margin:0;font-size:18px;color:#fff;';
        const xBtn = document.createElement('button');
        xBtn.textContent = '✕';
        xBtn.title = 'Close';
        xBtn.style.cssText = 'background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;line-height:1;padding:2px 6px;';
        xBtn.onmouseover = () => xBtn.style.color = '#fff';
        xBtn.onmouseout = () => xBtn.style.color = '#aaa';
        xBtn.onclick = () => modal.remove();
        titleRow.append(titleEl, xBtn);

        const sub = document.createElement('p');
        sub.style.cssText = 'margin:0 0 20px 0;font-size:12px;color:#888;';
        sub.textContent = copied ? '✅ Link copied to clipboard — or share via:' : 'Choose a platform to share via the web:';

        const list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        platforms.forEach(p => {
            const a = document.createElement('a');
            a.href   = p.url;
            a.target = '_blank';
            a.rel    = 'noopener noreferrer';
            a.style.cssText = `
                display:flex;align-items:center;gap:14px;padding:11px 16px;
                background:#16213e;border:1px solid #2a2a4a;border-radius:8px;
                text-decoration:none;color:#ddd;font-size:14px;font-weight:500;
                transition:background 0.15s,border-color 0.15s;
            `;
            a.onmouseover = () => { a.style.background = p.color; a.style.borderColor = p.color; a.style.color = '#fff'; };
            a.onmouseout  = () => { a.style.background = '#16213e'; a.style.borderColor = '#2a2a4a'; a.style.color = '#ddd'; };

            const iconWrap = document.createElement('span');
            iconWrap.style.cssText = `display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${p.color};color:#fff;flex-shrink:0;`;
            iconWrap.innerHTML = p.svg;

            const label = document.createElement('span');
            label.textContent = p.name;

            a.append(iconWrap, label);
            list.appendChild(a);
        });

        /* copy button as fallback */
        const copyRow = document.createElement('div');
        copyRow.style.cssText = 'margin-top:14px;display:flex;gap:8px;';

        const copyInput = document.createElement('input');
        copyInput.readOnly = true;
        copyInput.value = shareUrl;
        copyInput.style.cssText = `
            flex:1;padding:8px 10px;background:#16213e;border:1px solid #2a2a4a;
            border-radius:6px;color:#ccc;font-size:12px;outline:none;
        `;
        copyInput.onclick = () => copyInput.select();

        const copyBtn = document.createElement('button');
        copyBtn.textContent = copied ? '✅ Copied' : '📋 Copy';
        copyBtn.style.cssText = `
            padding:8px 14px;background:#16213e;border:1px solid #2a2a4a;
            border-radius:6px;color:#ccc;font-size:12px;cursor:pointer;
            transition:background 0.15s;white-space:nowrap;
        `;
        copyBtn.onmouseover = () => copyBtn.style.background = '#2a2a4a';
        copyBtn.onmouseout  = () => copyBtn.style.background = '#16213e';
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(fullText);
                copyBtn.textContent = '✅ Copied';
                setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
            } catch (_e) {
                copyInput.select();
                document.execCommand('copy');
                copyBtn.textContent = '✅ Copied';
                setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
            }
        };

        copyRow.append(copyInput, copyBtn);
        card.append(titleRow, sub, list, copyRow);
        modal.appendChild(card);

        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        const handleEsc = (e) => {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); }
        };
        document.addEventListener('keydown', handleEsc);
        document.body.appendChild(modal);
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
            const res = await this.shareCertificate(certification, recipientName);
            if (res.success) {
                shareBtn.innerHTML = '✅ Share modal opened';
                setTimeout(() => { shareBtn.innerHTML = '📤 Share Certificate'; }, 2000);
            }
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
