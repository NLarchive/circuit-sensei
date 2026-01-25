const fs = require('fs');
const path = require('path');
const dir = 'story/levels';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let found = false;
files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (!data.physicsDetails || !Array.isArray(data.physicsDetails.conceptCards)) return;
  const map = new Map();
  data.physicsDetails.conceptCards.forEach((card, idx) => {
    const visuals = [];
    if (Array.isArray(card.visuals)) {
      card.visuals.forEach(v => {
        const t = typeof v === 'string' ? v : (v.type || v.visual || v.physicsVisual);
        const title = typeof v === 'string' ? '' : (v.title || v.name || '');
        visuals.push({ t, title, idx, cardTerm: card.term });
      });
    }
    if (card.visual) {
      const v = card.visual;
      const t = typeof v === 'string' ? v : (v.type || v.visual || v.physicsVisual);
      const title = typeof v === 'string' ? '' : (v.title || '');
      visuals.push({ t, title, idx, cardTerm: card.term });
    }
    if (card.physicsVisual) {
      const t = card.physicsVisual;
      visuals.push({ t, title: '', idx, cardTerm: card.term });
    }
    visuals.forEach(v => {
      if (!v.t) return;
      if (!map.has(v.t)) map.set(v.t, []);
      map.get(v.t).push(v);
    });
  });
  const duplicates = [...map].filter(([k, arr]) => arr.length > 1);
  if (duplicates.length) {
    found = true;
    console.log(\n duplicates:);
    duplicates.forEach(([k, arr]) => {
      console.log(  visual: );
      arr.forEach(a => {
        console.log(    card idx: term:\ \ title:\\);
      });
    });
  }
});
if (!found) console.log('No duplicates found');
