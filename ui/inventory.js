import { ITEMS } from '../data/items.js';
import { saveState, state } from '../systems/state.js';
import { removeItem, addGold } from '../systems/inventory.js';
import { equipItem } from '../systems/equipment.js';
import { renderEquipment } from './equipment.js'
import { hpMaxFor } from '../systems/combat.js';
import { qs, on } from '../utils/dom.js';
import { showTip, hideTip } from './tooltip.js';

const elInv = qs('#inventory');
const elPopover = qs('#popover');

function baseId(id){ return String(id).split('@')[0]; }

function qualityPct(id){
  const q = parseInt(String(id).split('@')[1], 10);
  return Number.isFinite(q) ? Math.max(1, Math.min(100, q)) : 100;
}

function sellPrice(id){
  const base = baseId(id);
  const it = ITEMS[base] || {};
  const qMul = qualityPct(id) / 100;
  let price = it.sell || 0;
  if(it.type === 'equipment'){
    const statScore = (it.atk||0) + (it.str||0) + (it.def||0) + 0.5*(it.hp||0);
    const toolBonus = it.speed ? 8*it.speed : 0;
    price = Math.max(price, Math.round(2*statScore + toolBonus));
    price = Math.round(Math.max(1, price) * qMul);
  } else {
    price = Math.max(1, Math.round(price || 1));
  }
  return price;
}

function healAmountFor(id){
  const base = baseId(id);
  const def = ITEMS[base] || {};
  return Number.isFinite(def.heal) ? def.heal : 0;
}
function eatItem(id){
  const heal = healAmountFor(id);
  if(heal <= 0) return false;
  const max = hpMaxFor(state);
  if(state.hpCurrent >= max) return false;
  const base = baseId(id);
  state.hpCurrent = Math.min(max, state.hpCurrent + heal);
  removeItem(state, id, 1);
  return true;
}

export function renderInventory(){
  if (!elInv) return;
  const entries = Object.entries(state.inventory || {});
  if (!entries.length){
    elInv.innerHTML = '<div class="muted">No items yet. Gather or fight to earn loot.</div>';
    return;
  }
  elInv.innerHTML = entries.map(([id, qty])=>{
    const base = baseId(id);
    const it   = ITEMS[base] || {};
    const isEquip = it.type === 'equipment';
    const isFood = (it.type === 'food') || (healAmountFor(id) > 0);
    const tintCls = it.tint ? ` tint-${it.tint}` : '';
    const iconHtml = it.img ? `<img src="${it.img}" class="icon-img${tintCls}" alt="">` : `<span class="icon">${it.icon || '❔'}</span>`;
    return `
      <div class="inv-slot ${isEquip ? 'equip' : ''}" data-id="${id}">
        ${iconHtml}
        ${isFood ? `<button class="use-btn" data-use="${id}" title="Eat">Eat</button>` : ''}
        <button class="sell-btn" data-sell="${id}">Sell</button>
        <span class="qty-badge">${qty}</span>
      </div>`;
  }).join('');
}

// interactions
on(elInv, 'click', 'button.use-btn', (e, btn)=>{
  const id = btn.getAttribute('data-use');
  if(eatItem(id)){ renderInventory(); saveState(state); }
});
on(elInv, 'click', 'button.sell-btn', (e, btn)=>{
  openSellPopover(btn, btn.getAttribute('data-sell'));
});
on(elInv, 'click', '.inv-slot.equip', (e, tile)=>{
  const id = tile.getAttribute('data-id');
  const base = baseId(id);
  const it = ITEMS[base];
  if(it?.type==='equipment'){ equipItem(state, id); renderInventory(); renderEquipment(); saveState(state); }
});

