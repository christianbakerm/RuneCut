// /systems/woodcutting.js
import { TREES } from '../data/woodcutting.js';
import { ITEMS } from '../data/items.js';         
import { addItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = (lvl)=> 1 + 0.03*(lvl-1);  // +3% per Woodcutting level
const clampMs = (ms)=> Math.max(250, ms);         // floor so actions aren’t instant

/* ---------------- helpers ---------------- */
export function listTrees(_state){
  return TREES;
}

function resolveTree(state, treeOrId){
  if (!treeOrId) {
    return TREES.find(t => t.id === state.selectedTreeId) || TREES[0] || null;
  }
  if (typeof treeOrId === 'string') {
    return TREES.find(t => t.id === treeOrId) || null;
  }
  if (treeOrId && treeOrId.id) {
    return TREES.find(t => t.id === treeOrId.id) || treeOrId;
  }
  return null;
}

function requiredLevel(tree){
  return tree.level || 1;
}

function axeSpeedFromState(state){
  // If your axes have a .speed stat in ITEMS, this applies; otherwise defaults to 1
  const axeId = state.equipment?.axe;
  const def = axeId ? ITEMS[axeId] : null;
  return (def?.speed) || 1;
}

/* ---------------- ui-facing api ---------------- */
export function canChop(state, treeOrId){
  if (state.action) return false; // busy
  const t = resolveTree(state, treeOrId);
  if (!t) return false;

  const wcLvl = levelFromXp(state.wcXp || 0, XP_TABLE);
  if (wcLvl < requiredLevel(t)) return false;

  return true;
}

export function startChop(state, treeOrId, onDone){
  const t = resolveTree(state, treeOrId);
  if (!t || !canChop(state, t)) return false;

  const wcLvl    = levelFromXp(state.wcXp || 0, XP_TABLE);
  const axeSpeed = axeSpeedFromState(state);
  const baseTime = t.baseTime || 2000;
  const dur      = clampMs(baseTime / (axeSpeed * speedFromLevel(wcLvl)));
  const now      = performance.now();

  state.selectedTreeId = t.id;

  state.action = {
    type: 'chop',
    label: `Chop ${t.name || t.id}`,
    startedAt: now,
    endsAt: now + dur,
    duration: dur,
    treeId: t.id
  };

  // Timed completion
  setTimeout(()=>{
    if (state.action?.type === 'chop' && state.action?.treeId === t.id){
      onDone?.();
    }
  }, dur);

  return true;
}

export function finishChop(state, treeOrId){
  const t = resolveTree(state, treeOrId) || TREES.find(x => x.id === state.action?.treeId);
  if (!t){ state.action = null; return 0; }

  addItem(state, t.drop, 1);
  state.wcXp = (state.wcXp || 0) + (t.xp || 0);
  state.action = null;
  return 1;
}
