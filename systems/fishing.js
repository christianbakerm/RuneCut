// systems/fishing.js
import { FISHING_SPOTS } from '../data/fishing.js';
import { addItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = (lvl)=> 1 + 0.03*(lvl-1); // +3% per Fishing level
const clampMs = (ms)=> Math.max(350, ms);

export function startFish(state){
  if(state.action) return;
  const spot = FISHING_SPOTS.find(s=>s.id===state.selectedSpotId);
  const fishLvl = levelFromXp(state.fishXp, XP_TABLE);
  const dur = clampMs(spot.baseTime / speedFromLevel(fishLvl));
  state.action = {
    type:'fish',
    startedAt: performance.now(),
    endsAt: performance.now() + dur,
    duration: dur,
    spotId: spot.id
  };
}

export function finishFish(state){
  const spot = FISHING_SPOTS.find(s=>s.id===state.action.spotId);
  addItem(state, spot.drop, 1);
  state.fishXp += spot.xp;
}