// tooltip
on(elInv, 'mousemove', '.inv-slot', (e, tile)=>{
  const id = tile.getAttribute('data-id'); 
  if (!id){ hideTip(); return; }

  const base = baseId(id);
  const def  = ITEMS[base] || {};
  const isEquip = def.type === 'equipment';
  const isFood  = def.type === 'food' || healAmountFor(id) > 0;
  const isTool  = isEquip && (def.slot === 'axe' || def.slot === 'pick' || def.speed);

  // quality only applies to equipment
  const qStr = String(id).split('@')[1];
  const q = (isEquip && Number.isFinite(parseInt(qStr,10))) 
    ? Math.max(1, Math.min(100, parseInt(qStr,10))) 
    : null;
  const mult = q ? q/100 : 1;

  // Title WITHOUT icon
  const title = `${def.name || base}`;

  const lines = [];

  if (isEquip){
    if (q != null) lines.push(`Quality: ${q}%`);

    const stats = [];
    if (def.atk) stats.push(`Atk: ${Math.round(def.atk*mult)}`);
    if (def.str) stats.push(`Str: ${Math.round(def.str*mult)}`);
    if (def.def) stats.push(`Def: ${Math.round(def.def*mult)}`);
    if (def.hp)  stats.push(`HP: ${Math.round(def.hp*mult)}`);
    if (stats.length) lines.push(stats.join(' · '));

    // Tools: show speed
    if (isTool && def.speed) lines.push(`Speed: ${Number(def.speed).toFixed(2)}×`);
  }

  // Food: show heal amount
  if (isFood){
    const heal = healAmountFor(id);
    if (heal > 0) lines.push(`Heals: ${heal} HP`);
  }

  // Non-equipment: show qty/value
  if (!isEquip){
    const qty  = state.inventory?.[id] || 0;
    const each = sellPrice(id);
    if (qty > 0){
      const total = each ? ` · Total: ${each*qty}g` : '';
      const eaStr = each ? ` · ${each}g ea` : '';
      lines.push(`Qty: ${qty}${eaStr}${qty>1 ? total : ''}`);
    }
  }

  showTip(e, title, lines.join('\n'));
});

// Hide tooltip when leaving a tile (works even when still over the grid)
on(elInv, 'mouseout', '.inv-slot', (e, tile)=>{
  const to = e.relatedTarget;
  if (!to || !tile.contains(to)) hideTip();
});

// Still hide if the pointer leaves the whole inventory area
elInv?.addEventListener('mouseleave', hideTip);

// sell popover (same UI, modularized)
function openSellPopover(anchorEl, id){
  if(!elPopover) return;
  const base = baseId(id);
  const it = ITEMS[base]||{};
  const have = state.inventory[id]||0;
  const rect = anchorEl.getBoundingClientRect();
  const price = sellPrice(id);

  elPopover.dataset.itemId = id;
  elPopover.innerHTML = `
    <div class="small muted" style="margin-bottom:6px;">Sell <b>${it.icon||''} ${it.name||base}${String(id).includes('@')?` (${qualityPct(id)}%)`:''}</b></div>
    <div class="row">
      <button class="btn-gold" data-amt="1">1</button>
      <button class="btn-gold" data-amt="10">10</button>
      <button class="btn-gold" data-amt="100">100</button>
      <button class="btn-gold" data-amt="-1">All</button>
    </div>
    <div class="row">
      <input type="number" id="sellCustomAmt" min="1" max="${have}" placeholder="Custom" />
      <button class="btn-gold" data-amt="custom">Sell</button>
    </div>
    <div class="small muted">Value: ${price}g each</div>
  `;
  elPopover.style.left = Math.min(window.innerWidth - 200, rect.left) + 'px';
  elPopover.style.top = (rect.top - 4 + window.scrollY) + 'px';
  elPopover.classList.remove('hidden');
}
export function closePopover(){ elPopover?.classList.add('hidden'); }

// Popover click handling
elPopover?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-amt]'); if(!btn) return;
  const id = elPopover.dataset.itemId; if(!id) return;
  const have = state.inventory[id]||0; if(have<=0) return;
  let amtAttr = btn.getAttribute('data-amt');
  let n = 0;
  if(amtAttr==='custom'){ const input = elPopover.querySelector('#sellCustomAmt'); n = Math.floor(+input.value||0); }
  else n = parseInt(amtAttr,10);
  if(n===-1) n = have;
  if(!Number.isFinite(n) || n<=0) return;
  n = Math.min(n, have);
  const value = sellPrice(id) * n;
  removeItem(state, id, n);
  addGold(state, value);
  closePopover(); renderInventory(); saveState(state);
});

// close popover globally
document.addEventListener('click', (e)=>{
  const inside = e.target.closest('#popover');
  const isSell = e.target.closest('button.sell-btn');
  if(!inside && !isSell) closePopover();
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closePopover(); });
