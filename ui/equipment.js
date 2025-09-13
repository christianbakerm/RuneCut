import { state, saveState } from '../systems/state.js';
import { qs, on } from '../utils/dom.js';
import { unequipItem } from '../systems/equipment.js';
import { showTip, hideTip } from './tooltip.js';
import { ITEMS } from '../data/items.js';
import { derivePlayerStats, hpMaxFor } from '../systems/combat.js';
import { MONSTERS } from '../data/monsters.js';
import { renderInventory } from './inventory.js';
import { ensureMana, manaMaxFor, startManaRegen, onManaChange } from '../systems/mana.js';
import { ensureTomeEngine, tomeRemainingMs, tomeDurationMsFor } from '../systems/tomes.js';

// DOM roots
const grid = qs('#equipmentGrid');
const elMpText = qs('#charManaText');
const elMpBar  = qs('#charManaBar');
const elMpLbl  = qs('#charManaLabel');

/* ---------------- ensure CSS for stack badge on slots ---------------- */
(function ensureEquipQtyCSS(){
  if (document.getElementById('equipQtyCSS')) return;
  const css = document.createElement('style');
  css.id = 'equipQtyCSS';
  css.textContent = `
    #equipmentGrid .slot{ position:relative; }
    #equipmentGrid .slot .qty-badge{
      position:absolute; right:4px; top:4px;
      font-size:11px; line-height:16px; padding:0 6px;
      background:rgba(0,0,0,.65); color:#fff; border-radius:10px;
      pointer-events:none;
    }
    /* Eat button for the food slot (hover-reveal) */
    #equipmentGrid .slot .eat-btn{
      position:absolute; left:4px; bottom:4px;
      font-size:11px; line-height:14px; padding:2px 6px;
      opacity:0; pointer-events:none; transition:opacity .15s ease;
    }
    #equipmentGrid .slot:hover .eat-btn{
      opacity:1; pointer-events:auto;
    }
  `;
  document.head.appendChild(css);
})();

/* ---------------- metal/tint helpers ---------------- */
function parseId(id=''){
  const [base, qStr] = String(id).split('@');
  const qNum = parseInt(qStr,10);
  const q = Number.isFinite(qNum) ? Math.max(1, Math.min(100, qNum)) : null;
  return { base, q };
}
function metalFromItemId(id=''){
  const base = String(id).split('@')[0];
  let m = base.match(/^bar_(\w+)/)?.[1] || base.match(/^ore_(\w+)/)?.[1];
  if (m) return m;
  m = base.match(/^(axe|pick)_(\w+)/)?.[2];
  if (m) return m;
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
    ring:'💍', axe:'🪓', pick:'⛏️', tome:'📖',
    food:'🍖', fishing: '🎣'
  };
  return map[slot] || '⬜';
}

// Produce image HTML for a given item id (with tint + fallback ore sprite if needed)
function iconHtmlForId(id){
  const base = String(id).split('@')[0];
  const def = ITEMS[base] || {};
  const isMat = /^bar_|^ore_/.test(base);
  const imgSrc = def.img || (isMat ? 'assets/materials/ore.png' : null);
  const tintCls = tintClassForItem(id) || (def.tint ? ` tint-${def.tint}` : '');
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

  // Tome stack badge
  if (slot === 'tome'){
    const n = Math.max(0, state.equipment?.tomeQty|0);
    if (n >= 1){
      const badge = document.createElement('span');
      badge.className = 'qty-badge';
      badge.textContent = `×${n}`;
      el.appendChild(badge);
    }
  }

  // Food stack badge
  if (slot === 'food'){
    const n = Math.max(0, state.equipment?.foodQty|0);
    if (n >= 1){
      const badge = document.createElement('span');
      badge.className = 'qty-badge';
      badge.textContent = `×${n}`;
      el.appendChild(badge);

      const eat = document.createElement('button');
      eat.className = 'eat-btn btn-primary';
      eat.textContent = 'Eat';
      eat.title = 'Eat one';
      eat.setAttribute('data-eat-food', '1');
      el.appendChild(eat);
    }
  }
}

// Eat button on the food slot
on(grid, 'click', '.eat-btn[data-eat-food]', (e, btn)=>{
  const slots = state.equipment || {};
  const base  = slots.food;
  const qty   = Math.max(0, slots.foodQty|0);
  if (!base || qty <= 0) return;

  const heal = healAmountForBase(base);
  if (heal <= 0) return;

  const max = hpMaxFor(state);
  if (state.hpCurrent >= max) return; // no overheal

  state.hpCurrent = Math.min(max, state.hpCurrent + heal);
  slots.foodQty = Math.max(0, qty - 1);
  if (slots.foodQty === 0){
    // clear slot when empty
    slots.food = '';
  }
  window.dispatchEvent(new Event('hp:change'));
  window.dispatchEvent(new Event('food:change')); 
  renderEquipment();
  saveState(state);
});

