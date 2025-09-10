// systems/smithing.js
import { SMELT_RECIPES, FORGE_RECIPES } from '../data/smithing.js';
import { addItem, removeItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = lvl => 1 + 0.02*(lvl-1);
const clampMs = (ms)=> Math.max(350, ms);

// Quality roll for equipment
export function rollQuality(smithLvl){
  const base = 15 + 1.6*smithLvl;
  const spread = 35 + 0.7*smithLvl;
  const q = Math.floor(base + Math.random()*spread);
  return Math.max(1, Math.min(100, q));
}

// ---- Extras (e.g., wood_handle for weapons/tools) ----
function hasExtras(state, rec){
  if(!rec?.extras?.length) return true;
  return rec.extras.every(ex => (state.inventory[ex.id]||0) >= ex.qty);
}
function spendExtras(state, rec){
  if(!rec?.extras?.length) return;
  rec.extras.forEach(ex => removeItem(state, ex.id, ex.qty));
}

// ---------- Smelting (expects { inId, inQty, time, xp }) ----------
export function canSmelt(state, outId='bar_copper'){
  const r = SMELT_RECIPES[outId]; if(!r) return false;
  return (r.inputs||[]).every(inp => (state.inventory[inp.id]||0) >= inp.qty);
}

export function startSmelt(state, outId='bar_copper'){
  if(state.action) return false;
  const r = SMELT_RECIPES[outId]; if(!r) return false;
  const need = r.level || 1;
  const lvl = levelFromXp(state.smithXp||0, XP_TABLE);
  if (lvl < need) return false;
  if(!canSmelt(state, outId)) return false;
  const dur = clampMs((r.time||2000) / speedFromLevel(lvl));
  state.action = {
    type:'smith', mode:'smelt', key:outId,
    startedAt: performance.now(),
    endsAt: performance.now()+dur,
    duration: dur
  };
  return true;
}

export function finishSmelt(state){
  const key = state.action?.key;
  const r = SMELT_RECIPES[key]; if(!r) return;
  if(!(r.inputs||[]).every(inp => (state.inventory[inp.id]||0) >= inp.qty)) return;
  r.inputs.forEach(inp => removeItem(state, inp.id, inp.qty));
  addItem(state, key, 1);
  state.smithXp = (state.smithXp||0) + (r.xp||0);
}

// ---------- Forging (expects { id, bars, time, xp, extras? }) ----------
export function canForge(state, outId){
  const rec = FORGE_RECIPES.find(x=>x.id===outId); if(!rec) return false;
  const barsOk = (state.inventory['bar_copper']||0) >= (rec.bars||0);
  const extrasOk = hasExtras(state, rec);
  return barsOk && extrasOk;
}

export function startForge(state, outId){
  if(state.action) return false;
  const rec = FORGE_RECIPES.find(x=>x.id===outId); if(!rec) return false;
  const need = rec.level || 1;
  const lvl = levelFromXp(state.smithXp||0, XP_TABLE);
  if (lvl < need) return false;
  if(!canForge(state, outId)) return false;
  const dur = clampMs((rec.time||2000) / speedFromLevel(lvl));
  state.action = {
    type:'smith', mode:'forge', key:outId,
    startedAt: performance.now(),
    endsAt: performance.now()+dur,
    duration: dur
  };
  return true;
}

export function finishForge(state){
  const rec = FORGE_RECIPES.find(x => x.id === state.action?.key);
  if (!rec) return null;
  if (!canForge(state, rec.id)) return null;

  // spend inputs
  removeItem(state, 'bar_copper', rec.bars || 0);
  spendExtras(state, rec);

  // Only equipment should get quality; materials (like upgrade bars) should not
  const lvl = levelFromXp(state.smithXp || 0, XP_TABLE);
  const giveQuality = (rec.kind !== 'material') && (rec.quality !== false);
  const outId = giveQuality ? `${rec.id}@${rollQuality(lvl)}` : rec.id;

  addItem(state, outId, 1);
  const gain = rec.xp || 0;
  state.smithXp = (state.smithXp || 0) + gain;

  return { outId, q: giveQuality ? parseInt(outId.split('@')[1],10) : null, xp: gain };
}
