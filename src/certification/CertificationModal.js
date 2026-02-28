/**
 * CertificationModal — Self-contained popup for certification overview
 *
 * Features:
 *   - Recipient name input (persisted in localStorage)
 *   - Current date embedded
 *   - Skills / knowledge domain display
 *   - Tier progress & requirements checklist
 *   - View / Download / Share actions (delegates to CertificateRenderer)
 *
 * Designed as a plug-and-play component:
 *   import { CertificationModal } from 'src/certification';
 *   CertificationModal.open(certificationData);
 */

import defaultConfig from './config/default.js';
import { certificateRenderer } from './CertificateRenderer.js';

const MODAL_ID = 'certification-modal';

export class CertificationModal {
    constructor(config = defaultConfig, renderer = certificateRenderer) {
        this.config   = config;
        this.renderer = renderer;
        this._injected = false;
    }

    /* ══════════════════ public API ══════════════════ */

    /** Open the modal with the given certification data */
    open(certification) {
        this._ensureDOM();
        this._populate(certification);
        const el = document.getElementById(MODAL_ID);
        if (el) el.classList.remove('hidden');
    }

    /** Close the modal */
    close() {
        const el = document.getElementById(MODAL_ID);
        if (el) el.classList.add('hidden');
    }

    /* ══════════════════ DOM scaffold ══════════════════ */

    _ensureDOM() {
        if (this._injected && document.getElementById(MODAL_ID)) return;
        this._injectStyles();
        this._injectHTML();
        this._bindEvents();
        this._injected = true;
    }

