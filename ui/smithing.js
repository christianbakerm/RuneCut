// /ui/smithing.js
import { state, saveState } from '../systems/state.js';
import { qs, on } from '../utils/dom.js';
import { FORGE_RECIPES, SMELT_RECIPES } from '../data/smithing.js';
import {
  canSmelt, startSmelt, finishSmelt, maxSmeltable,
  canForge, startForge, finishForge,
  listUpgradable, applyUpgrade, upgradeBarIdForMetal
} from '../systems/smithing.js';
import { pushSmithLog } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderSkills } from './skills.js';
import { renderEquipment } from './equipment.js';
import { renderEnchanting } from './enchanting.js';
import { ITEMS } from '../data/items.js';

const el = {
  // counts
  oreCopperCount:  qs('#oreCopperCount'),
  oreTinCount:     qs('#oreTinCount'),
  oreIronCount:    qs('#oreIronCount'),
  copperBarCount:  qs('#copperBarCount'),
  bronzeBarCount:  qs('#bronzeBarCount'),
  ironBarCount:    qs('#ironBarCount'),
  upgradeBarCount: qs('#upgradeBarCount'),

  // progress label
  smithLabel: qs('#smithLabel'),

  // smelting UI
  smeltSelect: qs('#smeltSelect'),
  smeltOneBtn: qs('#smeltOneBtn'),
  smeltAllBtn: qs('#smeltAllBtn'),

  // forging
  forgeList:   qs('#forgeList'),
  forgeMetal:  qs('#forgeMetal'),

  // upgrade UI
  upgradeFilter:   qs('#upgradeFilter'),
  upgradeTarget:   qs('#upgradeTarget'),
  applyUpgradeBtn: qs('#applyUpgradeBtn'),
};

// ---------- helpers ----------
function prettyName(idOrBase){
  const base = String(idOrBase).split('@')[0];
  return ITEMS?.[base]?.name || base.replace(/_/g,' ');
}
function qStr(q){ return q!=null ? `qty: ${q}%` : ''; }

function metalOfRecipe(rec){
  if (rec?.metal) return rec.metal;                             // preferred
  const m = String(rec?.id||'').split('_')[0];                  // infer from id
  return ['copper','bronze','iron'].includes(m) ? m : 'copper';
}
function barForRecipe(rec){
  return rec?.barId || (rec?.metal ? `bar_${rec.metal}` : 'bar_copper');
}

function updateCounts(){
  el.oreCopperCount && (el.oreCopperCount.textContent = state.inventory['ore_copper'] || 0);
  el.oreTinCount    && (el.oreTinCount.textContent    = state.inventory['ore_tin']    || 0);
  el.oreIronCount   && (el.oreIronCount.textContent   = state.inventory['ore_iron']   || 0);
  el.copperBarCount && (el.copperBarCount.textContent = state.inventory['bar_copper'] || 0);
  el.bronzeBarCount && (el.bronzeBarCount.textContent = state.inventory['bar_bronze'] || 0);
  el.ironBarCount   && (el.ironBarCount.textContent   = state.inventory['bar_iron']   || 0);
  function countUpgradeBarsForUI(){
    const sel = el.upgradeFilter?.value || 'all';
    if (sel === 'all'){
      const ids = ['copper_upgrade_bar','bronze_upgrade_bar','iron_upgrade_bar'];
      return ids.reduce((n,id)=> n + (state.inventory[id]||0), 0);
    }
    const barId = upgradeBarIdForMetal(sel);
    return state.inventory[barId] || 0;
  }
  el.upgradeBarCount && (el.upgradeBarCount.textContent = countUpgradeBarsForUI());
}

function reqStrForge(rec){
  const parts = [];
  const barId = barForRecipe(rec);
  const barNm = prettyName(barId);
  if (rec.bars) parts.push(`${rec.bars}× ${barNm}`);
  (rec.extras || []).forEach(ex => parts.push(`${ex.qty}× ${prettyName(ex.id)}`));
  return parts.join(', ');
}

function isForging(){
  return state.action?.type === 'smith' && state.action?.mode === 'forge';
}
function activeForgeId(){
  return isForging() ? state.action.key : null;
}
function progressPct(){
  if (!isForging()) return 0;
  const now = performance.now();
  const { startedAt, duration } = state.action;
  const p = (now - (startedAt||now)) / Math.max(1, (duration||1));
  return Math.max(0, Math.min(1, p));
}

