
import { ITEMS } from '../data/items.js';

export function addItem(state, id, c) {
  state.inventory[id] = (state.inventory[id] || 0) + c;
}
export function removeItem(state, id, c) {
  const next = Math.max(0, (state.inventory[id] || 0) - c);
  if (next === 0) delete state.inventory[id];
  else state.inventory[id] = next;
}
export function addGold(state, n) {
  state.gold += n;
}