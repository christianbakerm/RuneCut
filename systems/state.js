// systems/state.js

// ---- Factory for a fresh state ----
export function defaultState(){
  return {
    gold: 0,

    // Skill XP
    wcXp: 0, fishXp: 0, minXp: 0,
    atkXp: 0, strXp: 0, defXp: 0,
    smithXp: 0, craftXp: 0, cookXp: 0,

    // Core data
    inventory: {},
    equipment: {
      axe:null, pick:null, weapon:null, shield:null,
      head:null, body:null, legs:null, gloves:null, boots:null,
      amulet:null, ring:null, cape:null
    },

    // UI/logging
    logs: [],
    logFilter: 'all',

    // Selections
    selectedTreeId: 'oak',
    selectedSpotId: 'pond_shallows',
    selectedRockId: 'copper_rock',
    trainingStyle: 'shared',

    // Runtime
    action: null,
    combat: null,
    hpCurrent: null
  };
}

// ---- Live singleton (import { state } from './state.js') ----
export const state = defaultState();

// ---- Persistence ----
export function saveState(s = state){
  try { localStorage.setItem('runecut-save', JSON.stringify(s)); } catch {}
}

export function loadState(){
  try{
    const raw = localStorage.getItem('runecut-save');
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

// Merge saved data into the live singleton without changing its identity.
// Call this once at boot (e.g., in ui/app.js) before first render.
export function hydrateState(){
  const loaded = loadState();
  if (!loaded) return state;

  const base = defaultState();

  // Shallow merge top-level
  Object.assign(state, base, loaded);

  // Deep-merge a few nested objects so new keys don’t get lost
  state.inventory = { ...base.inventory, ...(loaded.inventory || {}) };
  state.equipment = { ...base.equipment, ...(loaded.equipment || {}) };

  // Arrays / misc
  state.logs = Array.isArray(loaded.logs) ? loaded.logs : [];

  // Don’t resume half-finished timers after reload
  state.action = null;

  return state;
}