// Unequip
on(grid, 'click', '.unequip-x', (e, btn)=>{
  const slot = btn.getAttribute('data-unequip');
  if (!slot) return;

  // Special handling for FOOD (return stack)
  if (slot === 'food'){
    const base = state.equipment?.food;
    const qty  = Math.max(0, state.equipment?.foodQty|0);
    if (base && qty > 0){
      state.inventory[base] = (state.inventory[base]||0) + qty;
    }
    if (state.equipment){
      state.equipment.food = '';
      state.equipment.foodQty = 0;
    }
    window.dispatchEvent(new Event('food:change'));
    saveState(state);
    renderInventory();
    renderEquipment();
    return;
  }

  // Existing behavior for other slots (tome logic already present in your code)
  const ok = unequipItem(state, slot);
  if (!ok && slot === 'tome') { /* optional toast */ }
  saveState(state);
  renderInventory();
  renderEquipment();
});

// get heal amount 
function healAmountForBase(base){
  const def = ITEMS[base] || {};
  return Number.isFinite(def.heal) ? def.heal : 0;
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
  if (elHpLbl)  elHpLbl.textContent = `${curHp}/${maxHp}`;

  ensureMana(state);
  const maxMp = manaMaxFor(state);
  const curMp = Math.max(0, Math.min(maxMp, state.manaCurrent));
  const mpPct = maxMp > 0 ? Math.round(100*curMp/maxMp) : 0;
  if (elMpText) elMpText.textContent = `${curMp}/${maxMp}`;
  if (elMpBar)  elMpBar.style.width  = `${mpPct}%`;
  if (elMpLbl)  elMpLbl.textContent  = `${curMp}/${maxMp}`;

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
    if (slot === 'tome' && !slots[slot]) {
      // ensure stack qty badge is cleared if no tome equipped
      const el = slotEl('tome'); if (el) el.querySelector('.qty-badge')?.remove();
    }
    setSlot(slot, slots[slot]);
  });

  startManaRegen(state, ()=>{
    // Lightweight HUD refresh when mana ticks
    renderCharacter();
    saveState(state);
  });

  renderCharacter();
  ensureTomeEngine(state);
}

onManaChange(() => {
  // lightweight: just repaint the character HUD
  // (you already have renderCharacter() inside this module)
  try { renderCharacter(); } catch {}
});

window.addEventListener('hp:change', () => {
  try { renderCharacter(); } catch {}
});

/* ---------------- events ---------------- */
// Unequip
on(grid, 'click', '.unequip-x', (e, btn)=>{
  const slot = btn.getAttribute('data-unequip');
  if (!slot) return;
  // For tome: unequip is ignored while active (systems handles that)
  const ok = unequipItem(state, slot);
  if (!ok && slot === 'tome') {
    // Optional: could show a tooltip/toast that tomes can’t be unequipped mid-run
  }
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

  if (slot === 'food'){
    const heal = healAmountForBase(base);
    const qty  = Math.max(0, state.equipment?.foodQty|0);
    if (heal > 0) lines.push(`Heals: ${heal} HP`);
    lines.push(`Stack: ×${qty}`);
    showTip(e, title, lines.join('\n'));
    return;
  }

  const stats = [];
  if (def.atk) stats.push(`Atk: ${Math.round(def.atk*mult)}`);
  if (def.str) stats.push(`Str: ${Math.round(def.str*mult)}`);
  if (def.def) stats.push(`Def: ${Math.round(def.def*mult)}`);
  if (def.hp)  stats.push(`HP: ${Math.round(def.hp*mult)}`);
  if (stats.length) lines.push(stats.join(' · '));

  if (def.speed) lines.push(`Speed: ${Number(def.speed).toFixed(2)}×`);

  if (def.slot === 'tome' && def.tome){
    const qty = Math.max(0, state.equipment?.tomeQty|0);
    const minLv = def.tome.minLevel || 1;
    const baseSec = def.tome.baseSec || def.tome.minSeconds || 15;
    const maxSec  = def.tome.maxSec  || def.tome.maxSeconds || 30;
    const resId   = def.tome.dropId || def.tome.resourceId;
    const resName = ITEMS[resId]?.name || resId || 'Unknown';
    lines.push(`Auto-gathers: ${resName}`);
    lines.push(`Duration per tome: ${baseSec}–${maxSec}s (scales with Enchanting)`);

    const remMs = tomeRemainingMs(state);
    const perMs = tomeDurationMsFor(state, base);
    const totalMs = remMs + Math.max(0, qty-1)*perMs;
    lines.push(`Equipped stack: ×${Math.max(1, qty)}`);
    if (remMs > 0) lines.push(`Active run remaining: ${Math.ceil(remMs/1000)}s`);
    if (totalMs > 0) lines.push(`Total remaining: ${Math.ceil(totalMs/1000)}s`);
  }

  showTip(e, title, lines.join('\n'));
});

on(grid, 'mouseout', '.slot', (e, slotDiv)=>{
  const to = e.relatedTarget;
  if (!to || !slotDiv.contains(to)) hideTip();
});
grid?.addEventListener('mouseleave', hideTip);

// Recompute accuracy if monster changes
on(document, 'change', '#monsterSelect', ()=> renderEquipment());

// Refresh equipment UI when tome stack changes or ends
window.addEventListener('tome:stack', ()=> renderEquipment());
window.addEventListener('tome:end',  ()=> renderEquipment());