    _injectStyles() {
        if (document.getElementById('certification-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'certification-modal-styles';
        style.textContent = `
            /* ─── Certification Modal ─── */
            #${MODAL_ID} {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.82);
                z-index: 9000;
                display: flex; align-items: center; justify-content: center;
                padding: 20px; box-sizing: border-box;
            }
            #${MODAL_ID}.hidden { display: none; }

            .certmodal-box {
                background: linear-gradient(135deg, rgba(30,30,40,0.97) 0%, rgba(20,20,30,0.97) 100%);
                border: 1px solid var(--border-color, #444);
                border-radius: var(--radius-lg, 12px);
                max-width: 520px; width: 100%;
                max-height: 90vh; overflow-y: auto;
                padding: var(--spacing-2xl, 28px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                color: var(--text-color, #ddd);
            }

            /* header */
            .certmodal-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
            .certmodal-icon { font-size: 2.5rem; }
            .certmodal-header h3 {
                margin: 0; font-size: var(--font-size-lg, 18px);
                text-transform: uppercase; letter-spacing: 2px;
                color: var(--text-light, #fff);
            }
            .certmodal-tier-label {
                font-size: var(--font-size-sm, 13px);
                margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;
                color: var(--text-muted, #888);
            }
            .certmodal-tier-label.simple       { color: #4caf50; }
            .certmodal-tier-label.intermediate  { color: #2196f3; }
            .certmodal-tier-label.advanced      { color: #e91e63; }

            /* name input row */
            .certmodal-name-row {
                display: flex; gap: 10px; align-items: center;
                margin-bottom: 14px;
            }
            .certmodal-name-row label {
                font-size: var(--font-size-sm, 13px);
                white-space: nowrap; color: var(--text-muted, #999);
            }
            .certmodal-name-row input {
                flex: 1; padding: 6px 10px;
                border: 1px solid var(--border-color, #555);
                border-radius: var(--radius-sm, 4px);
                background: rgba(255,255,255,0.06);
                color: var(--text-light, #fff);
                font-size: var(--font-size-base, 14px);
            }

            /* issued date */
            .certmodal-date {
                font-size: var(--font-size-sm, 13px);
                color: var(--text-muted, #999);
                margin-bottom: 14px;
            }

            /* skills */
            .certmodal-skills { margin-bottom: 14px; }
            .certmodal-skills-title {
                font-size: var(--font-size-xs, 11px);
                text-transform: uppercase; letter-spacing: 2px;
                color: var(--text-muted, #888); margin-bottom: 6px;
            }
            .certmodal-skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
            .certmodal-skill-tag {
                padding: 3px 10px; font-size: var(--font-size-xs, 11px);
                background: rgba(255,255,255,0.05); border: 1px solid var(--border-color, #555);
                border-radius: 3px; color: var(--text-color, #ccc);
            }

            /* metrics row */
            .certmodal-metrics {
                display: flex; justify-content: space-around; gap: 10px;
                padding: 12px; background: rgba(0,0,0,0.2);
                border-radius: var(--radius-sm, 4px);
                margin-bottom: 14px;
            }
            .certmodal-metric { text-align: center; }
            .certmodal-metric-value {
                font-size: var(--font-size-xl, 22px);
                font-weight: bold; color: var(--text-light, #fff);
            }
            .certmodal-metric-label {
                font-size: var(--font-size-xs, 10px);
                text-transform: uppercase; letter-spacing: 1px;
                color: var(--text-muted, #888); margin-top: 2px;
            }

            /* honors */
            .certmodal-honors { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
            .certmodal-honor-tag {
                display: inline-block; padding: 4px 10px;
                font-size: var(--font-size-xs, 11px); border-radius: 3px;
                background: rgba(255,193,7,0.12); color: #ffc107; border: 1px solid rgba(255,193,7,0.25);
            }
            .certmodal-honor-tag.hintless     { background: rgba(76,175,80,0.12); color: #81c784; border-color: rgba(76,175,80,0.25); }
            .certmodal-honor-tag.distinction   { background: rgba(233,30,99,0.12); color: #f48fb1; border-color: rgba(233,30,99,0.25); }

            /* requirements */
            .certmodal-requirements { margin-bottom: 14px; }
            .certmodal-requirements ul { list-style: none; margin: 0; padding: 0; }
            .certmodal-requirements li {
                position: relative; padding-left: 26px;
                margin: 6px 0; font-size: var(--font-size-sm, 13px);
                color: var(--text-color, #ccc);
            }
            .certmodal-requirements li::before {
                content: ''; position: absolute; left: 0; top: 50%;
                transform: translateY(-50%); width: 16px; height: 16px;
                border-radius: 50%; border: 2px solid var(--border-color, #555);
            }
            .certmodal-requirements li.completed::before {
                background: var(--success-color, #4caf50); border-color: var(--success-color, #4caf50);
            }
            .certmodal-requirements li.completed::after {
                content: '✓'; position: absolute; left: 3px; top: 50%;
                transform: translateY(-50%); font-size: 10px; color: #fff;
            }

            /* cert description */
            .certmodal-desc {
                font-size: var(--font-size-base, 14px);
                line-height: 1.5; margin-bottom: 14px;
                color: var(--text-color, #ccc);
            }

            /* actions */
            .certmodal-actions {
                display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px;
            }
            .certmodal-actions .btn { flex: 1; min-width: 100px; font-size: var(--font-size-sm, 13px); }
            .certmodal-status {
                min-height: 1.2em; margin-top: 8px;
                font-size: var(--font-size-sm, 13px);
                color: var(--text-muted, #888);
            }

            /* issuer line */
            .certmodal-issuer {
                text-align: center; margin-top: 14px; padding-top: 10px;
                border-top: 1px solid var(--border-color, #444);
                font-size: var(--font-size-xs, 11px);
                color: var(--text-muted, #777);
                letter-spacing: 1px;
            }
        `;
        document.head.appendChild(style);
    }

    _injectHTML() {
        if (document.getElementById(MODAL_ID)) return;

        const el = document.createElement('div');
        el.id = MODAL_ID;
        el.className = 'hidden';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-label', 'Certification Overview');

        el.innerHTML = `
        <div class="certmodal-box">
            <div class="certmodal-header">
                <span class="certmodal-icon" id="certmodal-icon">📜</span>
                <div>
                    <h3>Certification Status</h3>
                    <p class="certmodal-tier-label" id="certmodal-tier"></p>
                </div>
            </div>

            <div class="certmodal-name-row">
                <label for="certmodal-name-input">Recipient</label>
                <input type="text" id="certmodal-name-input"
                       placeholder="Enter your name"
                       autocomplete="name" />
            </div>

            <div class="certmodal-date" id="certmodal-date"></div>

            <p class="certmodal-desc" id="certmodal-desc"></p>

            <div class="certmodal-skills" id="certmodal-skills"></div>

            <div class="certmodal-metrics" id="certmodal-metrics"></div>

            <div class="certmodal-honors" id="certmodal-honors"></div>

            <div class="certmodal-requirements" id="certmodal-requirements"></div>

            <div class="certmodal-actions">
                <button id="certmodal-btn-view"     class="btn primary"   disabled>📜 View Certificate</button>
                <button id="certmodal-btn-download"  class="btn secondary" disabled>📥 Download</button>
                <button id="certmodal-btn-share"     class="btn secondary">📤 Share</button>
                <button id="certmodal-btn-close"     class="btn">✕ Close</button>
            </div>
            <p class="certmodal-status" id="certmodal-status" aria-live="polite"></p>

            <div class="certmodal-issuer" id="certmodal-issuer"></div>
        </div>
        `;

        // Always append to body for highest stacking context
        document.body.appendChild(el);
    }

    /* ══════════════════ event wiring ══════════════════ */

    _bindEvents() {
        // Close
        document.getElementById('certmodal-btn-close')?.addEventListener('click', () => this.close());
        document.getElementById(MODAL_ID)?.addEventListener('click', (e) => {
            if (e.target.id === MODAL_ID) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const m = document.getElementById(MODAL_ID);
                if (m && !m.classList.contains('hidden')) this.close();
            }
        });

        // Name persistence
        const nameInput = document.getElementById('certmodal-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                try { localStorage.setItem(this.config.recipient.nameStorageKey, nameInput.value); } catch (_e) { /* noop */ }
            });
        }

