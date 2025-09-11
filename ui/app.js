// /ui/app.js
import { state, hydrateState, saveState, defaultState } from '../systems/state.js';
import { hpMaxFor } from '../systems/combat.js';
import { renderInventory } from './inventory.js';
import { renderSmithing } from './smithing.js';
import { renderCooking } from './cooking.js';
import { renderFishing } from './fishing.js';
import { renderMining } from './mining.js';
import { renderCrafting } from './crafting.js';
import { renderWoodcutting } from './woodcutting.js';
import { renderCombat } from './combat.js';
import { renderSkills } from './skills.js';
import { renderEquipment } from './equipment.js';
import { renderPanelLogs, wireLogFilters } from './logs.js';
import { setTab, wireRoutes } from './router.js';
import { updateBar, resetBar } from './actionbars.js';

import { qs } from '../utils/dom.js';

// ---- one-time hydrate + bootstrap ------------------------------------------
hydrateState();
if (state.hpCurrent == null) state.hpCurrent = hpMaxFor(state); // start full HP

// Cache progress bar/label els used by tick (keep IDs aligned with your HTML)
const el = {
  // woodcutting
  actionBar:   qs('#actionBar'),
  actionLabel: qs('#actionLabel'),

  // fishing
  fishBar:     qs('#fishBar'),
  fishLabel:   qs('#fishLabel'),

  // mining
  mineBar:     qs('#mineBar'),
  mineLabel:   qs('#mineLabel'),

  // smithing
  smithBar:    qs('#smithBar'),
  smithLabel:  qs('#smithLabel'),

  // crafting
  craftBar:    qs('#craftBar'),
  craftLabel:  qs('#craftLabel'),

  // cooking (optional progress HUD; your current cooking uses a hover mini-game)
  cookBar:     qs('#cookBar'),
  cookHint:    qs('#cookHint'),
};

function wireSaveReset(){
  const saveBtn  = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');

  saveBtn?.addEventListener('click', ()=>{
    try{
      saveState(state);
      // quick visual feedback
      const prev = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saved ✓';
      setTimeout(()=>{ saveBtn.disabled = false; saveBtn.textContent = prev; }, 800);
    }catch(err){
      console.error('Save error:', err);
    }
  });

  resetBtn?.addEventListener('click', ()=>{
    if(!confirm('Reset your progress? This cannot be undone.')) return;

    // clear persisted save
    try{ localStorage.removeItem('runecut-save'); }catch{}

    // reset state IN PLACE (keep reference stable)
    const fresh = defaultState();
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, fresh);

    // recompute derived values
    state.hpCurrent = hpMaxFor(state);

    // persist fresh state
    saveState(state);

    // re-render everything & go to first tab
    renderInventory();
    renderSmithing();
    renderCooking();
    renderFishing();
    renderMining();
    renderCrafting();
    renderWoodcutting();
    renderCombat();
    renderSkills();
    renderEquipment();
    renderPanelLogs();
    setTab('forests');
  });
}

// ---- initial renders (same panels main.js paints) ---------------------------
function initialPaint(){
  renderInventory();
  renderSmithing();
  renderCooking();
  renderFishing();
  renderMining();
  renderCrafting();
  renderWoodcutting();
  renderCombat();
  renderSkills();
  renderEquipment();
  renderPanelLogs();
}

// ---- single RAF loop: progress bars + passive HP regen ----------------------
let rafId = 0;
let last = performance.now();
let regenCarry = 0;

function verbFor(type){
  switch(type){
    case 'chop':  return 'Chopping';
    case 'fish':  return 'Fishing';
    case 'mine':  return 'Mining';
    case 'smith': return 'Smithing';
    case 'craft': return 'Crafting';
    case 'cook':  return 'Cooking';
    default:      return 'Working';
  }
}

function tick(){
  const now = performance.now();
  const dt  = (now - last) / 1000;
  last = now;

  const act = state.action;
  if (act && act.startedAt != null && act.duration != null){
    const frac = Math.max(0, Math.min(1, (now - act.startedAt) / act.duration));
    const v = verbFor(act.type);

    if (act.type === 'chop')   updateBar(el.actionBar, el.actionLabel, v, frac);
    if (act.type === 'fish')   updateBar(el.fishBar,    el.fishLabel,   v, frac);
    if (act.type === 'mine')   updateBar(el.mineBar,    el.mineLabel,   v, frac);
    if (act.type === 'smith')  updateBar(el.smithBar,   el.smithLabel,  v, frac);
    if (act.type === 'craft')  updateBar(el.craftBar,   el.craftLabel,  v, frac);
    if (act.type === 'cook')   updateBar(el.cookBar,    null,           v, frac);

  }else{
    resetBar(el.actionBar, el.actionLabel);
    resetBar(el.fishBar,   el.fishLabel);
    resetBar(el.mineBar,   el.mineLabel);
    resetBar(el.smithBar,  el.smithLabel);
    resetBar(el.craftBar,  el.craftLabel);
    resetBar(el.cookBar,   null);
  }

  // Passive HP regen when not in combat (same feel as main.js)
  if (!state.combat){
    const maxHp = hpMaxFor(state);
    if (state.hpCurrent < maxHp){
      regenCarry += dt;
      const rate = 0.5; // HP per second
      const whole = Math.floor(regenCarry * rate);
      if (whole > 0){
        state.hpCurrent = Math.min(maxHp, state.hpCurrent + whole);
        regenCarry -= whole / rate;
        // Only combat/character bits need repaint on regen
        renderCombat();
      }
    }
  }

  rafId = requestAnimationFrame(tick);
}

// ---- app start --------------------------------------------------------------
function startApp(){
  wireRoutes();
  wireLogFilters();
  wireSaveReset();
  initialPaint();
  setInterval(()=>saveState(state), 30_000);
  if (!rafId) rafId = requestAnimationFrame(tick);
  console.log('RuneCut booted');
}

startApp();
