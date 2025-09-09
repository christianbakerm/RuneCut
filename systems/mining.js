// systems/mining.js
import { ROCKS } from '../data/mining.js';
import { addItem } from './inventory.js';
import { ITEMS } from '../data/items.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = (lvl)=> 1 + 0.03*(lvl-1); // +3% per Mining level
const clampMs = (ms)=> Math.max(350, ms);

export function startMine(state){
  if(state.action) return;
  const rock = ROCKS.find(r=>r.id===state.selectedRockId);
  const minLvl = levelFromXp(state.minXp, XP_TABLE);
  const pickSpeed = (ITEMS[state.equipment.pick]?.speed) || 1;
  const dur = clampMs(rock.baseTime / (pickSpeed * speedFromLevel(minLvl)));
  state.action = {
    type:'mine',
    startedAt: performance.now(),
    endsAt: performance.now() + dur,
    duration: dur,
    rockId: rock.id
  };
}

export function finishMine(state){
  const rock = ROCKS.find(r=>r.id===state.action.rockId);
  addItem(state, rock.drop, 1);
  state.minXp += rock.xp;
}
