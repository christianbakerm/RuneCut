// /ui/crafting.js
import { state, saveState } from '../systems/state.js';
import { CRAFT_RECIPES } from '../data/crafting.js';
import { canCraft, startCraft, finishCraft } from '../systems/crafting.js';
import { renderSmithing } from './smithing.js';
import { qs, on } from '../utils/dom.js';
import { pushCraftLog } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderSkills } from './skills.js';
import { ITEMS } from '../data/items.js';
import { renderEnchanting } from './enchanting.js';

const el = {
  craftList:  qs('#craftList'),
  craftLabel: qs('#craftLabel'),
  craftBar:   qs('#craftBar'),
};

const PAGES_PREFIX = 'pages_from_';

/* ---------------- helpers ---------------- */
function prettyItemName(id){
  return ITEMS?.[id]?.name || String(id).replace(/_/g, ' ');
}
function reqStrFromInputs(inputs){
  return (inputs || [])
    .map(inp => `${inp.qty}× ${prettyItemName(inp.id)}`)
    .join(', ');
}
function asList(obj){ return Object.entries(obj||{}).map(([id, r]) => ({ id, ...r })); }

function pagesVariants(){
  return asList(CRAFT_RECIPES).filter(r => r.id.startsWith(PAGES_PREFIX));
}
function inputsOf(rec){ return Array.isArray(rec?.inputs) ? rec.inputs : []; }
function outputsOf(rec){ return Array.isArray(rec?.outputs) ? rec.outputs : []; }
function logIdOf(rec){ return inputsOf(rec)[0]?.id || null; }
function pagesYieldOf(rec){ return outputsOf(rec)[0]?.qty || 0; }
function defaultPagesVariant(){
  const vars = pagesVariants();
  if (!vars.length) return null;

  // prefer saved selection if still valid
  const saved = state.ui?.pagesVariantId && vars.find(v => v.id === state.ui.pagesVariantId);
  if (saved) return saved;

  // prefer best yield that the player owns
  const owned = vars
    .filter(v => (state.inventory[logIdOf(v)] || 0) > 0)
    .sort((a,b) => pagesYieldOf(b) - pagesYieldOf(a));
  if (owned[0]) return owned[0];

  // fallback to oak if present, else first
  const oak = vars.find(v => logIdOf(v) === 'log_oak');
  return oak || vars[0];
}
function pagesIoText(rec){
  const inp = inputsOf(rec)[0];
  const out = outputsOf(rec)[0];
  const logName = prettyItemName(inp.id);
  return `${inp.qty}× ${logName} → ${out.qty}× ${prettyItemName(out.id)}`;
}
function isBusyCraft(){ return !!(state.action && state.action.type === 'craft'); }
function activeCraftId(){ return isBusyCraft() ? state.action.key : null; }

/* ------------- grouped Pages row ------------- */
function renderPagesGroup(containerEl){
  const vars = pagesVariants();
  if (!vars.length) return;

  // Active variant (if currently crafting pages) or sensible default
  const activeId = activeCraftId();
  const activeVar = activeId && activeId.startsWith(PAGES_PREFIX)
    ? vars.find(v => v.id === activeId)
    : null;
  const baseVar = activeVar || defaultPagesVariant() || vars[0];

  // Build <option>s (disable ones you don't have)
  const optionsHtml = vars
    .slice()
    .sort((a,b) => pagesYieldOf(a) - pagesYieldOf(b))
    .map(v=>{
      const logId = logIdOf(v);
      const have  = state.inventory[logId] || 0;
      const dis   = have <= 0 ? 'disabled' : '';
      const sel   = v.id === baseVar.id ? 'selected' : '';
      return `<option value="${v.id}" ${sel} ${dis}>
        ${prettyItemName(logId)} ${have>0?`(x${have})`:''} — yields ${pagesYieldOf(v)}
      </option>`;
    }).join('');

  const lvl = baseVar.level || 1;
  const xpAmt = baseVar?.xp?.amount || 0;
  const busy = isBusyCraft();
  const active = !!activeVar;

  containerEl.insertAdjacentHTML('afterbegin', `
    <div class="craft-item pages-group ${busy && !active ? 'disabled':''} ${active ? 'active':''}" data-variant="${baseVar.id}">
      <div class="left">
        <div class="title">Pages</div>
        <div class="io" id="pagesIo">${pagesIoText(baseVar)}</div>
      </div>
      <div class="right" style="display:flex; gap:6px; align-items:center;">
        <span class="badge level">Lv ${lvl}</span>
        ${xpAmt ? `<span class="badge xp">+${xpAmt}xp</span>` : ''}
        <select id="pagesLogSelect">${optionsHtml}</select>
        <button class="btn-primary" id="pagesCraftBtn">Craft</button>
      </div>
    </div>
  `);

  // Initial enable/disable for the button
  const btn = containerEl.querySelector('#pagesCraftBtn');
  const can = !busy && canCraft(state, baseVar.id);
  if (btn) btn.disabled = !can;

  // If currently crafting a pages variant, keep label tidy
  if (active && el.craftLabel){
    el.craftLabel.textContent = CRAFT_RECIPES[activeVar.id]?.name || 'Pages';
  }
}

