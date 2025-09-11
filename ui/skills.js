// /ui/skills.js
import { state } from '../systems/state.js';
import { XP_TABLE, levelFromXp } from '../systems/xp.js';
import { showTip, hideTip } from './tooltip.js';

const SK = [
  { key:'wc',    xp:'wcXp',    id:'#tile-wc',    label:'Woodcutting' },
  { key:'fish',  xp:'fishXp',  id:'#tile-fish',  label:'Fishing' },
  { key:'min',   xp:'minXp',   id:'#tile-min',   label:'Mining' },
  { key:'smith', xp:'smithXp', id:'#tile-smith', label:'Smithing' },
  { key:'craft', xp:'craftXp', id:'#tile-craft', label:'Crafting' },
  { key:'cook',  xp:'cookXp',  id:'#tile-cook',  label:'Cooking' },
  { key:'atk',   xp:'atkXp',   id:'#tile-atk',   label:'Attack' },
  { key:'str',   xp:'strXp',   id:'#tile-str',   label:'Strength' },
  { key:'def',   xp:'defXp',   id:'#tile-def',   label:'Defense' },
];

// Safe helpers around your XP table (assumed cumulative thresholds by level)
function levelFor(xp){ return levelFromXp(xp || 0, XP_TABLE); }
function thresholdsFor(level){
  if (Array.isArray(XP_TABLE)) {
    const base = Number.isFinite(XP_TABLE[level])   ? XP_TABLE[level]   : 0;
    const next = Number.isFinite(XP_TABLE[level+1]) ? XP_TABLE[level+1] : base + level*100;
    return { base, next };
  }
  // Fallback curve if XP_TABLE shape is unexpected
  const base = (level-1) * level * 50;
  const next = base + level*100;
  return { base, next };
}

// Render the whole skills panel (level text + progress bars + tooltips)
export function renderSkills(){
  SK.forEach(s => {
    const tile = document.querySelector(s.id);
    if (!tile) return;

    const xp = state[s.xp] || 0;
    const lvl = levelFor(xp);
    const { base, next } = thresholdsFor(lvl);
    const gained = Math.max(0, xp - base);
    const need   = Math.max(1, next - base);
    const frac   = Math.max(0, Math.min(1, gained / need));

    // 1) Level text — your CSS uses .tile-level
    const lvlEl =
      tile.querySelector('.tile-level') ||
      tile.querySelector('.skill-level') ||
      tile.querySelector('.lvl') ||
      tile.querySelector('.label');
    if (lvlEl) lvlEl.textContent = `Lv ${lvl}`;

    // 2) Progress bar inside the tile, if present (uses your .progress .bar markup)
    const prog = tile.querySelector('.progress');
    if (prog) {
      const bar   = prog.querySelector('.bar');
      const lab   = prog.querySelector('.label');
      if (bar)   bar.style.width = (frac * 100).toFixed(2) + '%';
      if (lab)   lab.textContent = `${gained}/${need}`;
    }

    // 3) Title attribute as a fallback + data attribute for CSS if needed
    tile.title = `${s.label} — Lv ${lvl} · ${xp} xp · ${gained}/${need} this level (${next - xp} to next)`;
    tile.dataset.level = String(lvl);
  });
}

// Optional: richer hover tooltip with totals + progress
function attachHoversOnce(){
  SK.forEach(s=>{
    const tile = document.querySelector(s.id);
    if (!tile) return;
    // Avoid duplicate listeners if called multiple times
    if (tile.__skillHoverBound) return;
    tile.__skillHoverBound = true;

    tile.addEventListener('mousemove', e=>{
      const xp = state[s.xp] || 0;
      const lvl = levelFor(xp);
      const { base, next } = thresholdsFor(lvl);
      const gained = Math.max(0, xp - base);
      const need   = Math.max(1, next - base);
      const toNext = Math.max(0, next - xp);
      showTip(e, `${s.label} — Lv ${lvl}`, `${xp} total xp\n${gained}/${need} this level\n${toNext} xp to next`);
    });
    tile.addEventListener('mouseleave', hideTip);
  });
}
attachHoversOnce();

// Utility used by app.js to detect XP changes cheaply
export function skillsXpSignature(){
  return (
    (state.wcXp|0) + (state.fishXp|0) + (state.minXp|0) +
    (state.smithXp|0) + (state.craftXp|0) + (state.cookXp|0) +
    (state.atkXp|0) + (state.strXp|0) + (state.defXp|0)
  );
}
