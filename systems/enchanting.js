// /systems/enchanting.js
import { ENCHANT_RECIPES } from '../data/enchanting.js';
import { addItem, removeItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP = buildXpTable();
const clampMs = (ms)=> Math.max(300, ms);

function getRec(id){ return ENCHANT_RECIPES?.[id] || null; }
function lvlOf(state){ return levelFromXp(state.enchantXp||0, XP); }

export function canEnchant(state, id){
  const r = getRec(id); if(!r) return false;
  // level gate
  if ((lvlOf(state)) < (r.level||1)) return false;
  // mana gate
  if ((state.manaCurrent||0) < (r.mana||0)) return false;
  // inputs gate
  return (r.inputs||[]).every(inp => (state.inventory[inp.id]||0) >= inp.qty);
}

export function startEnchant(state, id, onDone){
  if (state.action) return false;
  const r = getRec(id); if(!r) return false;
  if (!canEnchant(state, id)) return false;

  const dur = clampMs(r.time || 500);
  const now = performance.now();

  state.action = {
    type: 'enchant',
    key: id,
    label: `Enchant ${r.name || id}`,
    startedAt: now,
    endsAt: now + dur,
    duration: dur
  };

  setTimeout(()=>{
    // Only finish if still the same action
    if (state.action?.type === 'enchant' && state.action?.key === id){
      onDone?.();
    }
  }, dur);

  return true;
}

export function finishEnchant(state, id){
  const r = getRec(id) || getRec(state.action?.key);
  if (!r){ state.action = null; return null; }
  // Re-check: do we still have everything?
  if (!canEnchant(state, r.id)){ state.action = null; return null; }

  // Spend inputs
  (r.inputs||[]).forEach(inp => removeItem(state, inp.id, inp.qty));
  // Spend mana
  state.manaCurrent = Math.max(0, (state.manaCurrent||0) - (r.mana||0));
  // Give outputs
  (r.outputs||[]).forEach(out => addItem(state, out.id, out.qty));

  // Give XP
  if (r?.xp?.skill === 'enchant' && r?.xp?.amount){
    state.enchantXp = (state.enchantXp||0) + r.xp.amount;
  }

  state.action = null;
  return { id: r.id, name: r.name, outputs: r.outputs || [] };
}
