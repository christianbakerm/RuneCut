// /systems/mana.js
export const MANA_BASE_MAX = 10;

let _manaTimer = null; // ensure no multiple timers

export function manaMaxFor(state){
  // Base 10 + bonus
  const bonus = state.manaBonus || 0;
  return MANA_BASE_MAX + Math.max(0, bonus);
}

export function ensureMana(state){
  const max = manaMaxFor(state);
  if (state.manaCurrent == null) state.manaCurrent = max;
  state.manaCurrent = Math.max(0, Math.min(max, state.manaCurrent));
  return state.manaCurrent;
}

export function addMana(state, n=0){
  ensureMana(state);
  const max = manaMaxFor(state);
  const before = state.manaCurrent;
  state.manaCurrent = Math.min(max, before + Math.max(0, n|0));
  return state.manaCurrent - before;
}

export function spendMana(state, n=0){
  ensureMana(state);
  const need = Math.max(0, n|0);
  if ((state.manaCurrent||0) < need) return false;
  state.manaCurrent -= need;
  return true;
}

/**
 * Starts passive mana regen: +1 every 5 seconds, up to max.
 * onTick is optional; if provided, it’s called whenever mana increases.
 */
export function startManaRegen(state, onTick){
  if (_manaTimer) return _manaTimer; // already running

  let secs = 0;
  _manaTimer = setInterval(()=>{
    secs += 1;
    if (secs >= 5){
      secs = 0;
      const max = manaMaxFor(state);
      ensureMana(state);
      if (state.manaCurrent < max){
        state.manaCurrent += 1;
        onTick?.(state);
      }
    }
  }, 1000);

  return _manaTimer;
}
