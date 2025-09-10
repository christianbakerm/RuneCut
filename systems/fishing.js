// /systems/fishing.js
import { FISHING_SPOTS } from '../data/fishing.js';
import { addItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';

const XP_TABLE = buildXpTable();
const speedFromLevel = (lvl)=> 1 + 0.03*(lvl-1); // +3% per Fishing level
const clampMs = (ms)=> Math.max(350, ms);

/* ---------- helpers ---------- */
export function listFishingSpots(state){
  return FISHING_SPOTS;
}

function resolveSpot(state, spotOrId){
  if (!spotOrId) {
    return FISHING_SPOTS.find(s=>s.id===state.selectedSpotId) || FISHING_SPOTS[0];
  }
  if (typeof spotOrId === 'string') {
    return FISHING_SPOTS.find(s=>s.id===spotOrId) || null;
  }
  if (spotOrId && spotOrId.id) {
    return FISHING_SPOTS.find(s=>s.id===spotOrId.id) || spotOrId;
  }
  return null;
}

function requiredLevel(spot){
  return spot.level || 1;
}

/** Level-only check */
export function isSpotUnlocked(state, spotOrId){
  const spot = resolveSpot(state, spotOrId);
  if (!spot) return false;
  const lvl = levelFromXp(state.fishXp || 0, XP_TABLE);
  return lvl >= requiredLevel(spot);
}

/* ---------- ui-facing api ---------- */
export function canFish(state, spotOrId){
  if (state.action) return false;             // busy -> cannot start
  const spot = resolveSpot(state, spotOrId);
  if (!spot) return false;
  return isSpotUnlocked(state, spot);
}

export function startFish(state, spotOrId){
  const spot = resolveSpot(state, spotOrId);
  if (!spot || !canFish(state, spot)) return false;

  const fishLvl = levelFromXp(state.fishXp || 0, XP_TABLE);
  const dur = clampMs((spot.baseTime || 2000) / speedFromLevel(fishLvl));
  const now = performance.now();

  state.selectedSpotId = spot.id;

  state.action = {
    type: 'fish',
    label: `Fish ${spot.name || spot.id}`,
    startedAt: now,
    endsAt: now + dur,
    duration: dur,
    spotId: spot.id
  };

  return true;
}

export function finishFish(state, spotOrId){
  const spot = resolveSpot(state, spotOrId) || FISHING_SPOTS.find(s=>s.id===state.action?.spotId);
  if (!spot){ state.action = null; return 0; }

  addItem(state, spot.drop, 1);
  state.fishXp = (state.fishXp || 0) + (spot.xp || 0);
  state.action = null;
  return 1;
}
