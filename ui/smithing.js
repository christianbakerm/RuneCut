// /ui/smithing.js
import { state, saveState } from '../systems/state.js';
import { qs, on } from '../utils/dom.js';
import { FORGE_RECIPES, SMELT_RECIPES } from '../data/smithing.js';
import {
  canSmelt, startSmelt, finishSmelt, maxSmeltable,
  canForge, startForge, finishForge,
  listUpgradable, applyUpgrade, UPGRADE_BAR_ID
} from '../systems/smithing.js';
import { pushSmithLog } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderSkills } from './skills.js';
import { renderEquipment } from './equipment.js';
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

  // smelting UI (IDs must match your HTML)
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
  el.upgradeBarCount&& (el.upgradeBarCount.textContent= state.inventory[UPGRADE_BAR_ID] || 0);
}

function reqStrForge(rec){
  const parts = [];
  const barId = barForRecipe(rec);
  const barNm = prettyName(barId);
  if (rec.bars) parts.push(`${rec.bars}× ${barNm}`);
  (rec.extras || []).forEach(ex => parts.push(`${ex.qty}× ${prettyName(ex.id)}`));
  return parts.join(', ');
}

// ---------- renderers ----------
function ensureSmeltDropdown(){
  if (!el.smeltSelect) return;

  // Build choices from SMELT_RECIPES keys (expect bar_copper, bar_bronze, bar_iron, ...)
  const bars = Object.keys(SMELT_RECIPES || {});
  // Keep a stable order
  const order = ['bar_copper','bar_bronze','bar_iron'];
  bars.sort((a,b)=> (order.indexOf(a)+999) - (order.indexOf(b)+999) || a.localeCompare(b));

  // Remember current selection to preserve user choice
  const prev = el.smeltSelect.value;
  el.smeltSelect.innerHTML = bars.map(id => {
    const name = prettyName(id);
    return `<option value="${id}" ${id===prev ? 'selected':''}>${name}</option>`;
  }).join('');

  // If previous selection vanished, pick first
  if (!bars.includes(prev) && bars.length){
    el.smeltSelect.value = bars[0];
  }
}

function renderForgeList(){
  if (!el.forgeList) return;
  const want = el.forgeMetal?.value || 'copper';

  const list = (FORGE_RECIPES || [])
    .filter(r => metalOfRecipe(r) === want)
    .slice()
    .sort((a,b) => (a.level||1)-(b.level||1) || String(a.name||a.id).localeCompare(String(b.name||b.id)));

  el.forgeList.innerHTML = list.map(r=>{
    const ok   = canForge(state, r.id);
    const need = r.level || 1;
    return `
      <button class="forge-item ${ok ? '' : 'disabled'}" data-id="${r.id}">
        <span class="name">${r.name || prettyName(r.id)}</span>
        <span class="req">Lv ${need}</span>
        <small class="io">${reqStrForge(r)}</small>
      </button>
    `;
  }).join('');
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
      renderInventory();
      renderSkills();
      left -= 1;
      step();
    });
    if (ok) renderSmithing();
  };
  step();
});

// Changing the smelt dropdown is enough; buttons read it at click-time
on(document, 'change', '#smeltSelect', ()=>{
  // Optional: could update a helper text here; for now just ensure UI is fresh
  renderSmithing();
});

// Forge metal filter (matches your HTML id="#forgeMetal")
on(document, 'change', '#forgeMetal', ()=>{
  renderForgeList();
});

// Upgrade metal filter
on(document, 'change', '#upgradeFilter', ()=>{
  renderUpgradeDropdown();
});

// Click a forge recipe
on(document, 'click', '#forgeList .forge-item', (e, btn)=>{
  const id = btn.dataset.id;
  if (!id || !canForge(state, id)) return;

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
    renderSmithing();
    renderInventory();
    renderEquipment();
    renderSkills();
  });

  if (ok) renderSmithing();
});

// Apply upgrade
on(document, 'click', '#applyUpgradeBtn', ()=>{
  const token = el.upgradeTarget?.value;
  if (!token || token.startsWith('Nothing')) return;

  const res = applyUpgrade(state, token);
  if (!res) return;

  const name = prettyName(res.base);
  pushSmithLog(`Upgraded ${name}: ${qStr(res.oldQ)} → ${qStr(res.newQ)} (+${res.xp} Smithing xp) (−1 ${prettyName(UPGRADE_BAR_ID)})`);

  saveState(state);
  updateCounts();
  renderSmithing();
  renderInventory();
  renderEquipment();
  renderSkills();
});
