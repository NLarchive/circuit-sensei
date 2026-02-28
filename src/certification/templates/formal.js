/**
 * Certification Module — Formal Certificate HTML Template
 *
 * Receives a data object and config, returns HTML string.
 * Add new files in this folder for alternative template layouts.
 */

/**
 * @param {object} data — merged certification data + computed fields
 * @param {object} config — full config from config/default.js
 * @returns {string} HTML string for the certificate
 */
export function formalTemplate(data, config) {
    const {
        recipientName,
        certificationTier,
        certificationLabel,
        tierDescription,
        topicsCovered,
        score,
        metrics,
        titles,
        hintless,
        certId,
        issuedDate,
        skills,
    } = data;

    const company = config.company;
    const isHintless = hintless?.all;
    const isTierHintless = hintless?.easy || hintless?.medium || hintless?.hard;

    // Hintless badge text
    let hintlessBadgeText = '';
    if (isHintless) {
        hintlessBadgeText = '★ SUMMA CUM LAUDE — HINTLESS MASTER ★';
    } else if (hintless?.hard) {
        hintlessBadgeText = '★ ADVANCED TIER — INDEPENDENT ★';
    } else if (hintless?.medium) {
        hintlessBadgeText = '★ INTERMEDIATE — INDEPENDENT ★';
    } else if (hintless?.easy) {
        hintlessBadgeText = '★ FOUNDATION — INDEPENDENT ★';
    }

    const xpEarned = metrics?.xp || 0;
    const totalXP = metrics?.availableXP || 0;
    const starsEarned = metrics?.earnedStars || 0;
    const totalStars = metrics?.totalStars || 0;

    return `
        <div class="formal-certificate">
            <!-- Decorative elements -->
            <div class="certificate-border-outer"></div>
            <div class="certificate-border-inner"></div>
            <div class="certificate-corner top-left"></div>
            <div class="certificate-corner top-right"></div>
            <div class="certificate-corner bottom-left"></div>
            <div class="certificate-corner bottom-right"></div>
            <div class="certificate-watermark">${config.certificate.watermark}</div>

            ${isTierHintless ? `<div class="certificate-hintless-badge ${isHintless ? 'summa' : ''}">${hintlessBadgeText}</div>` : ''}

            <div class="certificate-content">
                <!-- Institution Header -->
                <div class="certificate-institution">
                    <p class="certificate-institution-name">${company.name}</p>
                    <p class="certificate-department">${company.department}</p>
                </div>

                <!-- Certificate Type -->
                <div class="certificate-type">
                    <h1>${config.certificate.title}</h1>
                    <span class="certificate-tier-badge ${certificationTier || 'in-progress'}">
                        ${certificationLabel || 'In Progress'}
                    </span>
                </div>

                <!-- Statement -->
                <div class="certificate-statement">
                    <p class="preamble">This is to certify that</p>
                    <p class="certificate-recipient">${recipientName}</p>
                    <p class="certificate-achievement">
                        has successfully completed the ${company.name} curriculum,
                        ${tierDescription}, covering topics from basic logic gates
                        through ${topicsCovered}.${isHintless ? ' This certification was achieved without utilizing any instructional hints, demonstrating exceptional independent problem-solving ability.' : ''}
                    </p>
                </div>

                <!-- Skills & Knowledge Domain -->
                ${skills && skills.length > 0 ? `
                <div class="certificate-skills">
                    <div class="certificate-skills-title">Skills &amp; Knowledge Domain</div>
                    <div class="certificate-skills-list">
                        ${skills.map(s => `<span class="certificate-skill-tag">${s}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Performance Metrics -->
                <div class="certificate-metrics">
                    <div class="certificate-metric">
                        <div class="certificate-metric-value">${score}%</div>
                        <div class="certificate-metric-label">Overall Score</div>
                    </div>
                    <div class="certificate-metric">
                        <div class="certificate-metric-value">${xpEarned}/${totalXP}</div>
                        <div class="certificate-metric-label">XP Earned</div>
                    </div>
                    <div class="certificate-metric">
                        <div class="certificate-metric-value">${starsEarned}/${totalStars}</div>
                        <div class="certificate-metric-label">Stars</div>
                    </div>
                    <div class="certificate-metric ${isHintless ? 'hintless-highlight' : ''}">
                        <div class="certificate-metric-value">${metrics?.hintsUsed || 0}${isHintless ? ' ✓' : ''}</div>
                        <div class="certificate-metric-label">Hints Used</div>
                    </div>
                </div>

                <!-- Honors/Titles -->
                ${titles && titles.length > 0 ? `
                <div class="certificate-honors">
                    <div class="certificate-honors-title">Honors &amp; Distinctions</div>
                    <div class="certificate-honors-list">
                        ${titles.map(title => {
                            let badgeClass = '';
                            if (title.includes('Hintless') || title.includes('Independent')) badgeClass = 'hintless';
                            if (title.includes('Distinction') || title.includes('Summa')) badgeClass = 'distinction';
                            return `<span class="certificate-honor-badge ${badgeClass}">${title}</span>`;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Footer -->
                <div class="certificate-footer">
                    <div class="certificate-date">
                        <div class="certificate-date-label">Date Issued</div>
                        <div class="certificate-date-value">${issuedDate}</div>
                    </div>
                    <div class="certificate-id">
                        <div class="certificate-id-label">Certificate ID</div>
                        <div class="certificate-id-value">${certId}</div>
                    </div>
                </div>

                <!-- Issuer -->
                <div class="certificate-issuer">
                    <p class="certificate-issuer-text">Issued by ${company.name} — ${company.department}</p>
                </div>
            </div>

            <!-- Official Seal -->
            <div class="certificate-seal ${isHintless ? 'hintless-seal' : ''}">
                <div class="certificate-seal-inner">
                    <span class="certificate-seal-icon">${isHintless ? '🏆' : company.logoEmoji}</span>
                    <span class="certificate-seal-text">${isHintless ? 'Excellence' : company.sealText}</span>
                </div>
            </div>
        </div>
    `;
}

export default formalTemplate;