// ---------- renderers ----------
function ensureSmeltDropdown(){
  if (!el.smeltSelect) return;

  const bars = Object.keys(SMELT_RECIPES || {});
  const order = ['bar_copper','bar_bronze','bar_iron'];
  bars.sort((a,b)=> (order.indexOf(a)+999) - (order.indexOf(b)+999) || a.localeCompare(b));

  const prev = el.smeltSelect.value;
  el.smeltSelect.innerHTML = bars.map(id => {
    const name = prettyName(id);
    const req  = reqStrSmelt(id);
    const label = req ? `${name} — ${req}` : name;
    return `<option value="${id}" ${id===prev ? 'selected':''}>${label}</option>`;
  }).join('');

  if (!bars.includes(prev) && bars.length){
    el.smeltSelect.value = bars[0];
  }
}


let RAF = null;
function stopForgeLoop(){
  if (RAF) cancelAnimationFrame(RAF);
  RAF = null;
}
function startForgeLoop(){
  if (RAF) return;
  const tick = ()=>{
    RAF = null;
    if (!isForging()) return;

    // update progress width on the active button
    const id = activeForgeId();
    const bar = el.forgeList?.querySelector(`[data-id="${id}"] .forge-progress .bar`);
    if (bar) {
      bar.style.width = `${Math.round(progressPct()*100)}%`;
    }

    // optional: label text
    if (el.smithLabel){
      const r = FORGE_RECIPES.find(x=>x.id===id);
      const pctTxt = `${Math.round(progressPct()*100)}%`;
      el.smithLabel.textContent = `Forging ${r?.name || prettyName(id)}… ${pctTxt}`;
    }

    RAF = requestAnimationFrame(tick);
  };
  RAF = requestAnimationFrame(tick);
}

function reqStrSmelt(outId){
  const r = SMELT_RECIPES?.[outId];
  if (!r) return '';
  const parts = (r.inputs || []).map(inp => `${inp.qty}× ${prettyName(inp.id)}`);
  return parts.join(' + ');
}


function renderForgeList(){
  if (!el.forgeList) return;
  const want = el.forgeMetal?.value || 'copper';

  const list = (FORGE_RECIPES || [])
    .filter(r => metalOfRecipe(r) === want)
    .slice()
    .sort((a,b) => (a.level||1)-(b.level||1) || String(a.name||a.id).localeCompare(String(b.name||b.id)));

  const busy = isForging();
  const activeId = activeForgeId();
  const nowPct = progressPct();

  el.forgeList.innerHTML = list.map(r=>{
    const ok   = canForge(state, r.id) && !busy;   // lock everything while forging
    const need = r.level || 1;
    const isActive = busy && r.id === activeId;
    const pct = isActive ? Math.round(nowPct*100) : 0;

    const icon = iconHtmlForRecipe(r);

    return `
      <button class="forge-item ${ok ? '' : 'disabled'} ${isActive ? 'busy':''}"
              data-id="${r.id}"
              ${ok ? '' : 'disabled aria-disabled="true"'}
              title="${ok ? '' : (isActive ? 'Forging…' : 'Missing level/materials or busy')}">
        <div class="forge-head">
          ${icon}
          <div class="forge-titles">
            <span class="forge-name">${r.name || prettyName(r.id)}</span>
            <span class="forge-sub">Lv ${need}</span>
          </div>
          <span class="forge-lvl">Lv ${need}</span>
        </div>
        <div class="forge-body">
          <div class="forge-costs">
            <span class="cost">${reqStrForge(r)}</span>
          </div>
          ${isActive ? `
            <div class="progress xs forge-progress" aria-hidden="true">
              <div class="bar" style="width:${pct}%;"></div>
            </div>` : ``}
        </div>
      </button>
    `;
  }).join('');

  if (busy) startForgeLoop(); else stopForgeLoop();
}


function renderUpgradeDropdown(){
  if (!el.upgradeTarget) return;
  const metal = el.upgradeFilter?.value || 'all';

  const list = listUpgradable(state, ITEMS).filter(x=>{
    if (metal === 'all') return true;
    return x.base.startsWith(`${metal}_`);
  });

  if (!list.length){
    el.upgradeTarget.innerHTML = `<option disabled selected>Nothing upgradable</option>`;
    if (el.applyUpgradeBtn) el.applyUpgradeBtn.disabled = true;
    return;
  }

  el.upgradeTarget.innerHTML = list.map(x=>{
    const loc = x.where === 'equip' ? `Equipped` : `Inventory`;
    const extra = x.where === 'equip' ? ` (${x.slot})` : '';
    return `<option value="${x.token}">${x.name} · ${qStr(x.q)} — ${loc}${extra}</option>`;
  }).join('');

  if (el.applyUpgradeBtn) el.applyUpgradeBtn.disabled = false;
}

