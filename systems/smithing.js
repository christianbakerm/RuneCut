// systems/smithing.js
import { SMELT_RECIPES, FORGE_RECIPES } from '../data/smithing.js';
import { addItem, removeItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = lvl => 1 + 0.02*(lvl-1);
const clampMs = (ms)=> Math.max(350, ms);

export function rollQuality(smithLvl){
  const base = 15 + 1.6*smithLvl;
  const spread = 35 + 0.7*smithLvl;
  const q = Math.floor(base + Math.random()*spread);
  return Math.max(1, Math.min(100, q));
}

// ---------- Smelting ----------
export function canSmelt(state, outId='bar_copper'){
  const r = SMELT_RECIPES[outId]; if(!r) return false;
  return (r.inputs||[]).every(inp => (state.inventory[inp.id]||0) >= inp.qty);
}
export function startSmelt(state, outId='bar_copper'){
  if(state.action) return false;
  const r = SMELT_RECIPES[outId]; if(!r) return false;
  const lvl = levelFromXp(state.smithXp||0, XP_TABLE);
  const dur = clampMs(r.time / speedFromLevel(lvl));
  state.action = { type:'smith', mode:'smelt', key:outId, startedAt:performance.now(), endsAt:performance.now()+dur, duration:dur };
  return true;
}
export function finishSmelt(state){
  const key = state.action?.key;
  const r = SMELT_RECIPES[key]; if(!r) return;
  if(!(r.inputs||[]).every(inp => (state.inventory[inp.id]||0) >= inp.qty)) return;
  r.inputs.forEach(inp => removeItem(state, inp.id, inp.qty));
  addItem(state, key, 1); // e.g., bar_copper
  state.smithXp = (state.smithXp||0) + (r.xp||0);
}

// ---------- Forging ----------
export function canForge(state, outId){
  const rec = FORGE_RECIPES.find(x=>x.id===outId); if(!rec) return false;
  return (state.inventory[rec.barId]||0) >= rec.bars;
}
export function startForge(state, outId){
  if(state.action) return false;
  const rec = FORGE_RECIPES.find(x=>x.id===outId); if(!rec) return false;
  const lvl = levelFromXp(state.smithXp||0, XP_TABLE);
  const dur = clampMs(rec.time / speedFromLevel(lvl));
  state.action = { type:'smith', mode:'forge', key:outId, startedAt:performance.now(), endsAt:performance.now()+dur, duration:dur };
  return true;
}
export function finishForge(state){
  const key = state.action?.key;
  const rec = FORGE_RECIPES.find(x=>x.id===key); if(!rec) return;
  if((state.inventory[rec.barId]||0) < rec.bars) return;

  removeItem(state, rec.barId, rec.bars);
  const lvl = levelFromXp(state.smithXp||0, XP_TABLE);
  const q = rollQuality(lvl);

  let outId = rec.id;
  if(rec.kind !== 'material') outId = `${rec.id}@${q}`; // no quality for materials

  addItem(state, outId, 1);
  state.smithXp = (state.smithXp||0) + (rec.xp||0);
  return { outId, q };
}
