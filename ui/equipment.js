// /ui/equipment.js
import { state, saveState } from '../systems/state.js';
import { qs, on } from '../utils/dom.js';
import { unequipItem } from '../systems/equipment.js';
import { showTip, hideTip } from './tooltip.js';
import { ITEMS } from '../data/items.js';
import { derivePlayerStats, hpMaxFor } from '../systems/combat.js';
import { MONSTERS } from '../data/monsters.js';
import { renderInventory } from './inventory.js'; // <- update inv when unequipping

// DOM roots
const grid = qs('#equipmentGrid'); // <-- correct container

// Helpers
function parseId(id=''){
  const [base, qStr] = String(id).split('@');
  const q = Number.isFinite(parseInt(qStr,10)) ? Math.max(1, Math.min(100, parseInt(qStr,10))) : null;
  return { base, q };
}
function iconHtmlFor(base, q){
  const def = ITEMS[base] || {};
  const tintCls = def.tint ? ` tint-${def.tint}` : '';
  const icon = def.img
    ? `<img src="${def.img}" class="icon-img${tintCls}" alt="">`
    : `<span class="icon">${def.icon || '❔'}</span>`;
  return `${icon}`;
}
function slotEl(slot){ return grid?.querySelector(`.equip-cell[data-slot="${slot}"] .slot`); }
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
  const { base, q } = parseId(id);
  el.classList.add('has-item');
  el.innerHTML = `${iconHtmlFor(base, q)}<button class="unequip-x" data-unequip="${slot}" title="Unequip">✕</button>`;
  el.dataset.itemId = id;
}
function fallbackIcon(slot){
  const map = {
    head:'🪖', cape:'🧣', amulet:'📿',
    weapon:'🗡️', body:'🧥', shield:'🛡️',
    gloves:'🧤', legs:'👖', boots:'🥾',
    ring:'💍', axe:'🪓', pick:'⛏️'
  };
  return map[slot] || '⬜';
}

// Character panel paint
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

  // HP
  const maxHp = hpMaxFor(state);
  if (state.hpCurrent == null) state.hpCurrent = maxHp;
  const curHp = Math.max(0, Math.min(maxHp, state.hpCurrent));
  const hpPct = maxHp > 0 ? Math.round(100*curHp/maxHp) : 0;
  if (elHpText) elHpText.textContent = `${curHp}/${maxHp}`;
  if (elHpBar)  elHpBar.style.width = `${hpPct}%`;
  if (elHpLbl)  elHpLbl.textContent = `${hpPct}%`;

  // Accuracy context: vs selected monster if available
  const monSel = qs('#monsterSelect');
  const mon = monSel ? MONSTERS.find(m=>m.id===monSel.value) : null;

  const ps = derivePlayerStats(state, mon);
  // Show gear bonuses (not levels)
  if (elAtk)  elAtk.textContent = ps.atkBonus ?? 0;
  if (elStr)  elStr.textContent = ps.strBonus ?? 0;
  if (elDef)  elDef.textContent = ps.defBonus ?? 0;

  if (elMaxHit) elMaxHit.textContent = ps.maxHit ?? 1;
  if (elAcc)    elAcc.textContent    = mon ? `${Math.round((ps.acc||0)*100)}%` : '—';
  if (elDefB)   elDefB.textContent   = `+${ps.defBonus ?? 0}`;
}

// Public render
export function renderEquipment(){
  if (!grid) return;

  // ensure each slot cell exists and paint it
  const slots = state.equipment || {};
  Object.keys(slots).forEach(slot => {
    setSlot(slot, slots[slot]);
  });

  // Also refresh character panel in the same pass
  renderCharacter();
}

// --- Events ---
// Unequip
on(grid, 'click', '.unequip-x', (e, btn)=>{
  const slot = btn.getAttribute('data-unequip');
  if (!slot) return;
  unequipItem(state, slot);
  saveState(state);
  renderInventory();   // keep inventory in sync
  renderEquipment();   // refresh equipment + character
});

// Tooltip (hover on slot) — name only (no icon), show quality & stats, and tool speed
on(grid, 'mousemove', '.slot', (e, slotDiv)=>{
  const id = slotDiv.dataset.itemId;
  const slot = slotDiv.closest('.equip-cell')?.dataset.slot || 'slot';
  if (!id){
    showTip(e, `${slot[0].toUpperCase()+slot.slice(1)}`, 'Empty');
    return;
  }
  const { base, q } = parseId(id);
  const def = ITEMS[base] || {};

  // Title WITHOUT icon
  const title = `${def.name || base}`;

  const mult = q ? q/100 : 1;
  const lines = [];

  // Show quality only on hover
  if (q != null) lines.push(`Quality: ${q}%`);

  // Stats
  const stats = [];
  if (def.atk) stats.push(`Atk: ${Math.round(def.atk*mult)}`);
  if (def.str) stats.push(`Str: ${Math.round(def.str*mult)}`);
  if (def.def) stats.push(`Def: ${Math.round(def.def*mult)}`);
  if (def.hp)  stats.push(`HP: ${Math.round(def.hp*mult)}`);
  if (stats.length) lines.push(stats.join(' · '));

  // Tools speed
  if (def.speed) lines.push(`Speed: ${Number(def.speed).toFixed(2)}×`);

  showTip(e, title, lines.join('\n'));
});

// Hide tooltip when moving the pointer out of the slot or leaving the grid
on(grid, 'mouseout', '.slot', (e, slotDiv)=>{
  const to = e.relatedTarget;
  if (!to || !slotDiv.contains(to)) hideTip();
});
grid?.addEventListener('mouseleave', hideTip);

// If the monster selection changes, refresh character accuracy immediately
on(document, 'change', '#monsterSelect', ()=> renderEquipment());
