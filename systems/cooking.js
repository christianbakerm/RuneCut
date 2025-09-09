import { addItem, removeItem } from './inventory.js';

export const COOK_RECIPES = {
  raw_shrimps: { cooked:'cooked_shrimps', xp:8 },
  raw_trout:   { cooked:'cooked_trout',   xp:14 },
};

export function cookItems(state, rawId, qty){
  const rec = COOK_RECIPES[rawId];
  if(!rec) return 0;
  const have = state.inventory[rawId] || 0;
  const n = Math.min(have, qty);
  if(n<=0) return 0;

  removeItem(state, rawId, n);
  addItem(state, rec.cooked, n);
  state.cookXp += rec.xp * n;
  return n;
}
