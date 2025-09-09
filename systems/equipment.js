import { ITEMS } from '../data/items.js';
import { baseId } from './itemutil.js';


export function equipItem(state,id){
  const it = ITEMS[baseId(id)];
  const slot=it.slot;
  if(state.equipment[slot]){ state.inventory[state.equipment[slot]]=(state.inventory[state.equipment[slot]]||0)+1; }
  state.equipment[slot]=id;
  state.inventory[id]--; if(state.inventory[id]<=0) delete state.inventory[id];
}

export function unequipItem(state, slot){
  const id = state.equipment[slot];
  if(!id) return;
  state.inventory[id] = (state.inventory[id] || 0) + 1;
  state.equipment[slot] = null;
}