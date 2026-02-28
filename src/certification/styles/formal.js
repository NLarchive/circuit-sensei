/**
 * Certification Module — Formal Template Styles
 * 
 * CSS for the formal/academic certificate template.
 * Add new files in this folder for additional template styles.
 */

const formalStyles = `
/* ===== Formal Certificate Design ===== */
.formal-certificate {
    width: 800px;
    min-height: 620px;
    background: linear-gradient(135deg, #fefefe 0%, #f8f6f0 50%, #fefefe 100%);
    padding: 40px;
    box-sizing: border-box;
    font-family: 'Georgia', 'Times New Roman', serif;
    position: relative;
    color: #1a1a1a;
}

/* Decorative border frame */
.certificate-border-outer {
    position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px;
    border: 3px solid #8b7355; pointer-events: none;
}
.certificate-border-inner {
    position: absolute; top: 22px; left: 22px; right: 22px; bottom: 22px;
    border: 1px solid #c9b896; pointer-events: none;
}

/* Corner ornaments */
.certificate-corner {
    position: absolute; width: 50px; height: 50px; border: 2px solid #8b7355;
}
.certificate-corner.top-left     { top: 30px; left: 30px; border-right: none; border-bottom: none; }
.certificate-corner.top-right    { top: 30px; right: 30px; border-left: none; border-bottom: none; }
.certificate-corner.bottom-left  { bottom: 30px; left: 30px; border-right: none; border-top: none; }
.certificate-corner.bottom-right { bottom: 30px; right: 30px; border-left: none; border-top: none; }

/* Certificate content */
.certificate-content {
    position: relative; z-index: 1; padding: 20px 40px; text-align: center;
}

/* Institution header */
.certificate-institution { margin-bottom: 10px; }
.certificate-institution-name {
    font-size: 14px; text-transform: uppercase; letter-spacing: 4px; color: #6b5a47; margin: 0 0 5px 0;
}
.certificate-department {
    font-size: 12px; letter-spacing: 2px; color: #8b7355; margin: 0;
}

/* Certificate type header */
.certificate-type { margin: 20px 0 12px 0; }
.certificate-type h1 {
    font-size: 42px; font-weight: normal; letter-spacing: 6px;
    text-transform: uppercase; color: #2c3e50; margin: 0; font-family: 'Georgia', serif;
}

.certificate-tier-badge {
    display: inline-block; margin-top: 10px; padding: 6px 20px;
    font-size: 13px; letter-spacing: 3px; text-transform: uppercase;
    border: 1px solid; border-radius: 2px;
}
.certificate-tier-badge.simple       { background: linear-gradient(135deg,#e8f5e9,#c8e6c9); border-color:#4caf50; color:#2e7d32; }
.certificate-tier-badge.intermediate { background: linear-gradient(135deg,#e3f2fd,#bbdefb); border-color:#1976d2; color:#1565c0; }
.certificate-tier-badge.advanced     { background: linear-gradient(135deg,#fce4ec,#f8bbd9); border-color:#c2185b; color:#ad1457; }
.certificate-tier-badge.expert       { background: linear-gradient(135deg,#f3e5f5,#ce93d8); border-color:#9c27b0; color:#6a1b9a; }
.certificate-tier-badge.in-progress  { background: linear-gradient(135deg,#fff3e0,#ffe0b2); border-color:#f57c00; color:#e65100; }

/* Certification statement */
.certificate-statement { margin: 20px 0; line-height: 1.6; }
.certificate-statement .preamble { font-size: 14px; font-style: italic; color: #555; margin-bottom: 12px; }
.certificate-recipient {
    font-size: 32px; font-family: 'Brush Script MT','Segoe Script',cursive;
    color: #1a365d; margin: 12px 0; border-bottom: 2px solid #c9b896;
    display: inline-block; padding: 5px 40px;
}
.certificate-achievement {
    font-size: 14px; line-height: 1.8; color: #333; max-width: 600px; margin: 12px auto;
}

/* Skills */
.certificate-skills { margin: 12px 0; text-align: center; }
.certificate-skills-title {
    font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #8b7355; margin-bottom: 8px;
}
.certificate-skills-list {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
}
.certificate-skill-tag {
    display: inline-block; padding: 4px 12px; font-size: 10px; letter-spacing: 1px;
    background: rgba(0,0,0,0.03); border: 1px solid #c9b896; border-radius: 2px;
    color: #555; font-family: 'Segoe UI', sans-serif;
}

/* Metrics section */
.certificate-metrics {
    display: flex; justify-content: center; gap: 40px; margin: 18px 0;
    padding: 12px; background: rgba(0,0,0,0.02); border-radius: 4px;
}
.certificate-metric { text-align: center; }
.certificate-metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
.certificate-metric-label {
    font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #6b5a47; margin-top: 4px;
}

/* Titles/Honors */
.certificate-honors { margin: 14px 0; padding: 10px; }
.certificate-honors-title {
    font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #8b7355; margin-bottom: 8px;
}
.certificate-honors-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.certificate-honor-badge {
    display: inline-block; padding: 5px 12px; font-size: 10px; letter-spacing: 1px;
    background: linear-gradient(135deg,#fff8e1,#ffecb3); border: 1px solid #ffc107;
    border-radius: 3px; color: #6d4c00;
}
.certificate-honor-badge.hintless     { background: linear-gradient(135deg,#e8f5e9,#c8e6c9); border-color:#4caf50; color:#1b5e20; }
.certificate-honor-badge.distinction  { background: linear-gradient(135deg,#fce4ec,#f8bbd9); border-color:#e91e63; color:#880e4f; }

/* Seal */
.certificate-seal {
    position: absolute; bottom: 70px; right: 70px; width: 100px; height: 100px;
    background: linear-gradient(135deg,#8b7355,#6b5a47); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1);
}
.certificate-seal-inner {
    width: 80px; height: 80px; border: 2px solid #c9b896; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f8f6f0;
}
.certificate-seal-icon { font-size: 24px; }
.certificate-seal-text { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

/* Footer metadata */
.certificate-footer {
    margin-top: 18px; padding-top: 12px; border-top: 1px solid #c9b896;
    display: flex; justify-content: space-between; align-items: flex-end;
}
.certificate-date { text-align: left; }
.certificate-date-label  { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8b7355; }
.certificate-date-value  { font-size: 13px; color: #333; margin-top: 4px; }
.certificate-id { text-align: right; }
.certificate-id-label  { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8b7355; }
.certificate-id-value  { font-size: 11px; font-family: 'Consolas', monospace; color: #666; margin-top: 4px; }

/* Issuer line */
.certificate-issuer { text-align: center; margin-top: 8px; }
.certificate-issuer-text { font-size: 11px; color: #6b5a47; letter-spacing: 1px; }

/* Hintless badge */
.certificate-hintless-badge {
    position: absolute; top: 55px; right: 55px; padding: 8px 14px;
    background: linear-gradient(135deg,#1b5e20,#2e7d32); color: #fff;
    font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
    transform: rotate(15deg); box-shadow: 0 2px 8px rgba(0,0,0,0.2); border-radius: 2px;
}
.certificate-hintless-badge.summa {
    background: linear-gradient(135deg,#b8860b,#daa520 50%,#b8860b);
    box-shadow: 0 2px 12px rgba(218,165,32,0.4); font-weight: bold;
}
.certificate-metric.hintless-highlight .certificate-metric-value { color: #2e7d32; }
.certificate-seal.hintless-seal { background: linear-gradient(135deg,#b8860b,#daa520); }
.certificate-seal.hintless-seal .certificate-seal-inner { border-color: #fff8dc; }

/* Watermark */
.certificate-watermark {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%) rotate(-30deg);
    font-size: 100px; color: rgba(0,0,0,0.02); font-family: 'Georgia', serif;
    pointer-events: none; white-space: nowrap; letter-spacing: 10px;
}
`;

export default formalStyles;
