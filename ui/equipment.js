import { state, saveState } from '../systems/state.js';
import { qs, on } from '../utils/dom.js';
import { unequipItem } from '../systems/equipment.js';
import { showTip, hideTip } from './tooltip.js';
import { ITEMS } from '../data/items.js';
import { derivePlayerStats, hpMaxFor } from '../systems/combat.js';
import { MONSTERS } from '../data/monsters.js';
import { renderInventory } from './inventory.js'; // update inventory when unequipping

// DOM roots
const grid = qs('#equipmentGrid'); // container with .equip-cell children

/* ---------------- metal/tint helpers ---------------- */
function parseId(id=''){
  const [base, qStr] = String(id).split('@');
  const qNum = parseInt(qStr,10);
  const q = Number.isFinite(qNum) ? Math.max(1, Math.min(100, qNum)) : null;
  return { base, q };
}
function metalFromItemId(id=''){
  const base = String(id).split('@')[0];
  // bar_* or ore_* (rare in equipment, but safe)
  let m = base.match(/^bar_(\w+)/)?.[1] || base.match(/^ore_(\w+)/)?.[1];
  if (m) return m;
  // axe_copper / pick_bronze
  m = base.match(/^(axe|pick)_(\w+)/)?.[2];
  if (m) return m;
  // copper_helm, bronze_plate, iron_legs, etc.
  m = base.split('_')[0];
  if (['copper','bronze','iron','steel','mith','adamant','rune'].includes(m)) return m;
  return null;
}
function tintClassForItem(id=''){
  const m = metalFromItemId(id);
  return m ? ` tint-${m}` : '';
}

/* ---------------- slot helpers ---------------- */
function slotEl(slot){ return grid?.querySelector(`.equip-cell[data-slot="${slot}"] .slot`); }
function fallbackIcon(slot){
  const map = {
    head:'🪖', cape:'🧣', amulet:'📿',
    weapon:'🗡️', body:'🧥', shield:'🛡️',
    gloves:'🧤', legs:'👖', boots:'🥾',
    ring:'💍', axe:'🪓', pick:'⛏️'
  };
  return map[slot] || '⬜';
}

// Produce image HTML for a given item id (with tint + fallback ore sprite if needed)
function iconHtmlForId(id){
  const base = String(id).split('@')[0];
  const def = ITEMS[base] || {};
  const isMat = /^bar_|^ore_/.test(base);
  const imgSrc = def.img || (isMat ? 'assets/materials/ore.png' : null);
  const tintCls = tintClassForItem(id);
  return imgSrc
    ? `<img src="${imgSrc}" class="icon-img${tintCls}" alt="">`
    : `<span class="icon">${def.icon || '❔'}</span>`;
}

function setSlot(slot, id){
  const el = slotEl(slot); if (!el) return;
  el.classList.remove('empty','has-item');
  el.innerHTML = '';
  if (!id){
    el.classList.add('empty');
    el.innerHTML = `<span class="icon">${fallbackIcon(slot)}</span><button class="unequip-x" data-unequip="${slot}" title="Unequip">✕</button>`;
    el.dataset.itemId = '';
    return;
  }
  el.classList.add('has-item');
  el.innerHTML = `${iconHtmlForId(id)}<button class="unequip-x" data-unequip="${slot}" title="Unequip">✕</button>`;
  el.dataset.itemId = id;
}

/* ---------------- character panel ---------------- */
function renderCharacter(){
  const elHpText = qs('#charHpText');
  const elAtk    = qs('#charAtk');
  const elStr    = qs('#charStr');
  const elDef    = qs('#charDef');
  const elHpBar  = qs('#charHpBar');
  const elHpLbl  = qs('#charHpLabel');
  const elMaxHit = qs('#charMaxHit');
  const elAcc    = qs('#charAcc');
  const elDefB   = qs('#charDefBonus');

  const maxHp = hpMaxFor(state);
  if (state.hpCurrent == null) state.hpCurrent = maxHp;
  const curHp = Math.max(0, Math.min(maxHp, state.hpCurrent));
  const hpPct = maxHp > 0 ? Math.round(100*curHp/maxHp) : 0;
  if (elHpText) elHpText.textContent = `${curHp}/${maxHp}`;
  if (elHpBar)  elHpBar.style.width = `${hpPct}%`;
  if (elHpLbl)  elHpLbl.textContent = `${hpPct}%`;

  // Accuracy context vs selected monster
  const monSel = qs('#monsterSelect');
  const mon = monSel ? MONSTERS.find(m=>m.id===monSel.value) : null;

  const ps = derivePlayerStats(state, mon);
  if (elAtk)  elAtk.textContent = ps.atkBonus ?? 0;
  if (elStr)  elStr.textContent = ps.strBonus ?? 0;
  if (elDef)  elDef.textContent = ps.defBonus ?? 0;

  if (elMaxHit) elMaxHit.textContent = ps.maxHit ?? 1;
  if (elAcc)    elAcc.textContent    = mon ? `${Math.round((ps.acc||0)*100)}%` : '—';
  if (elDefB)   elDefB.textContent   = `+${ps.defBonus ?? 0}`;
}

/* ---------------- public render ---------------- */
export function renderEquipment(){
  if (!grid) return;
  const slots = state.equipment || {};
  Object.keys(slots).forEach(slot => {
    setSlot(slot, slots[slot]);
  });
  renderCharacter();
}

/* ---------------- events ---------------- */
// Unequip
on(grid, 'click', '.unequip-x', (e, btn)=>{
  const slot = btn.getAttribute('data-unequip');
  if (!slot) return;
  unequipItem(state, slot);
  saveState(state);
  renderInventory();
  renderEquipment();
});

// Tooltip on equipped slot
on(grid, 'mousemove', '.slot', (e, slotDiv)=>{
  const id = slotDiv.dataset.itemId;
  const slot = slotDiv.closest('.equip-cell')?.dataset.slot || 'slot';
  if (!id){
    showTip(e, `${slot[0].toUpperCase()+slot.slice(1)}`, 'Empty');
    return;
  }
  const { base, q } = parseId(id);
  const def = ITEMS[base] || {};

  const title = `${def.name || base}`;

  const mult = q ? q/100 : 1;
  const lines = [];

  if (q != null) lines.push(`Quality: ${q}%`);

  const stats = [];
  if (def.atk) stats.push(`Atk: ${Math.round(def.atk*mult)}`);
  if (def.str) stats.push(`Str: ${Math.round(def.str*mult)}`);
  if (def.def) stats.push(`Def: ${Math.round(def.def*mult)}`);
  if (def.hp)  stats.push(`HP: ${Math.round(def.hp*mult)}`);
  if (stats.length) lines.push(stats.join(' · '));

  if (def.speed) lines.push(`Speed: ${Number(def.speed).toFixed(2)}×`);

  showTip(e, title, lines.join('\n'));
});

on(grid, 'mouseout', '.slot', (e, slotDiv)=>{
  const to = e.relatedTarget;
  if (!to || !slotDiv.contains(to)) hideTip();
});
grid?.addEventListener('mouseleave', hideTip);

// Recompute accuracy if monster changes
on(document, 'change', '#monsterSelect', ()=> renderEquipment());