/* ---------------- render ---------------- */
export function renderCrafting(){
  const busy = isBusyCraft();
  const activeId = activeCraftId();

  // Label
  if (el.craftLabel){
    if (!busy) el.craftLabel.textContent = 'Idle';
    else       el.craftLabel.textContent = state.action.label || 'Crafting…';
  }

  // Progress
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

  // Render all recipes EXCEPT pages_from_* (we'll add a single grouped row)
  const list = asList(CRAFT_RECIPES)
    .filter(r => !r.id.startsWith(PAGES_PREFIX))
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

  // Inject single grouped "Pages" row at the top (if any variants exist)
  renderPagesGroup(el.craftList);
}

/* ---------------- interactions ---------------- */

// Default click → craft exactly one (for normal recipes)
on(document, 'click', '#craftList .craft-item', (e, btn) => {
  // Ignore the grouped pages row container (it uses its own button)
  if (btn.classList.contains('pages-group')) return;

  if (state.action) return; // busy
  const id = btn.dataset.id; if (!id) return;
  if (!canCraft(state, id)) return;

  const r = CRAFT_RECIPES[id] || {};
  const xpAmt = r?.xp?.amount || 0;
  const xpSkill = r?.xp?.skill || 'craft';

  const ok = startCraft(state, id, () => {
    const res = finishCraft(state, id);
    if (res){
      const name = res.name || res.id || id;
      pushCraftLog(`Crafted ${name} → +${xpAmt} ${xpSkill} xp`);
      renderInventory();
      renderSmithing();
      renderEnchanting(); // ← ensure enchanting panel refreshes on ANY craft completion
      renderSkills();
    }
    saveState(state);
    renderCrafting();      // reset label/progress & re-enable list
  });

  if (ok){
    if (el.craftLabel) el.craftLabel.textContent = (CRAFT_RECIPES[id]?.name || id);
    renderCrafting();
  }
});

// Pages selector changed
on(document, 'change', '#pagesLogSelect', (e, sel)=>{
  const container = sel.closest('.pages-group');
  if (!container) return;
  const rid = sel.value;
  container.dataset.variant = rid;

  // Persist preferred variant
  state.ui = state.ui || {};
  state.ui.pagesVariantId = rid;
  saveState(state);

  // Update IO line & badges
  const rec = CRAFT_RECIPES[rid];
  const io  = container.querySelector('#pagesIo');
  if (rec && io) io.textContent = pagesIoText(rec);

  const lvl = rec?.level || 1;
  const xp  = rec?.xp?.amount || 0;
  const right = container.querySelector('.right');
  if (right){
    const lvlEl = right.querySelector('.badge.level');
    const xpEl  = right.querySelector('.badge.xp');
    if (lvlEl) lvlEl.textContent = `Lv ${lvl}`;
    if (xpEl)  xpEl.textContent  = `+${xp}xp`;
  }

  // Enable/disable Craft button based on inventory and busy state
  const btn = container.querySelector('#pagesCraftBtn');
  if (btn){
    const busy = isBusyCraft();
    btn.disabled = busy || !canCraft(state, rid);
  }
});

// Pages craft button
on(document, 'click', '#pagesCraftBtn', (e, btn)=>{
  if (state.action) return; // busy

  const container = btn.closest('.pages-group');
  const rid = container?.dataset?.variant;
  if (!rid) return;
  if (!canCraft(state, rid)) return;

  const r = CRAFT_RECIPES[rid] || {};
  const xpAmt   = r?.xp?.amount || 0;
  const xpSkill = r?.xp?.skill || 'craft';

  const ok = startCraft(state, rid, ()=>{
    const res = finishCraft(state, rid);
    if (res){
      const name = res.name || 'Pages';
      pushCraftLog(`Crafted ${name} → +${xpAmt} ${xpSkill} xp`);
      renderInventory();
      renderSmithing();
      renderEnchanting();
      renderSkills();
    }
    saveState(state);
    renderCrafting();
  });

  if (ok){
    if (el.craftLabel) el.craftLabel.textContent = (r?.name || 'Pages');
    renderCrafting();
    renderEnchanting();
  }
});