        // View
        document.getElementById('certmodal-btn-view')?.addEventListener('click', () => {
            const cert = this._lastCert;
            const name = this._getRecipientName();
            this.renderer.showPreview(cert, name);
        });

        // Download
        document.getElementById('certmodal-btn-download')?.addEventListener('click', async (ev) => {
            const btn = ev.currentTarget;
            const orig = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = '⏳...';
            const cert = this._lastCert;
            const name = this._getRecipientName();
            const res  = await this.renderer.downloadCertificate(cert, name);
            const status = document.getElementById('certmodal-status');
            btn.disabled = false;
            if (res.success) { btn.innerHTML = '✅ Done'; if (status) status.textContent = 'Certificate downloaded.'; }
            else             { btn.innerHTML = '❌ Failed'; if (status) status.textContent = 'Download failed.'; }
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        });

        // Share
        document.getElementById('certmodal-btn-share')?.addEventListener('click', async (ev) => {
            const btn = ev.currentTarget;
            const orig = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = '⏳...';
            const cert = this._lastCert;
            const name = this._getRecipientName();
            const res  = await this.renderer.shareCertificate(cert, name);
            const status = document.getElementById('certmodal-status');
            btn.disabled = false;
            if (res.canceled) { btn.innerHTML = orig; }
            else if (res.success) { btn.innerHTML = '✅ Shared'; if (status) status.textContent = res.copied ? 'Shared! Text copied.' : 'Shared.'; }
            else { btn.innerHTML = '❌ Failed'; if (status) status.textContent = 'Share failed.'; }
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        });
    }

    /* ══════════════════ populate data ══════════════════ */

    _getRecipientName() {
        const input = document.getElementById('certmodal-name-input');
        if (input && input.value.trim()) return input.value.trim();
        try { return localStorage.getItem(this.config.recipient.nameStorageKey) || this.config.recipient.defaultName; }
        catch (_e) { return this.config.recipient.defaultName; }
    }

    _populate(cert) {
        this._lastCert = cert;
        const cfg      = this.config;
        const metrics  = cert?.metrics || {};
        const req      = cert?.requirements || {};
        const titles   = cert?.titles || [];
        const hasCert  = cert?.hasBaseCertification;
        const isHintless = cert?.hintless?.all;

        // Restore name from localStorage
        const nameInput = document.getElementById('certmodal-name-input');
        if (nameInput) {
            try {
                const saved = localStorage.getItem(cfg.recipient.nameStorageKey);
                if (saved) nameInput.value = saved;
            } catch (_e) { /* noop */ }
        }

        // Icon
        const iconEl  = document.getElementById('certmodal-icon');
        const tierMap = { advanced: '🏆', intermediate: '🎯', simple: '🎓', 'in-progress': '📘' };
        if (iconEl) iconEl.textContent = tierMap[cert?.certificationTier] || '📘';

        // Tier label
        const tierEl = document.getElementById('certmodal-tier');
        if (tierEl) {
            tierEl.textContent = cert?.certificationLabel || cfg.tiers['in-progress'].label;
            tierEl.className = `certmodal-tier-label ${cert?.certificationTier || ''}`;
        }

        // Date
        const dateEl = document.getElementById('certmodal-date');
        if (dateEl) {
            const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            if (cert?.issuedAt) {
                const issued = new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                dateEl.textContent = `Issued: ${issued} — Today: ${now}`;
            } else {
                dateEl.textContent = `Current date: ${now}`;
            }
        }

        // Description
        const descEl = document.getElementById('certmodal-desc');
        if (descEl) {
            if (!hasCert) {
                descEl.textContent = 'Complete all Easy levels to earn your foundation certificate in digital logic fundamentals.';
            } else {
                descEl.textContent = `${cert.baseCertification} — ${cfg.company.department}`;
            }
        }

        // Skills
        const skillsEl = document.getElementById('certmodal-skills');
        const skills = cert?.skills || cfg.skills;
        if (skillsEl && skills.length) {
            skillsEl.innerHTML = `
                <div class="certmodal-skills-title">Skills &amp; Knowledge Domain</div>
                <div class="certmodal-skills-list">
                    ${skills.map(s => `<span class="certmodal-skill-tag">${s}</span>`).join('')}
                </div>
            `;
        }

        // Metrics
        const metricsEl = document.getElementById('certmodal-metrics');
        if (metricsEl) {
            metricsEl.innerHTML = `
                <div class="certmodal-metric"><div class="certmodal-metric-value">${cert?.score || 0}%</div><div class="certmodal-metric-label">Score</div></div>
                <div class="certmodal-metric"><div class="certmodal-metric-value">${metrics.earnedStars || 0}/${metrics.totalStars || 0}</div><div class="certmodal-metric-label">Stars</div></div>
                <div class="certmodal-metric"><div class="certmodal-metric-value">${metrics.hintsUsed === 0 && isHintless ? '0 ✓' : (metrics.hintsUsed || 0)}</div><div class="certmodal-metric-label">Hints</div></div>
            `;
        }

        // Honors
        const honorsEl = document.getElementById('certmodal-honors');
        if (honorsEl) {
            if (titles.length) {
                honorsEl.innerHTML = titles.map(t => {
                    let cls = '';
                    if (t.includes('Hintless') || t.includes('Independent')) cls = 'hintless';
                    if (t.includes('Distinction') || t.includes('Summa')) cls = 'distinction';
                    return `<span class="certmodal-honor-tag ${cls}">${t}</span>`;
                }).join('');
            } else {
                honorsEl.innerHTML = '<span class="certmodal-honor-tag" style="opacity:0.5">Complete tiers to earn honors</span>';
            }
        }

        // Requirements
        const reqEl = document.getElementById('certmodal-requirements');
        if (reqEl) {
            reqEl.innerHTML = `<ul>
                <li class="${req.allEasyComplete ? 'completed' : ''}">Foundation: Complete all Easy levels</li>
                <li class="${req.allMediumComplete ? 'completed' : ''}">Intermediate: Complete all Medium levels</li>
                <li class="${req.allHardComplete ? 'completed' : ''}">Advanced: Complete all Hard levels</li>
                <li class="${isHintless ? 'completed' : ''}">Hintless: Complete all variants without hints</li>
            </ul>`;
        }

        // Button states
        const viewBtn     = document.getElementById('certmodal-btn-view');
        const downloadBtn = document.getElementById('certmodal-btn-download');
        const shareBtn    = document.getElementById('certmodal-btn-share');
        if (viewBtn)     viewBtn.disabled     = !hasCert;
        if (downloadBtn) downloadBtn.disabled = !hasCert;
        if (shareBtn)    shareBtn.disabled    = false;

        // Status clear
        const statusEl = document.getElementById('certmodal-status');
        if (statusEl) statusEl.textContent = '';

        // Issuer
        const issuerEl = document.getElementById('certmodal-issuer');
        if (issuerEl) issuerEl.textContent = `Issued by ${cfg.company.name} — ${cfg.company.department}`;
    }
}

/* Singleton default instance */
export const certificationModal = new CertificationModal();
export default CertificationModal;
