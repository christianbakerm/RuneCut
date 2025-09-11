// /ui/mining.js
import { state, saveState } from '../systems/state.js';
import { renderSmithing } from './smithing.js';
import { listRocks, canMine, startMine, finishMine } from '../systems/mining.js';
import { qs, on } from '../utils/dom.js';
import { pushLog } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderSkills } from './skills.js';
import { ITEMS } from '../data/items.js';

const el = {
  rockSelect: qs('#rockSelect'),
  mineBtn:    qs('#mineBtn'),
  mineLabel:  qs('#mineLabel'),
};

function rocks(){ return listRocks(state) || []; }

// Ignore "busy" (state.action) when deciding what's selectable/renderable
function canLevelOnly(r){
  return canMine({ ...state, action: null }, r);
}

function firstAccessibleRock(){
  return rocks().find(r => canLevelOnly(r)) || rocks()[0] || null;
}
function currentRock(){
  const list = rocks();
  return list.find(r => r.id === state.selectedRockId) || list[0] || null;
}

export function renderMining(){
  const list = rocks();
  if (!list.length) return;

  // Use current selection unless truly locked by level (not just busy)
  let sel = currentRock();
  if (!sel || !canLevelOnly(sel)){
    const fb = firstAccessibleRock();
    if (fb && fb.id !== state.selectedRockId){
      state.selectedRockId = fb.id;
      saveState(state);
    }
    sel = fb || list[0] || null;
  }

  if (el.rockSelect){
    el.rockSelect.innerHTML = list.map(r=>{
      const ok = canLevelOnly(r);
      const selAttr = (sel && r.id===sel.id) ? 'selected' : '';
      const disAttr = ok ? '' : 'disabled';
      return `<option value="${r.id}" ${selAttr} ${disAttr}>
        ${r.name || r.id} ${ok ? '' : `(Lv ${r.level||1})`}
      </option>`;
    }).join('');

    // keep user's selection; don't force fallback just because we're busy
    if (!el.rockSelect.value || el.rockSelect.options[el.rockSelect.selectedIndex]?.disabled){
      el.rockSelect.value = sel?.id || list[0].id;
    }
    el.rockSelect.disabled = false;
    el.rockSelect.style.pointerEvents = 'auto';
  }

  if (el.mineLabel && (!state.action || state.action.type!=='mine')){
    el.mineLabel.textContent = 'Idle';
  }
}

// Selection change
on(document, 'change', '#rockSelect', ()=>{
  const selEl = document.getElementById('rockSelect');
  if (!selEl) return;
  const id = selEl.value;
  const r = rocks().find(x=>x.id===id);

  // Only force fallback if actually level-locked, not just busy
  if (!r || !canLevelOnly(r)){
    const fb = firstAccessibleRock();
    if (fb) {
      state.selectedRockId = fb.id;
      selEl.value = fb.id;
    }
  } else {
    state.selectedRockId = id;
  }
  saveState(state);
  renderMining();
});

// Mine click
on(document, 'click', '#mineBtn', ()=>{
  let r = currentRock();
  if (!r) return;

  // If somehow selected is level-locked, fall back once
  if (!canLevelOnly(r)){
    const fb = firstAccessibleRock();
    if (!fb) return;
    state.selectedRockId = fb.id;
    r = fb;
    saveState(state);
    renderMining();
  }

  // Busy? do nothing
  if (state.action) return;

  // Use the real canMine (which includes busy and mats checks) just before starting
  if (!canMine(state, r)) return;

  const ok = startMine(state, r, ()=>{
    finishMine(state, r);
    const itemName = ITEMS[r.drop]?.name || r.drop;
    const xp = r.xp || 0;
    pushLog(`Mined ${r.name || r.id} → +1 ${itemName} · Mining +${xp} xp`, 'mining');
    renderInventory();
    renderSkills();
    saveState(state);
    renderMining();
    renderSmithing(); // keep smithing counts fresh
  });

  if (ok) renderMining();
});
