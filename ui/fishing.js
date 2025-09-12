// /ui/fishing.js
import { state, saveState } from '../systems/state.js';
import { listFishingSpots, isSpotUnlocked, canFish, startFish, finishFish } from '../systems/fishing.js';
import { qs, on } from '../utils/dom.js';
import { pushLog } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderEnchanting } from './enchanting.js';
import { renderSkills } from './skills.js';
import { ITEMS } from '../data/items.js';

const el = {
  spotSelect: qs('#spotSelect'),
  fishBtn:    qs('#fishBtn'),
  fishBar:    qs('#fishBar'),
  fishLabel:  qs('#fishLabel'),
};

function spots(){ return listFishingSpots(state) || []; }
function currentSpot(){
  const s = spots();
  return s.find(x => x.id === state.selectedSpotId) || s[0] || null;
}
function firstUnlocked(){
  const s = spots();
  return s.find(sp => isSpotUnlocked(state, sp)) || s[0] || null;
}

function updateBarLabel(){
  if (!el.fishBar || !el.fishLabel) return;
  if (state.action?.type === 'fish'){
    const now = performance.now();
    const pct = Math.max(0, Math.min(1, (now - state.action.startedAt) / (state.action.duration || 1)));
    el.fishBar.style.width = (pct*100).toFixed(2) + '%';
    el.fishLabel.textContent = `${state.action.label || 'Fishing'} — ${(pct*100).toFixed(0)}%`;
  } else {
    el.fishBar.style.width = '0%';
    el.fishLabel.textContent = 'Idle';
  }
}

export function renderFishing(){
  const list = spots();
  if (!list.length) return;

  // Keep selection sticky unless it's actually locked by level.
  let sel = currentSpot();
  if (!sel || !isSpotUnlocked(state, sel)){
    sel = firstUnlocked();
    if (sel && sel.id !== state.selectedSpotId){
      state.selectedSpotId = sel.id;
      saveState(state);
    }
  }
  const selId = sel?.id || '';

  // Build the dropdown (lock by level ONLY; being "busy" should not lock)
  if (el.spotSelect){
    el.spotSelect.innerHTML = list.map(sp=>{
      const unlocked = isSpotUnlocked(state, sp);
      const selAttr  = sp.id === selId ? 'selected' : '';
      const disAttr  = unlocked ? '' : 'disabled';
      const lvlStr   = sp.level ? ` (Lv ${sp.level})` : '';
      return `<option value="${sp.id}" ${selAttr} ${disAttr}>${sp.name || sp.id}${unlocked ? '' : lvlStr}</option>`;
    }).join('');
    el.spotSelect.value = selId;
  }

  // Enable/disable the button based on "can start now" (busy-safe)
  if (el.fishBtn) el.fishBtn.disabled = !canFish(state, selId);

  updateBarLabel();
}

/* -------- interactions -------- */

on(document, 'change', '#spotSelect', ()=>{
  const selEl = document.getElementById('spotSelect');
  if (!selEl) return;
  const id = selEl.value;
  const sp = spots().find(s=>s.id===id);
  if (!sp || !isSpotUnlocked(state, sp)){
    const fb = firstUnlocked();
    if (fb) { selEl.value = fb.id; state.selectedSpotId = fb.id; }
  } else {
    state.selectedSpotId = id;
  }
  saveState(state);
  renderFishing();
});

on(document, 'click', '#fishBtn', ()=>{
  const sp = currentSpot();
  if (!sp) return;
  if (!canFish(state, sp)) return;

  const ok = startFish(state, sp.id);
  if (!ok) return;

  // Finish exactly when the action ends (no reliance on any global tick)
  const dur = state.action?.duration || sp.baseTime || 2000;
  setTimeout(()=>{
    finishFish(state, sp.id);
    const itemName = ITEMS[sp.drop]?.name || sp.drop || 'fish';
    const xp = sp.xp || 0;
    pushLog(`Caught ${itemName} at ${sp.name || sp.id} → +${xp} Fishing xp`, 'fishing');
    saveState(state);
    renderFishing();
    renderEnchanting();
    renderInventory();
    renderSkills();
  }, Math.max(50, dur)); // tiny floor for safety

  renderFishing(); // show progress immediately
});

// Smooth bar
(function raf(){
  updateBarLabel();
  requestAnimationFrame(raf);
})();
