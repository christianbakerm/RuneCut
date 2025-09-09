// systems/woodcutting.js
import { TREES } from '../data/trees.js';
import { addItem } from './inventory.js';
import { ITEMS } from '../data/items.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = (lvl)=> 1 + 0.03*(lvl-1); // +3% speed per Woodcutting level
const clampMs = (ms)=> Math.max(350, ms);        // hard floor so actions aren’t instant

export function startChop(state){
  if(state.action) return;
  const tree = TREES.find(t=>t.id===state.selectedTreeId);
  const wcLvl = levelFromXp(state.wcXp, XP_TABLE);
  const axeSpeed = (ITEMS[state.equipment.axe]?.speed) || 1;
  const dur = clampMs(tree.baseTime / (axeSpeed * speedFromLevel(wcLvl)));
  state.action = {
    type:'chop',
    startedAt: performance.now(),
    endsAt: performance.now()+dur,
    duration: dur,
    treeId: tree.id
  };
}

export function finishChop(state){
  const tree=TREES.find(t=>t.id===state.action.treeId);
  addItem(state, tree.drop, 1);
  state.wcXp += tree.xp;
}
