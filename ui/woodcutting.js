// /ui/woodcutting.js
import { state, saveState } from '../systems/state.js';
import { qs, on } from '../utils/dom.js';
import { renderInventory } from './inventory.js';
import { renderCrafting } from './crafting.js'
import { pushLog } from './logs.js';
import { renderSkills } from './skills.js';
import { listTrees, canChop, startChop, finishChop } from '../systems/woodcutting.js';
import { ITEMS } from '../data/items.js';
import { renderEnchanting } from './enchanting.js';

const el = {
  treeList:   qs('#treeList') || qs('#forestList'),
  treeSelect: qs('#treeSelect') || qs('#wcTreeSelect'),
  chopBtn:    qs('#chopBtn') || qs('#wcChopBtn') || qs('.chop-btn'),
  actionLbl:  qs('#actionLabel') || qs('#wcActionLabel'),
};

function trees(){ return listTrees(state) || []; }

function firstAccessibleTree(){
  const list = trees();
  for (const t of list) if (canLevelOnly(state, t)) return t;
  return list[0] || null;
}

function currentTree(){
  const list = trees();
  return list.find(x => x.id === state.selectedTreeId) || list[0] || null;
}

// Ignore "busy" while rendering/validating selection
function canLevelOnly(t){
  return canChop({ ...state, action: null }, t);
}

export function renderWoodcutting(){
    const list = trees();
    if (!list.length) return;
  
    // Compute a *valid & enabled* selection up-front.
    const has = id => list.some(t => t.id === id);
    const can = t => canChop(state, t);
  
    let selId = state.selectedTreeId && has(state.selectedTreeId)
      ? state.selectedTreeId
      : null;
  
    let selTree = selId ? list.find(t => t.id === selId) : null;
  
    // If current selection is missing or *locked*, pick first accessible.
    if (!selTree || !canLevelOnly(selTree)) {
      selTree = list.find(canLevelOnly) || list[0];
      if (selTree && selTree.id !== state.selectedTreeId) {
        state.selectedTreeId = selTree.id;
        saveState(state);
      }
    }
    selId = selTree?.id;
  
    // --- Tiles ---
    if (el.treeList){
      el.treeList.innerHTML = list.map(t=>{
        const ok = canLevelOnly(t);
        const isSel = t.id === selId;
        return `
          <button class="tree ${ok?'':'disabled locked'} ${isSel?'active selected':''}"
                  data-id="${t.id}" ${ok?'':'disabled aria-disabled="true"'}
                  title="${ok ? '' : `Requires Lv ${t.level||1}`}">
            <span class="name">${t.name || t.id}</span>
            <small class="io">Lv ${t.level||1}${t.baseTime?` · ${Math.round(t.baseTime/1000)}s`:''}</small>
          </button>`;
      }).join('');
    }
  
    // --- Dropdown ---
    if (el.treeSelect){
      el.treeSelect.innerHTML = list.map(t=>{
        const ok = canLevelOnly(t);
        const selAttr = t.id === selId ? 'selected' : '';
        const disAttr = ok ? '' : 'disabled';
        return `<option value="${t.id}" ${selAttr} ${disAttr}>
          ${t.name || t.id} ${ok ? '' : `(Lv ${t.level||1})`}
        </option>`;
      }).join('');
  
      if (!el.treeSelect.value || el.treeSelect.options[el.treeSelect.selectedIndex]?.disabled) {
        el.treeSelect.value = selId;
      }
  
      el.treeSelect.disabled = false;
      el.treeSelect.style.pointerEvents = 'auto';
      void el.treeSelect.offsetWidth;
    }
  
    if (el.actionLbl && (!state.action || state.action.type !== 'chop')){
      el.actionLbl.textContent = 'Idle';
    }
  }  

/* ---------- interactions ---------- */

// Tile click (ignore locked)
on(document, 'click', '#treeList .tree, #forestList .tree', (e, btn)=>{
  if (btn.classList.contains('disabled') || btn.hasAttribute('disabled')) return;
  const id = btn.dataset.id;
  if (!id) return;
  state.selectedTreeId = id;
  saveState(state);
  renderWoodcutting();
});

// Dropdown change (supports #treeSelect or #wcTreeSelect)
on(document, 'change', '#treeSelect, #wcTreeSelect', ()=>{
  const sel = document.querySelector('#treeSelect, #wcTreeSelect');
  if (!sel) return;
  const id = sel.value;
  // If somehow a locked <option> gets selected, revert to a valid one
  const t = trees().find(x => x.id === id);
  if (!t || !canChop(state, t)){
    const fb = firstAccessibleTree();
    if (fb) sel.value = fb.id, state.selectedTreeId = fb.id;
  } else {
    state.selectedTreeId = id;
  }
  saveState(state);
  renderWoodcutting();
});

// Chop (robust: auto-fallback to an accessible tree)
on(document, 'click', '#chopBtn, #wcChopBtn, .chop-btn', ()=>{
  tryStartChop();
});

function tryStartChop(){
  // If we're already chopping, do nothing. Keep the current selection.
  if (state.action?.type === 'chop') {
    if (el.actionLbl) el.actionLbl.textContent = 'Chopping…';
    return;
  }

  const t = currentTree();
  if (!t) return;
  const ok = startChop(state, t, ()=>{
    const res = finishChop(state, t);
    const itemName = ITEMS[t.drop]?.name || t.drop;
    const xp = t.xp || 0;
    const essTxt = res?.essence ? ` · +1 ${ITEMS['forest_essence']?.name || 'Forest Essence'}` : '';
    pushLog(`Chopped ${t.name || t.id} → +1 ${itemName}${essTxt} · Forestry +${xp} xp`, 'wc');    saveState(state);
    renderWoodcutting();
    renderInventory();
    renderEnchanting();
    renderCrafting();
    renderSkills();
  });

  if (ok) renderWoodcutting();
}


