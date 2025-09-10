// systems/crafting.js
import { CRAFT_RECIPES } from '../data/crafting.js';
import { addItem, removeItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP = buildXpTable();

function levelOf(state, skill){
  if(skill==='wc')    return levelFromXp(state.wcXp||0, XP);
  if(skill==='fish')  return levelFromXp(state.fishXp||0, XP);
  if(skill==='min')   return levelFromXp(state.minXp||0, XP);
  if(skill==='smith') return levelFromXp(state.smithXp||0, XP);
  if(skill==='craft') return levelFromXp(state.craftXp||0, XP);
  return 1;
}
function speedMult(state, recipe){
  if(!recipe.speedSkill) return 1;
  const lvl = levelOf(state, recipe.speedSkill);
  return 1 + 0.03*(lvl-1); // +3%/level
}

export function canCraft(state, id, times=1){
  const r = CRAFT_RECIPES[id]; if(!r) return false;
  return (r.inputs||[]).every(inp => (state.inventory[inp.id]||0) >= inp.qty*times);
}

export function maxCraftable(state, id){
  const r = CRAFT_RECIPES[id]; if(!r || !r.inputs?.length) return 0;
  return Math.min(...r.inputs.map(inp => Math.floor((state.inventory[inp.id]||0)/inp.qty)));
}

export function startCraft(state, id, count=1){
  if(state.action) return false;
  const r = CRAFT_RECIPES[id]; if(!r) return false;
  if(!canCraft(state, id, 1)) return false;
  const dur = Math.max(300, r.time / speedMult(state, r));
  state.action = {
    type:'craft', key:id,
    startedAt: performance.now(),
    endsAt: performance.now()+dur,
    duration: dur,
    queue: Math.max(1, count)
  };
  return true;
}

export function finishOneCraft(state){
  const key = state.action?.key; if(!key) return null;
  const r = CRAFT_RECIPES[key]; if(!r) return null;
  if(!canCraft(state, key, 1)) return null;

  (r.inputs||[]).forEach(inp => removeItem(state, inp.id, inp.qty));
  (r.outputs||[]).forEach(out => addItem(state, out.id, out.qty));

  // award XP to the correct skill
  if(r.xp?.skill && r.xp?.amount){
    if(r.xp.skill==='craft') state.craftXp = (state.craftXp||0) + r.xp.amount;
    else if(r.xp.skill==='wc')    state.wcXp    = (state.wcXp||0)    + r.xp.amount;
    else if(r.xp.skill==='fish')  state.fishXp  = (state.fishXp||0)  + r.xp.amount;
    else if(r.xp.skill==='min')   state.minXp   = (state.minXp||0)   + r.xp.amount;
    else if(r.xp.skill==='smith') state.smithXp = (state.smithXp||0) + r.xp.amount;
  }

  return { id:key, name:r.name };
}
