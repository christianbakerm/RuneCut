// /ui/crafting.js
import { state, saveState } from '../systems/state.js';
import { CRAFT_RECIPES } from '../data/crafting.js';
import { canCraft, startCraft, finishCraft } from '../systems/crafting.js';
import { qs, on } from '../utils/dom.js';
import { pushCraftLog } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderSkills } from './skills.js';

const el = {
  craftList:  qs('#craftList'),
  craftLabel: qs('#craftLabel'),
  craftBar:   qs('#craftBar'),
};

function reqStrFromInputs(inputs){
  return (inputs || []).map(inp => `${inp.qty}× ${inp.id}`).join(', ');
}
function asList(obj){ return Object.entries(obj||{}).map(([id, r]) => ({ id, ...r })); }

export function renderCrafting(){
  const busy = !!(state.action && state.action.type === 'craft');
  const activeId = busy ? state.action.key : null;

  // Label
  if (el.craftLabel){
    if (!busy) el.craftLabel.textContent = 'Idle';
    else       el.craftLabel.textContent = state.action.label || 'Crafting…';
  }

  // Progress (in case your main loop hasn't ticked yet)
  if (el.craftBar){
    if (!busy){
      el.craftBar.style.width = '0%';
    } else {
      const now = performance.now();
      const pct = Math.max(0, Math.min(1, (now - state.action.startedAt) / (state.action.duration||1)));
      el.craftBar.style.width = (pct*100).toFixed(2) + '%';
    }
  }

  if (!el.craftList) return;

  const list = asList(CRAFT_RECIPES)
    .sort((a,b) => (a.level||1)-(b.level||1) || String(a.name||a.id).localeCompare(String(b.name||b.id)));

  el.craftList.innerHTML = list.map(r => {
    const ok  = canCraft(state, r.id);
    const dis = busy || !ok;
    const io  = reqStrFromInputs(r.inputs);
    const isActive = r.id === activeId;
    const xpAmt = r?.xp?.amount || 0;
    const lvl   = r.level || 1;
    return `
      <button class="craft-item ${dis ? 'disabled' : ''} ${isActive ? 'active' : ''}"
              data-id="${r.id}" ${dis?'disabled':''}>
        <div class="left">
          <div class="title">${r.name || r.id}</div>
          <div class="io">${io || '&nbsp;'}</div>
        </div>
        <div class="right">
          <span class="badge level">Lv ${lvl}</span>
          ${xpAmt ? `<span class="badge xp">+${xpAmt}xp</span>` : ''}
        </div>
      </button>
    `;
  }).join('');
}

// Click → craft exactly one
on(document, 'click', '#craftList .craft-item', (e, btn) => {
  if (state.action) return; // busy
  const id = btn.dataset.id; if (!id) return;
  if (!canCraft(state, id)) return;

  const r = CRAFT_RECIPES[id] || {};
  const xpAmt = r?.xp?.amount || 0;
  const xpSkill = r?.xp?.skill || 'craft';

  const ok = startCraft(state, id, () => {
    const res = finishCraft(state, id);
    if (res){
      // ✅ log with XP gained
      const name = res.name || res.id || id;
      pushCraftLog(`Crafted ${name} → +${xpAmt} ${xpSkill} xp`);
      renderInventory();   // show new items immediately
      renderSkills();      // reflect crafting xp
    }
    saveState(state);
    renderCrafting();      // reset label/progress & re-enable list
  });

  if (ok){
    // Show a clean, short label right away
    if (el.craftLabel) el.craftLabel.textContent = (CRAFT_RECIPES[id]?.name || id);
    renderCrafting();
  }
});
