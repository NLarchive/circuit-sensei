const fs = require('fs');
const path = require('path');

const formulasPath = 'd:/teach/circuits-logical-gates/story/formulas.json';
const data = JSON.parse(fs.readFileSync(formulasPath, 'utf8'));

function fixLatex(s) {
    if (!s) return s;
    // Replace X / Y with \frac{X}{Y} if it's simple
    // We match word characters or word_{sub}
    let res = s.replace(/([A-Za-z0-9_{}]+)\s*\/\s*([A-Za-z0-9_{}]+)/g, '\\frac{$1}{$2}');
    
    // Subscripts
    // v_d -> v_{d}
    res = res.replace(/([A-Za-z_\\]+)_([A-Za-z0-9]+)/g, (match, p1, p2) => {
        if (p2.startsWith('{')) return match; 
        return `${p1}_{${p2}}`;
    });
    
    const subMap = {'₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9', 'ₙ':'n'};
    for (const [key, val] of Object.entries(subMap)) {
        res = res.replace(new RegExp(key, 'g'), '_{' + val + '}');
    }
    
    // Superscripts
    res = res.replace(/([A-Za-z0-9]+)\^([A-Za-z0-9]+)/g, (match, p1, p2) => {
        if (p2.startsWith('{')) return match;
        return `${p1}^{${p2}}`;
    });
    res = res.replace(/([A-Za-z0-9]+)\^\(([^)]+)\)/g, '$1^{$2}');

    // Symbols
    res = res.replace(/ × /g, ' \\times ');
    res = res.replace(/ ×/g, ' \\times ');
    res = res.replace(/×/g, '\\times');
    res = res.replace(/ · /g, ' \\cdot ');
    res = res.replace(/·/g, '\\cdot');
    res = res.replace(/⊕/g, '\\oplus');
    res = res.replace(/Σ/g, '\\sum ');
    res = res.replace(/\.\.\./g, '\\ldots');
    
    // NOT(...) -> \overline{...}
    res = res.replace(/NOT\(([^)]+)\)/g, '\\overline{$1}');
    
    // Inversions like Ā -> \bar{A}
    res = res.replace(/([A-Z])̄/g, '\\bar{$1}');
    res = res.replace(/([A-Z])bar/g, '\\bar{$1}'); // case where it might be written as Abar
    
    // Explicit fixes for known complex ones
    if (res.includes('NM_H')) res = res.replace('NM_H', 'NM_{H}');
    if (res.includes('NM_L')) res = res.replace('NM_L', 'NM_{L}');
    if (res.includes('t_pd')) res = res.replace('t_pd', 't_{pd}');
    if (res.includes('f_max')) res = res.replace('f_max', 'f_{max}');
    if (res.includes('C_load')) res = res.replace('C_load', 'C_{load}');
    if (res.includes('R_on')) res = res.replace('R_on', 'R_{on}');
    if (res.includes('Q_next')) res = res.replace('Q_next', 'Q_{next}');
    
    return res;
}

// Special manual overrides for tricky one
const overrides = {
  "parallel_resistance": {
    "latex": "\\frac{1}{R_{total}} = \\frac{1}{R_{1}} + \\frac{1}{R_{2}} + \\ldots",
    "formula": "\\frac{1}{R_{total}} = \\frac{1}{R_{1}} + \\frac{1}{R_{2}} + \\ldots"
  },
  "fsm_state_bits": {
    "latex": "Bits = \\lceil \\log_{2}(N) \\rceil",
    "formula": "Bits = \\lceil \\log_{2}(N) \\rceil"
  },
  "full_adder_carry": {
    "latex": "C_{out} = (A \\cdot B) + (C_{in} \\cdot (A \\oplus B))",
    "formula": "C_{out} = (A \\cdot B) + (C_{in} \\cdot (A \\oplus B))"
  },
  "msb_lsb_value": {
    "latex": "Value = MSB \\times 2^{n-1} + \\ldots + LSB \\times 2^{0}",
    "formula": "Value = MSB \\times 2^{n-1} + \\ldots + LSB \\times 2^{0}"
  }
};

for (const key in data.formulas) {
    const f = data.formulas[key];
    if (overrides[key]) {
        f.latex = overrides[key].latex;
        f.formula = overrides[key].formula;
    } else {
        f.latex = fixLatex(f.latex || f.formula);
        f.formula = fixLatex(f.formula);
    }
}

fs.writeFileSync(formulasPath, JSON.stringify(data, null, 2), 'utf8');
console.log('formulas.json updated');