export function renderSmithing(){
  updateCounts();

  // Only show Idle when *not* smithing (you already do this)
  if (el.smithLabel && (!state.action || state.action.type!=='smith')) {
    el.smithLabel.textContent = 'Idle';
  }

  ensureSmeltDropdown();
  renderForgeList();
  renderUpgradeDropdown();
}

// ---------- interactions ----------

// Smelt 1 / All read the CURRENT selection value
on(document, 'click', '#smeltOneBtn', ()=>{
  const outId = el.smeltSelect?.value || 'bar_copper';
  if (!canSmelt(state, outId)) return;

  const ok = startSmelt(state, outId, ()=>{
    const res = finishSmelt(state);
    const xp = (SMELT_RECIPES?.[outId]?.xp) || 0;
    pushSmithLog(`Smelted ${prettyName(outId)} → +${xp} Smithing xp`);
    saveState(state);
    updateCounts();
    renderSmithing();
    renderInventory();
    renderSkills();
  });
  if (ok) renderSmithing();
});

on(document, 'click', '#smeltAllBtn', ()=>{
  const outId = el.smeltSelect?.value || 'bar_copper';
  const N = maxSmeltable(state, outId);
  if (N <= 0) return;
  let left = N;

  const step = ()=>{
    if (left <= 0) return;
    if (!canSmelt(state, outId)) return;

    const ok = startSmelt(state, outId, ()=>{
      const res = finishSmelt(state);
      const xp = (SMELT_RECIPES?.[outId]?.xp) || 0;
      pushSmithLog(`Smelted ${prettyName(outId)} → +${xp} Smithing xp`);
      saveState(state);
      updateCounts();
      renderSmithing();
      renderEnchanting();
      renderInventory();
      renderSkills();
      left -= 1;
      step();
    });
    if (ok) renderSmithing();
  };
  step();
});

// Changing the smelt dropdown
on(document, 'change', '#smeltSelect', ()=>{
  renderSmithing();
});

// Forge metal filter
on(document, 'change', '#forgeMetal', ()=>{
  renderForgeList();
});

// Upgrade metal filter
on(document, 'change', '#upgradeFilter', ()=>{
  renderUpgradeDropdown();
});

// Click a forge recipe (now shows progress on the button and locks others)
on(document, 'click', '#forgeList .forge-item', (e, btn)=>{
  const id = btn.dataset.id;
  // hard guard: disabled/locked or busy
  if (!id || btn.hasAttribute('disabled') || btn.classList.contains('disabled') || isForging()) return;
  if (!canForge(state, id)) return;

  const ok = startForge(state, id, ()=>{
    const res = finishForge(state); // { outId, q, xp }
    if (res){
      const base = String(res.outId).split('@')[0];
      const name = prettyName(base);
      const q = res.q!=null ? ` · ${qStr(res.q)}` : '';
      pushSmithLog(`Forged ${name}${q} → +${res.xp} Smithing xp`);
    }
    saveState(state);
    updateCounts();
    renderSmithing();      // stops loop if finished
    renderInventory();
    renderEquipment();
    renderSkills();
  });

  if (ok){
    // Immediately re-render to lock buttons and show initial bar, then animate
    renderSmithing();
    startForgeLoop();
    saveState(state);
  }
});

// tint from recipe metal
function tintClassForRecipe(rec){
  const m = metalOfRecipe(rec);
  return m ? ` tint-${m}` : '';
}

// choose an icon for the recipe's output
function iconHtmlForRecipe(rec){
  const baseId = rec.id;
  const def = ITEMS?.[baseId] || {};
  const isMaterial = rec.kind === 'material' || /^bar_|^ore_/.test(baseId);
  const src = def.img || (isMaterial ? 'assets/materials/ore.png' : null);
  const tint = tintClassForRecipe(rec);
  return src
    ? `<img class="forge-icon icon-img${tint}" src="${src}" alt="${def.name || baseId}">`
    : `<span class="forge-icon forge-icon-fallback">🛠️</span>`;
}


// Apply upgrade
on(document, 'click', '#applyUpgradeBtn', ()=>{
  const token = el.upgradeTarget?.value;
  if (!token || token.startsWith('Nothing')) return;

  const res = applyUpgrade(state, token);
  if (!res) return;

  const name = prettyName(res.base);
  const barUsed = prettyName(res.barId);
  pushSmithLog(`Upgraded ${name}: ${qStr(res.oldQ)} → ${qStr(res.newQ)} (+${res.xp} Smithing xp) (−1 ${barUsed})`);

  saveState(state);
  updateCounts();
  renderSmithing();
  renderInventory();
  renderEquipment();
  renderSkills();
});
