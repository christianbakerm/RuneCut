// main.js
import { ITEMS } from './data/items.js';
import { TREES } from './data/trees.js';
import { MONSTERS } from './data/monsters.js';
import { FISHING_SPOTS } from './data/fishing.js';
import { ROCKS } from './data/mining.js';
import { COOK_RECIPES, canCookId } from './data/cooking.js';
import { XP_TABLE, levelFromXp, progressFor } from './systems/xp.js';
import { defaultState, saveState, loadState } from './systems/state.js';
import { startChop, finishChop } from './systems/woodcutting.js';
import { startFish, finishFish } from './systems/fishing.js';
import { startMine, finishMine } from './systems/mining.js';
import { cookItems } from './systems/cooking.js';
import { beginFight, turnFight, derivePlayerStats, hpMaxFor } from './systems/combat.js';
import { addItem, removeItem, addGold } from './systems/inventory.js';
import { equipItem, unequipItem } from './systems/equipment.js';
import { SMELT_RECIPES, FORGE_RECIPES } from './data/smithing.js';
import { canSmelt, startSmelt, finishSmelt, canForge, startForge, finishForge } from './systems/smithing.js';
import { CRAFT_RECIPES } from './data/crafting.js';
import { canCraft, maxCraftable, startCraft, finishOneCraft } from './systems/crafting.js';

let state = loadState() || defaultState();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
// --- Level helpers  ---
const SKILL_LABEL = { wc:'Woodcutting', fish:'Fishing', min:'Mining', smith:'Smithing', craft:'Crafting', atk:'Attack', str:'Strength', def:'Defense' };
function lvlOf(skill){ return levelFromXp((state[skill+'Xp']||0), XP_TABLE); }
function hasLevel(skill, need=1){ return lvlOf(skill) >= need; }
function reqText(skill, need){ return `${SKILL_LABEL[skill]||skill} level ${need} required.`; }


state.equipment = {
  axe:null, weapon:null, shield:null,
  head:null, body:null, legs:null, gloves:null, boots:null,
  amulet:null, ring:null, cape:null,
  ...(state.equipment||{})
};

const initialMax = hpMaxFor(state);
if(state.hpCurrent==null) state.hpCurrent = initialMax; else state.hpCurrent = Math.min(state.hpCurrent, initialMax);

(function migrateQualityOnResources(){
  if(!state || !state.inventory) return;
  const keys = Object.keys(state.inventory);
  for(const id of keys){
    if(!id.includes('@')) continue;
    const base = id.split('@')[0];
    const def = ITEMS[base];
    if(def && def.type !== 'equipment'){
      const qty = state.inventory[id] || 0;
      delete state.inventory[id];
      state.inventory[base] = (state.inventory[base] || 0) + qty;
    }
  }
  saveState(state);
})();

const qs = (s) => document.querySelector(s);
const el = {
  // skills tiles
  totalLevel: qs('#totalLevel'),
  wcLevelMini: qs('#wcLevelMini'), wcBarMini: qs('#wcBarMini'),
  craftLevelMini: qs('#craftLevelMini'), craftBarMini: qs('#craftBarMini'),
  fishLevelMini: qs('#fishLevelMini'), fishBarMini: qs('#fishBarMini'),
  cookLevelMini: qs('#cookLevelMini'), cookBarMini: qs('#cookBarMini'),
  atkLevelMini: qs('#atkLevelMini'), atkBarMini: qs('#atkBarMini'),
  strLevelMini: qs('#strLevelMini'), strBarMini: qs('#strBarMini'),
  defLevelMini: qs('#defLevelMini'), defBarMini: qs('#defBarMini'),
  smithLevelMini: qs('#smithLevelMini'), smithBarMini: qs('#smithBarMini'),
  gold: qs('#gold'),

  // character panel
  charHpText: qs('#charHpText'), charHpBar: qs('#charHpBar'), charHpLabel: qs('#charHpLabel'),
  charAtk: qs('#charAtk'), charStr: qs('#charStr'), charDef: qs('#charDef'),
  charMaxHit: qs('#charMaxHit'), charAcc: qs('#charAcc'), charDefBonus: qs('#charDefBonus'),

  // panels
  forestPanel: qs('#tab-forests'),
  fishPanel: qs('#tab-fishing'),
  cookPanel: qs('#tab-cooking'),
  combatPanel: qs('#tab-combat'),

  // woodcutting
  treeSelect: qs('#treeSelect'), chopBtn: qs('#chopBtn'), actionBar: qs('#actionBar'), actionLabel: qs('#actionLabel'),

  // crafting
  craftPanel:  qs('#tab-crafting'),
  craftList:   qs('#craftList'),
  craftBar:    qs('#craftBar'),
  craftLabel:  qs('#craftLabel'),
  craftLog:    qs('#craftLog'),

  // fishing
  spotSelect: qs('#spotSelect'), fishBtn: qs('#fishBtn'),
  fishBar: qs('#fishBar'), fishLabel: qs('#fishLabel'), fishLog: qs('#fishLog'),
  fishLevelMini: qs('#fishLevelMini'), fishBarMini: qs('#fishBarMini'),

  // cooking
  cookFire: qs('#cookFire'),
  cookBar: qs('#cookBar'),
  cookPerfectZone: qs('#cookPerfectZone'),
  cookHint: qs('#cookHint'),
  cookLog: qs('#cookLog'),

  // Mining
  rockSelect: qs('#rockSelect'), mineBtn: qs('#mineBtn'),
  mineBar: qs('#mineBar'), mineLabel: qs('#mineLabel'), mineLog: qs('#mineLog'),
  minLevelMini: qs('#minLevelMini'), minBarMini: qs('#minBarMini'),

  // Smithing panel
  smithPanel: qs('#tab-smithing'),
  oreCopperCount: qs('#oreCopperCount'),
  copperBarCount: qs('#copperBarCount'),
  upgradeBarCount: qs('#upgradeBarCount'),
  smeltOneBtn: qs('#smeltOneBtn'),
  smeltAllBtn: qs('#smeltAllBtn'),
  smithBar: qs('#smithBar'),
  smithLabel: qs('#smithLabel'),
  smithLog: qs('#smithLog'),
  forgeList: qs('#forgeList'),
  makeUpgradeBarBtn: qs('#makeUpgradeBarBtn'),
  makeUpgradeBarAllBtn: qs('#makeUpgradeBarAllBtn'),
  upgradeTarget: qs('#upgradeTarget'),
  applyUpgradeBtn: qs('#applyUpgradeBtn'),

  // combat
  monsterSelect: qs('#monsterSelect'), trainingSelect: qs('#trainingSelect'), fightBtn: qs('#fightBtn'), attackTurnBtn: qs('#attackTurnBtn'), fleeBtn: qs('#fleeBtn'),
  monName: qs('#monName'), playerHpBar: qs('#playerHpBar'), playerHpVal: qs('#playerHpVal'), monHpBar: qs('#monHpBar'), monHpVal: qs('#monHpVal'),
  monsterImg: qs('#monsterImg'),
  monsterCardName: qs('#monsterCardName'),
  monsterCardLevel: qs('#monsterCardLevel'),
  monsterCardStats: qs('#monsterCardStats'),

  // lists/logs
  inventory: qs('#inventory'), 
  log: qs('#log'), 
  combatLog: qs('#combatLog'), 
  cookList: qs('#cookList'),
  globalLog: qs('#globalLog'),
  logFilters: qs('#logFilters'), 

  // equipment grid + tooltip
  equipmentGrid: qs('#equipmentGrid'), tooltip: qs('#tooltip'),

  // save/reset
  saveBtn: qs('#saveBtn'), resetBtn: qs('#resetBtn'),
};

// make module locals visible in DevTools console
window.el = el;
window.state = state;

const EQUIP_SLOTS = ['head','cape','amulet','weapon','body','shield','gloves','legs','boots','ring','axe'];
const SLOT_LABELS = { head:'Head', cape:'Cape', amulet:'Amulet', weapon:'Weapon', body:'Body', shield:'Shield', gloves:'Gloves', legs:'Legs', boots:'Boots', ring:'Ring', axe:'Axe' };
const SLOT_PLACEHOLDER = { head:'🪖', cape:'🧣', amulet:'📿', weapon:'🗡️', body:'🧥', shield:'🛡️', gloves:'🧤', legs:'👖', boots:'🥾', ring:'💍', axe:'🪓' };

// Cache each slot's original placeholder HTML so we can restore it
let __equipPlaceholders = null;
function cacheEquipPlaceholders(){
  if(__equipPlaceholders) return;
  __equipPlaceholders = {};
  document.querySelectorAll('#equipmentGrid .equip-cell').forEach(cell=>{
    const slot = cell.getAttribute('data-slot');
    const box  = cell.querySelector('.slot');
    __equipPlaceholders[slot] = box ? box.innerHTML : '';
  });
}

function renderEquipmentGrid(){
  const grid = el.equipmentGrid;
  if(!grid) return;
  cacheEquipPlaceholders();

  grid.querySelectorAll('.equip-cell').forEach(cell=>{
    const slot = cell.getAttribute('data-slot');
    const box  = cell.querySelector('.slot');
    if(!box) return;

    const eqId = state.equipment?.[slot] || null;

    if(eqId){
      const base = String(eqId).split('@')[0];
      const it   = ITEMS[base] || {};
      box.classList.add('has-item');
      box.classList.remove('empty');
      box.innerHTML = `
        ${it.img ? `<img src="${it.img}" class="icon-img" alt="">` : `<span class="icon">${it.icon||'❔'}</span>`}
        <button class="unequip-x" data-unequip="${slot}" title="Unequip">✕</button>
      `;
      box.title = it.name || base;
    } else {
      // restore the exact placeholder DOM that was in the HTML
      box.classList.remove('has-item');
      box.classList.add('empty');
      box.innerHTML = __equipPlaceholders[slot] || `<span class="icon">?</span><button class="unequip-x" data-unequip="${slot}" title="Unequip">✕</button>`;
      box.removeAttribute('title');
    }
  });
}


function populate(){
  // Trees
  if (el.treeSelect){
    el.treeSelect.innerHTML = '';
    const wc = lvlOf('wc');
    TREES.forEach(t=>{
      const o = document.createElement('option');
      const locked = wc < (t.level||1);
      o.value = t.id;
      o.disabled = locked;
      o.textContent = `${t.name} (Lvl ${t.level||1})${locked?' 🔒':''}`;
      el.treeSelect.appendChild(o);
    });
    // keep previous selection if still allowed, otherwise pick first unlocked
    if (![...el.treeSelect.options].some(op=>op.value===state.selectedTreeId && !op.disabled)){
      const firstOpen = [...el.treeSelect.options].find(op=>!op.disabled);
      state.selectedTreeId = firstOpen ? firstOpen.value : (TREES[0]?.id || '');
    }
    el.treeSelect.value = state.selectedTreeId;
  }

  // Fishing spots
  if(el.spotSelect){
    const fishLv = lvlOf('fish');
    el.spotSelect.innerHTML='';
    FISHING_SPOTS.forEach(s=>{
      const need = s.level || 1;
      const locked = fishLv < need;
      const o=document.createElement('option');
      o.value=s.id; 
      o.textContent = `${s.name} (Lvl ${need})${locked ? ' 🔒' : ''}`;
      el.spotSelect.appendChild(o);
    });
    el.spotSelect.value = state.selectedSpotId;
  }

  if(el.fishPanel)   el.fishPanel.classList.toggle('hidden', name!=='fishing');
  if(el.miningPanel) el.miningPanel.classList.toggle('hidden', name!=='mining');

  // Rocks
  if(el.rockSelect){
    el.rockSelect.innerHTML='';
    ROCKS.forEach(r=>{
      const o=document.createElement('option');
      o.value=r.id; o.textContent=`${r.name} (Lvl ${r.level})`;
      el.rockSelect.appendChild(o);
    });
    el.rockSelect.value = state.selectedRockId;
  }

  // Monsters
  if(el.monsterSelect){
    el.monsterSelect.innerHTML='';
    MONSTERS.forEach(m=>{ const o=document.createElement('option'); o.value=m.id; o.textContent=`${m.name} (Lvl ${m.level})`; el.monsterSelect.appendChild(o); });
  }
  if(el.trainingSelect) el.trainingSelect.value = state.trainingStyle;
}

function renderMonsterCard(){
  const mon = MONSTERS.find(m=>m.id===el.monsterSelect?.value);
  if(!mon){
    if(el.monsterImg) el.monsterImg.removeAttribute('src');
    if(el.monsterCardName) el.monsterCardName.textContent = '—';
    if(el.monsterCardLevel) el.monsterCardLevel.textContent = '—';
    if(el.monsterCardStats) el.monsterCardStats.textContent = 'HP — · Atk — · Def — · Max —';
    return;
  }
  if(el.monsterImg){
    el.monsterImg.src = mon.img || '';
    el.monsterImg.alt = mon.name;
  }
  if(el.monsterCardName)  el.monsterCardName.textContent  = mon.name;
  if(el.monsterCardLevel) el.monsterCardLevel.textContent = mon.level;
  if(el.monsterCardStats) el.monsterCardStats.textContent =
    `HP ${mon.hp} · Atk ${mon.attack} · Def ${mon.defense} · Max ${mon.maxHit}`;
}

el.monsterSelect.addEventListener('change', ()=>{
  state.trainingStyle = el.trainingSelect.value; // keep if you do this elsewhere
  renderMonsterCard(); saveState(state);
});

function showTip(evt, title, body){
  if(!el.tooltip) return;
  const htmlBody = body ? `<div class="muted">${String(body).replace(/\n/g,'<br>')}</div>` : '';
  el.tooltip.innerHTML = `<b>${title}</b>${htmlBody}`;
  el.tooltip.classList.remove('hidden');
  const pad = 12;
  const { innerWidth:w, innerHeight:h } = window;
  let x = evt.clientX + pad, y = evt.clientY + pad;
  const r = el.tooltip.getBoundingClientRect();
  if(x + r.width > w - 8) x = w - r.width - 8;
  if(y + r.height > h - 8) y = h - r.height - 8;
  el.tooltip.style.left = x + 'px';
  el.tooltip.style.top  = y + 'px';
}

function hideTip(){ if(el.tooltip) el.tooltip.classList.add('hidden'); }

function setTab(name){
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  ['forests','crafting','fishing','cooking','mining','smithing','combat'].forEach(t => {
    const p = document.getElementById(`tab-${t}`);
    if (p) p.classList.toggle('hidden', t !== name);
  });
}

function render(){ renderStats(); renderInventory(); renderAction(); renderEquipmentGrid(); renderCombatHud(); renderMonsterCard(); renderCookingList(); renderSmithing(); renderPanelLogs(); renderCrafting();}

function renderMini(levelEl, barEl, xp){
  const p = progressFor(xp, XP_TABLE);
  if (levelEl) levelEl.textContent = p.lvl;
  if (barEl){
    barEl.style.width = p.pct.toFixed(2) + '%';
    barEl.parentElement.title =
      `Lvl ${p.lvl} — ${p.into.toLocaleString()}/${p.span.toLocaleString()} to next `
      + `(${Math.floor(p.pct)}%) · Need: ${p.need.toLocaleString()} XP`;
  }
}

// ---- Logging Main ---- //

function appendLog(localEl, msg, type='skilling'){
  // still writes to any local panel log if present
  if(localEl){
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    localEl.appendChild(p);
    localEl.scrollTop = localEl.scrollHeight;
  }
  logEvent(type, msg);
}

function pushLog(msg){          logEvent('skilling', msg);  renderPanelLogs(); }
function pushSmithLog(msg){     logEvent('smithing', msg);  renderPanelLogs(); }
function pushCombatLog(msg){    logEvent('combat', msg);    renderPanelLogs(); }

// ---- Logging helpers ---- //
function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function logEvent(type, msg){
  const entry = { t: Date.now(), type, msg };
  (state.logs ||= []).push(entry);
  // keep last 300
  if (state.logs.length > 300) state.logs.splice(0, state.logs.length - 300);
}

function renderGlobalInto(targetEl, types){
  if (!targetEl) return;
  const items = (state.logs||[]).filter(en => !types || types.includes(en.type)).slice(-120);
  targetEl.innerHTML = items.map(en=>{
    const ts = new Date(en.t).toLocaleTimeString();
    return `<p><span class="muted">[${ts}]</span> ${escapeHtml(en.msg)}</p>`;
  }).join('');
  targetEl.scrollTop = targetEl.scrollHeight;
}

function renderPanelLogs(){
  // Woodcutting / general skilling area
  renderGlobalInto(el.log,      ['skilling','crafting','economy']);
  renderGlobalInto(el.fishLog,  ['skilling','economy']);
  renderGlobalInto(el.mineLog,  ['skilling','economy']);
  renderGlobalInto(el.smithLog, ['smithing','crafting','economy']);
  renderGlobalInto(el.combatLog,['combat','economy']);
}

// ---- Logging Listener ---- //

el.logFilters?.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-log]'); if(!btn) return;
  document.querySelectorAll('#logFilters .chip').forEach(b=>b.classList.toggle('active', b===btn));
  state.logFilter = btn.dataset.log || 'all';
  saveState(state);
});

document.getElementById('equipmentGrid')?.addEventListener('click', (e)=>{
  const b = e.target.closest('.unequip-x');
  if(!b) return;
  unequipItem(state, b.dataset.unequip);
  render(); saveState(state);
});

function renderStats(){
  renderMini(el.wcLevelMini,   el.wcBarMini,   state.wcXp);
  renderMini(el.craftLevelMini, el.craftBarMini, state.craftXp);
  renderMini(el.fishLevelMini, el.fishBarMini, state.fishXp);
  renderMini(el.minLevelMini,  el.minBarMini,  state.minXp);
  renderMini(el.smithLevelMini,el.smithBarMini,state.smithXp);
  renderMini(el.cookLevelMini, el.cookBarMini, state.cookXp);
  renderMini(el.atkLevelMini,  el.atkBarMini,  state.atkXp);
  renderMini(el.strLevelMini,  el.strBarMini,  state.strXp);
  renderMini(el.defLevelMini,  el.defBarMini,  state.defXp);

  const total = ['wcXp','fishXp','cookXp','atkXp','strXp','defXp', 'minXp', 'smithXp']
    .reduce((sum,k)=> sum + levelFromXp(state[k]||0, XP_TABLE), 0);
  el.totalLevel && (el.totalLevel.textContent = total);
  el.gold && (el.gold.textContent = Math.floor(state.gold).toLocaleString());

  renderEquipmentGrid();
  renderCharacterPanel();
}

function renderCharacterPanel(){
  const mon = MONSTERS.find(m=>m.id===el.monsterSelect?.value);
  const ps = derivePlayerStats(state, mon);
  const maxHp = hpMaxFor(state);
  state.hpCurrent = Math.min(state.hpCurrent, maxHp);

  el.charHpText && (el.charHpText.textContent = `${Math.floor(state.hpCurrent)}/${maxHp}`);
  if(el.charHpBar){
    const pct = 100*state.hpCurrent/Math.max(1,maxHp);
    el.charHpBar.style.width = pct.toFixed(2)+'%';
  }
  el.charHpLabel && (el.charHpLabel.textContent = `${Math.round(100*state.hpCurrent/Math.max(1,maxHp))}%`);
  el.charAtk && (el.charAtk.textContent = ps.atkLvl + (ps.atkBonus?` (+${ps.atkBonus})`:''));
  el.charStr && (el.charStr.textContent = ps.strLvl + (ps.strBonus?` (+${ps.strBonus})`:''));
  el.charDef && (el.charDef.textContent = ps.defLvl + (ps.defBonus?` (+${ps.defBonus})`:''));
  el.charMaxHit && (el.charMaxHit.textContent = ps.maxHit);
  el.charAcc && (el.charAcc.textContent = mon ? `${Math.round(ps.acc*100)}%` : '—');
  el.charDefBonus && (el.charDefBonus.textContent = `+${ps.defBonus}`);
}

function renderInventory(){
  const entries = Object.entries(state.inventory || {});
  if (!el.inventory) return;

  if (!entries.length){
    el.inventory.innerHTML = '<div class="muted">No items yet. Gather or fight to earn loot.</div>';
    return;
  }

  el.inventory.innerHTML = entries.map(([id, qty])=>{
    const base = String(id).split('@')[0];
    const it   = ITEMS[base] || {};
    const isEquip = it.type === 'equipment';

    const heal  = typeof healAmountFor === 'function' ? healAmountFor(id) : 0;
    const isFood = (it.type === 'food') || (heal > 0);

    // mark raw/cookable items as draggable (for the cooking fire)
    const isCookable = (typeof canCookId === 'function') ? canCookId(base) : false;

    const iconHtml = it.img
      ? `<img src="${it.img}" class="icon-img" alt="">`
      : `<span class="icon">${it.icon || '❔'}</span>`;

    const slotAttrs = [
      `class="inv-slot ${isEquip ? 'equip' : ''}"`,
      `data-id="${id}"`,
      isCookable ? 'draggable="true"' : ''
    ].filter(Boolean).join(' ');

    return `
      <div ${slotAttrs}>
        ${iconHtml}
        ${isFood ? `<button class="use-btn" data-use="${id}" title="Eat">Eat</button>` : ''}
        <button class="sell-btn" data-sell="${id}">Sell</button>
        <span class="qty-badge">${qty}</span>
      </div>
    `;
  }).join('');
}

function renderAction(){
  el.chopBtn.disabled = (!!state.action && state.action.type!=='chop') || !!state.combat;
  el.fishBtn && (el.fishBtn.disabled = (!!state.action && state.action.type!=='fish') || !!state.combat);
  el.mineBtn && (el.mineBtn.disabled = (!!state.action && state.action.type!=='mine') || !!state.combat);
  el.fightBtn.disabled = !!state.combat || (!!state.action && (state.action.type==='chop'||state.action.type==='fish'));
  el.attackTurnBtn.disabled = !state.combat;
  el.fleeBtn.disabled = !state.combat;
  const spot = FISHING_SPOTS?.find(s => s.id === state.selectedSpotId);
  const need = spot?.level || 1;
  const fishLocked = !spot || (lvlOf('fish') < need);
  if (el.fishBtn) el.fishBtn.disabled = fishLocked || (!!state.action && state.action.type!=='fish') || !!state.combat;
}

function renderCookingList(){
  if(!el.cookList) return;
  const raws = Object.keys(COOK_RECIPES).filter(id => (state.inventory[id]||0)>0);
  if(raws.length===0){
    el.cookList.innerHTML = '<div class="muted">No raw ingredients. Try fishing!</div>';
    return;
  }
  el.cookList.innerHTML = raws.map(id=>{
    const it = ITEMS[id];
    const qty = state.inventory[id]||0;
    return `<div class="shop-item">
      <div>
        <div><b>${it.icon||''} ${it.name}</b></div>
        <div class="small muted">You have ${qty}. Cook to create food.</div>
      </div>
      <div class="row">
        <button class="btn-success" data-cook="${id}" data-amt="1">Cook 1</button>
        <button class="btn-success" data-cook="${id}" data-amt="5">Cook 5</button>
        <button class="btn-success" data-cook="${id}" data-amt="-1">Cook All</button>
      </div>
    </div>`;
  }).join('');
}

function renderForgeList(){
  if(!el.forgeList) return;
  const haveBars = state.inventory['bar_copper']||0;
  el.forgeList.innerHTML = FORGE_RECIPES.map(r=>{
    const base = ITEMS[r.id];
    const isEquip = base?.type === 'equipment';
    const statLine = (() => {
      if(!isEquip) return 'Material';
      const parts=[]; if(base.atk) parts.push(`Atk ${base.atk}`); if(base.str) parts.push(`Str ${base.str}`);
      if(base.def) parts.push(`Def ${base.def}`); if(base.hp) parts.push(`HP ${base.hp}`);
      return parts.length ? parts.join(' · ') : 'No bonuses';
    })();
    const disabled = haveBars < r.bars ? 'disabled' : '';
    return `<div class="shop-item">
      <div>
        <div><b>${base?.icon||''} ${base?.name||r.id}</b></div>
        <div class="small muted">Cost: ${r.bars}× Copper Bar · ${statLine}${isEquip?' @ 100%':''}</div>
      </div>
      <div class="row">
        <button class="btn-success" data-forge="${r.id}" ${disabled}>Forge</button>
      </div>
    </div>`;
  }).join('');
}

function renderCombatHud(){
  const maxHp = hpMaxFor(state);
  const curHp = Math.max(0, Math.min(maxHp, state.hpCurrent));
  el.playerHpBar && (el.playerHpBar.style.width = (100*curHp/Math.max(1,maxHp)).toFixed(2)+'%');
  el.playerHpVal && (el.playerHpVal.textContent = `${Math.floor(curHp)}/${maxHp}`);

  if(state.combat){
    const mon = MONSTERS.find(m=>m.id===state.combat.monsterId);
    el.monName.textContent = mon.name;
    el.monHpBar.style.width = (100*state.combat.monHp/(mon.hp||1)).toFixed(2)+'%';
    el.monHpVal.textContent = `${state.combat.monHp}/${mon.hp}`;
  } else {
    el.monName.textContent = '—';
    el.monHpBar.style.width = '0%';
    el.monHpVal.textContent = '0/0';
  }
}

function openSellPopover(anchorEl, id){
  const pop = document.getElementById('popover'); if(!pop) return;
  const base = baseId(id);
  const it = ITEMS[base]||{};
  const have = state.inventory[id]||0;
  const rect = anchorEl.getBoundingClientRect();
  const price = sellPrice(id);

  pop.dataset.itemId = id;
  pop.innerHTML = `
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
  pop.style.left = Math.min(window.innerWidth - 200, rect.left) + 'px';
  pop.style.top = (rect.top - 4 + window.scrollY) + 'px';
  pop.classList.remove('hidden');
}
function closePopover(){ const pop=document.getElementById('popover'); if(pop) pop.classList.add('hidden'); }

// Handle clicks inside the popover
document.getElementById('popover')?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-amt]'); if(!btn) return;
  const pop = document.getElementById('popover'); if(!pop) return;
  const id = pop.dataset.itemId; if(!id) return;

  const have = state.inventory[id]||0; if(have<=0) return;
  let amtAttr = btn.getAttribute('data-amt');
  let n = 0;
  if(amtAttr==='custom'){ const input = pop.querySelector('#sellCustomAmt'); n = Math.floor(+input.value||0); }
  else n = parseInt(amtAttr,10);
  if(n===-1) n = have;
  if(!Number.isFinite(n) || n<=0) return;

  n = Math.min(n, have);
  const value = sellPrice(id) * n;

  removeItem(state, id, n);
  addGold(state, value);

  closePopover(); render(); saveState(state);
});

function baseId(id){ return String(id).split('@')[0]; }
function qualityPct(id){
  const qStr = String(id).split('@')[1];
  const q = parseInt(qStr, 10);
  return Number.isFinite(q) ? Math.max(1, Math.min(100, q)) : 100;
}

function sellPrice(id){
  const base = baseId(id);
  const it = ITEMS[base] || {};
  const qMul = qualityPct(id) / 100;

  let price = it.sell || 0;
  if(it.type === 'equipment'){
    // derive from stats if no explicit price (or to ensure it's not 0)
    const statScore = (it.atk||0) + (it.str||0) + (it.def||0) + 0.5*(it.hp||0);
    const toolBonus = it.speed ? 8*it.speed : 0; // axes/picks etc.
    price = Math.max(price, Math.round(2*statScore + toolBonus));
    price = Math.round(Math.max(1, price) * qMul);
  } else {
    // resources/consumables
    price = Math.max(1, Math.round(price || 1));
  }
  return price;
}

// ---- Skilling Helpers ----
function skillNameFromId(id){
  return ({
    wc: 'Forrestry',
    fish: 'Fishing',
    min: 'Mining',
    craft: 'Crafting',
    atk: 'Attack',
    str: 'Strength',
    def: 'Defense',
  })[id] || id;
}

function xpForSkill(id){
  // be tolerant if some skills aren’t in state yet
  switch(id){
    case 'wc':  return state.wcXp  ?? 0;
    case 'fish':return state.fishXp?? 0;
    case 'cook': return state.cookXp|| 0;
    case 'craft': return state.craftXp || 0;
    case 'min': return state.minXp ?? 0;
    case 'atk': return state.atkXp ?? 0;
    case 'str': return state.strXp ?? 0;
    case 'def': return state.defXp ?? 0;
    default:    return 0;
  }
}

// Skewed upgrade amount: +10–25%, higher levels bias toward 25%
function rollUpgradePercent(lvl){
  // bias: 2.0 (low lvl) -> 0.5 (high lvl); lower bias => larger r
  const bias = clamp(2.0 - 0.02*(lvl-1), 0.5, 2.0);
  const r = Math.pow(Math.random(), bias);         // 0..1
  return 10 + Math.floor(r * 16);                  // 10..25
}

// ---- Cooking Helpers ----
function cookLevel(){ return levelFromXp(state.cookXp || 0, XP_TABLE); }
function cookSpeed(lvl){ return 1 + 0.02 * (lvl - 1); } // +2% speed per level
function setCookPerfectUI(fracStart, fracEnd){
  if (!el.cookPerfectZone) return;
  const left = Math.max(0, Math.min(100, fracStart*100));
  const right= Math.max(0, Math.min(100, fracEnd*100));
  const width = Math.max(0, right - left);
  el.cookPerfectZone.style.left = left + '%';
  el.cookPerfectZone.style.width = width + '%';
}
function cookLog(msg){
  if(!el.cookLog) return;
  const p = document.createElement('p');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.cookLog.appendChild(p);
  el.cookLog.scrollTop = el.cookLog.scrollHeight;
}

// Food helpers
function healAmountFor(id){
  const base = String(id).split('@')[0];
  const def = ITEMS[base] || {};
  return Number.isFinite(def.heal) ? def.heal : 0;
}

function pushAnyLog(msg){
  const target = document.getElementById('combatLog')
             || document.getElementById('fishLog')
             || document.getElementById('log');
  if(!target) return;
  const p = document.createElement('p');
  p.textContent = msg;
  target.appendChild(p);
  target.scrollTop = target.scrollHeight;
}

function eatItem(id){
  const heal = healAmountFor(id);
  if(heal <= 0) return false; // not edible
  const max = hpMaxFor(state);
  if(state.hpCurrent >= max){
    pushAnyLog('You are already at full HP.');
    return false;
  }
  const base = String(id).split('@')[0];
  state.hpCurrent = Math.min(max, state.hpCurrent + heal);
  removeItem(state, id, 1);
  pushAnyLog(`You eat ${ITEMS[base]?.name || base} and heal ${heal} HP.`);
  return true;
}

// Eat food from inventory
el.inventory?.addEventListener('click', (e)=>{
  const useBtn = e.target.closest('button.use-btn');
  if(!useBtn) return;
  const id = useBtn.getAttribute('data-use');
  if(eatItem(id)){ render(); saveState(state); }
});

// Craft upgrade bars: 3x bar_copper -> 1x copper_upgrade_bar (+Smithing XP)
function makeUpgradeBars(count){
  const have = state.inventory['bar_copper']||0;
  const possible = Math.floor(have/3);
  const n = clamp(count, 0, possible);
  if(n<=0) return false;
  removeItem(state, 'bar_copper', 3*n);
  addItem(state, 'copper_upgrade_bar', n);
  state.smithXp = (state.smithXp||0) + 8*n;
  pushSmithLog(`Crafted ${n} Copper Upgrade Bar${n>1?'s':''} (+${8*n} Smithing XP).`);
  return true;
}

// Refresh Smithing panel

function renderSmithing(){
  el.oreCopperCount && (el.oreCopperCount.textContent = state.inventory['ore_copper'] || 0);
  el.copperBarCount && (el.copperBarCount.textContent = state.inventory['bar_copper'] || 0);
  if (el.upgradeBarCount) el.upgradeBarCount.textContent = state.inventory['copper_upgrade_bar'] || 0;

  if (el.smithLabel && (!state.action || state.action.type!=='smith')) el.smithLabel.textContent = 'Idle';

  // Compute your current Smithing level once
const smithLvl = levelFromXp(state.smithXp || 0, XP_TABLE);

if (!el.forgeList) return;
const busy = !!state.action;

el.forgeList.innerHTML = FORGE_RECIPES.map(r=>{
  const haveBars = state.inventory['bar_copper'] || 0; // keep your current key if that's what you use
  const costBars = `${r.bars}× ${ITEMS['bar_copper']?.name || 'Copper Bar'} <span class="muted">(${haveBars})</span>`;

  const extras = r.extras || [];
  const extrasStr = extras.map(ex=>{
    const have = state.inventory[ex.id] || 0;
    const name = ITEMS[ex.id]?.name || ex.id;
    return `${ex.qty}× ${name} <span class="muted">(${have})</span>`;
  }).join(' + ');

  const costStr = extrasStr ? `${costBars} + ${extrasStr}` : costBars;

  // NEW: required level & lock
  const need   = r.level || 1;
  const locked = smithLvl < need;
  const gateNote = locked
    ? ` · <span class="muted">Requires Smithing ${need}</span>`
    : ` · <span class="muted">Req: Smithing ${need}</span>`;

  const xp  = r.xp ?? 0;
  const can = !busy && !locked && canForge(state, r.id);

  return `
    <div class="shop-item">
      <div>
        <div><b>${r.name || r.id}</b></div>
        <div class="small muted">
          Cost: <b>${costStr}</b> · Time: ${(r.time/1000).toFixed(1)}s · XP: ${xp}${gateNote}
        </div>
      </div>
      <div class="row">
        <button class="btn-primary" data-forge="${r.id}" ${can ? '' : 'disabled'} ${locked ? `title="Requires Smithing ${need}"` : ''}>
          Forge
        </button>
      </div>
    </div>
  `;
}).join('');


  if (el.upgradeTarget) {
    const eligible = Object.keys(state.inventory || {}).filter(id=>{
      const [base, qStr] = String(id).split('@');
      const def = ITEMS[base];
      if (!def || def.type!=='equipment') return false;
      if (!base.startsWith('copper_')) return false;
      const q = parseInt(qStr||'0',10) || 0;
      return q < 100;
    });
  
    el.upgradeTarget.innerHTML = eligible.length
      ? eligible.map(id=>{
          const [base, qStr] = id.split('@');
          const name = ITEMS[base]?.name || base;
          const q = parseInt(qStr||'0',10) || 0;
          const qty = state.inventory[id] || 0;
          return `<option value="${id}">${name} — ${q}% · x${qty}</option>`;
        }).join('')
      : `<option value="">— No eligible copper gear —</option>`;
  
    el.applyUpgradeBtn && (el.applyUpgradeBtn.disabled = !eligible.length || (state.inventory['copper_upgrade_bar']||0) <= 0);
  }
}
 // ---- Crafting ---- //

function pushCraftLog(msg){
  // writes into panel and, if you have a global logger, mirrors there too
  if(el.craftLog){
    const p=document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    el.craftLog.appendChild(p); el.craftLog.scrollTop = el.craftLog.scrollHeight;
  }
  if (typeof logEvent === 'function') logEvent('crafting', msg);
  if (typeof renderPanelLogs === 'function') renderPanelLogs();
}

function renderCrafting(){
  if(!el.craftList) return;
  const busy = !!state.action;
  el.craftList.innerHTML = Object.values(CRAFT_RECIPES).map(r=>{
    const haveMax = maxCraftable(state, r.id);
    const can1 = !busy && haveMax >= 1;
    const cost = (r.inputs||[]).map(i=>`${i.qty}× ${ITEMS[i.id]?.name||i.id}`).join(' + ');
    const out  = (r.outputs||[]).map(o=>`${o.qty}× ${ITEMS[o.id]?.name||o.id}`).join(' + ');
    return `
      <div class="shop-item">
        <div>
          <div><b>${r.name}</b></div>
          <div class="small muted">Cost: <b>${cost||'—'}</b> → ${out||'—'} · Time: ${(r.time/1000).toFixed(1)}s</div>
        </div>
        <div class="row">
          <button class="btn-primary" data-craft="${r.id}" data-count="1" ${can1?'':'disabled'}>Make 1</button>
          <button class="btn-primary" data-craft="${r.id}" data-count="${haveMax}" ${(!busy && haveMax>1)?'':'disabled'}>Make All (${haveMax})</button>
        </div>
      </div>`;
  }).join('');
}

el.craftList?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-craft]'); if(!btn) return;
  const id    = btn.dataset.craft;
  const count = Math.max(1, parseInt(btn.dataset.count||'1',10));

  if (!canCraft(state, id, 1)){
    pushCraftLog('Not enough materials.');
    return;
  }

  if (!state.action && startCraft(state, id, count)){
    const r       = CRAFT_RECIPES[id] || {};
    const name    = r.name || id;
    const perXp   = r.xp?.amount || 0;
    const xpSkill = r.xp?.skill || 'craft';
    const totalXp = perXp * count;

    if (el.craftLabel) el.craftLabel.textContent = `Crafting ${name}…`;
    const skillLabel = ({craft:'Crafting', wc:'Woodcutting', fish:'Fishing', min:'Mining', smith:'Smithing',
                         atk:'Attack', str:'Strength', def:'Defense'})[xpSkill] || 'XP';
    const xpText = perXp
      ? ` (+${perXp} ${skillLabel} XP each${count>1?`, +${totalXp} total`:''})`
      : '';

    pushCraftLog(`Started crafting ${name}${count>1?` ×${count}`:''}${xpText}…`);
    saveState(state);
  }
});

// Build tooltip content for any item id (inventory or equipped)
function tipForItem(id){
  const base = String(id||'').split('@')[0];
  const def  = ITEMS[base] || {};
  const isEquip = def.type === 'equipment';

  // quality (equipment only)
  const qStr = String(id||'').split('@')[1];
  const q = (isEquip && Number.isFinite(parseInt(qStr,10)))
    ? Math.max(1, Math.min(100, parseInt(qStr,10)))
    : null;

  const m = q ? q/100 : 1;

  const title = `${def.icon || '❔'} ${def.name || base}`;
  const lines = [];

  if (isEquip){
    if (q != null) lines.push(`Quality: ${q}%`);
    const stats = [];
    if (def.atk) stats.push(`Atk: ${Math.round(def.atk*m)}`);
    if (def.str) stats.push(`Str: ${Math.round(def.str*m)}`);
    if (def.def) stats.push(`Def: ${Math.round(def.def*m)}`);
    if (def.hp)  stats.push(`HP: ${Math.round(def.hp*m)}`);
    if (stats.length) lines.push(stats.join(' · '));
  } else {
    // food/resources
    const heal = healAmountFor(id);
    if (heal > 0) lines.push(`Heals: ${heal} HP`);
    const qty = state.inventory?.[id] || 0;
    if (qty > 0) {
      const each = (typeof sellPrice === 'function') ? sellPrice(id) : (def.sell || 0);
      const total = each * qty;
      lines.push(`Qty: ${qty}${each ? ` · ${each}g ea${qty>1 ? ` · Total: ${total}g` : ''}` : ''}`);
    }
  }

  return { title, body: lines.join('\n') };
}

// Skills hover: show current XP + XP needed for next level
document.querySelector('.skills-grid')?.addEventListener('mousemove', (e)=>{
  const tile = e.target.closest('.skill-tile');
  if(!tile){ hideTip(); return; }
  const id = (tile.id || '').replace('tile-','');
  if(!id){ hideTip(); return; }

  const xp = xpForSkill(id);
  const name = skillNameFromId(id);
  const p = progressFor(xp, XP_TABLE);

  showTip(
    e,
    `${name} — Lvl ${p.lvl}`,
    `${xp.toLocaleString()} XP · ${p.into.toLocaleString()}/${p.span.toLocaleString()} to next `
    + `(${Math.floor(p.pct)}%) · Need: ${p.need.toLocaleString()} XP`
  );
});
document.querySelector('.skills-grid')?.addEventListener('mouseleave', hideTip);

let cookSession = null; // { rawId, baseId, startedAt, duration, pStart, pEnd, level }

function startCookHover(invId){
  const base = String(invId).split('@')[0];
  const rec = COOK_RECIPES[base]; if(!rec) return;
  const lvl = cookLevel();
  const duration = Math.max(400, rec.time / cookSpeed(lvl));  // faster at higher level
  // perfect window widens slightly with level
  const width = Math.min(0.35, 0.12 + lvl * 0.004);           // 12%..35%
  const center = 0.70;                                        // aim around 70%
  const pStart = Math.max(0.08, center - width/2);
  const pEnd   = Math.min(0.98, center + width/2);

  cookSession = { rawId: invId, baseId: base, startedAt: performance.now(), duration, pStart, pEnd, level: lvl };
  if (el.cookHint) el.cookHint.textContent = `Hold over fire… release in the golden zone!`;
  setCookPerfectUI(pStart, pEnd);
}

function finalizeCookHover(asDrop){
  if (!cookSession) { el.cookFire?.classList.remove('dragging'); return; }
  const now  = performance.now();
  const held = now - cookSession.startedAt;
  const frac = held / cookSession.duration;

  const rec = COOK_RECIPES[cookSession.baseId];
  el.cookFire?.classList.remove('dragging');

  if (frac < cookSession.pStart){
    // Too soon: stays raw (no change)
    cookLog(`Too soon! The ${rec.name} is still raw.`);
    if (el.cookHint) el.cookHint.textContent = `Too soon — try again.`;
  } else if (frac <= cookSession.pEnd){
    // Success: consume 1 raw → add cooked, grant XP
    const ok = removeItem(state, cookSession.rawId, 1);
    if (ok !== false){
      addItem(state, rec.cookTo, 1);
      state.cookXp = (state.cookXp||0) + (rec.xp||0);
      cookLog(`Cooked ${ITEMS[rec.cookTo]?.name || rec.cookTo}! +${rec.xp||0} Cooking XP`);
    }
    if (el.cookHint) el.cookHint.textContent = `Nice!`;
  } else {
    // Burnt: consume raw, produce NOTHING
    const ok = removeItem(state, cookSession.rawId, 1);
    if (ok !== false){
      cookLog(`You burnt it… it crumbles to ash.`);
    }
    if (el.cookHint) el.cookHint.textContent = `Too long — it burnt away.`;
  }

  cookSession = null;
  if (el.cookBar) el.cookBar.style.width = '0%';
  renderInventory(); // live update counts
  saveState(state);
}

// --- Events ---
document.addEventListener('click', (e)=>{
  const t = e.target.closest('.tab[data-tab]');
  if(t){ setTab(t.dataset.tab); return; }
});

el.treeSelect?.addEventListener('change', ()=>{ state.selectedTreeId = el.treeSelect.value; saveState(state); });
el.spotSelect?.addEventListener('change', ()=>{ state.selectedSpotId = el.spotSelect.value; saveState(state); });
el.rockSelect?.addEventListener('change', ()=>{ state.selectedRockId = el.rockSelect.value; saveState(state); });

el.chopBtn?.addEventListener('click', ()=>{
  if(state.combat) return;
  const tree = TREES.find(t=>t.id===state.selectedTreeId);
  const need = tree?.level || 1;
  if (!hasLevel('wc', need)){
    if (typeof pushLog === 'function') pushLog(reqText('wc', need));
    return;
  }
  startChop(state);
  if (tree && el.actionLabel) el.actionLabel.textContent = `Chopping ${tree.name}…`;
});

el.fishBtn?.addEventListener('click', ()=>{
  const spot = FISHING_SPOTS.find(s=>s.id===state.selectedSpotId);
  if(!spot) return;
  const need = spot.level || 1;
  if (lvlOf('fish') < need){
    if (typeof appendLog === 'function') appendLog(el.fishLog, `Requires Fishing ${need}.`);
    else if (el.fishLog){ const p=document.createElement('p'); p.textContent=`Requires Fishing ${need}.`; el.fishLog.appendChild(p); }
    return;
  }
  if (typeof startFish === 'function' && !state.action){
    startFish(state);
    if (el.fishLabel) el.fishLabel.textContent = `Fishing ${spot.name}…`;
    saveState(state);
  }
});

el.mineBtn?.addEventListener('click', ()=>{
  if(state.combat) return;
  startMine(state);
  const rock = ROCKS.find(r=>r.id===state.selectedRockId);
  el.mineLabel.textContent = `Mining ${rock.name}…`;
});

// Smelting
el.smeltOneBtn?.addEventListener('click', ()=>{
  const id = el.smeltOneBtn.getAttribute('data-smelt') || 'bar_copper';
  if (!canSmelt(state, id)){
    pushSmithLog(`Not enough ingredients for ${SMELT_RECIPES[id]?.name || id}.`);
    return;
  }
  if (!state.action && startSmelt(state, id)){
    const name = SMELT_RECIPES[id]?.name || id;
    el.smithLabel && (el.smithLabel.textContent = `Smelting ${name}…`);
    pushSmithLog(`Started smelting ${name}…`);
  }
});

// Smelt All
el.smeltAllBtn?.addEventListener('click', ()=>{
  const id = el.smeltAllBtn.getAttribute('data-smelt') || 'bar_copper';
  if (!canSmelt(state, id)){ 
    pushSmithLog(`Not enough ingredients to Smelt All.`); 
    return; 
  }
  state.__smeltAll = id;
  if (!state.action && startSmelt(state, id)){
    const name = SMELT_RECIPES[id]?.name || id;
    el.smithLabel && (el.smithLabel.textContent = `Smelting ${name}…`);
    pushSmithLog(`Smelt All queued for ${name}…`);
  }
});

// Track dragged inventory id (only cookables)
let draggingCookId = null;

el.inventory?.addEventListener('dragstart', (e)=>{
  const tile = e.target.closest('.inv-slot'); if(!tile) return;
  const id = tile.getAttribute('data-id'); if(!id) return;
  const base = String(id).split('@')[0];
  if (!canCookId(base)) return; // let browser cancel non-cookables
  draggingCookId = id;
  e.dataTransfer.setData('text/plain', id);
  e.dataTransfer.effectAllowed = 'move';
});

el.inventory?.addEventListener('dragend', ()=>{
  draggingCookId = null;
});

// Fire drop zone listeners
el.cookFire?.addEventListener('dragover', (e)=>{
  if(!draggingCookId) return;
  e.preventDefault(); // allow drop
  e.dataTransfer.dropEffect = 'move';
});

el.cookFire?.addEventListener('dragenter', (e)=>{
  if(!draggingCookId) return;
  el.cookFire.classList.add('dragging');
  startCookHover(draggingCookId);
});

el.cookFire?.addEventListener('dragleave', (e)=>{
  if(!draggingCookId) return;
  // Leaving the fire finalizes with current held time
  finalizeCookHover(/*asDrop=*/false);
});

el.cookFire?.addEventListener('drop', (e)=>{
  if(!draggingCookId) return;
  e.preventDefault();
  finalizeCookHover(/*asDrop=*/true);
});


// Craft upgrade bars
el.makeUpgradeBarBtn?.addEventListener('click', ()=>{
  makeUpgradeBars(1); render(); saveState(state);
});
el.makeUpgradeBarAllBtn?.addEventListener('click', ()=>{
  const bars = state.inventory['bar_copper']||0;
  makeUpgradeBars(Math.floor(bars/3)); render(); saveState(state);
});

// Apply upgrade
el.applyUpgradeBtn?.addEventListener('click', ()=>{
  const id = el.upgradeTarget?.value;
  if (!id) return;
  if ((state.inventory['copper_upgrade_bar']||0) <= 0){ pushSmithLog?.('You need a Copper Upgrade Bar.'); return; }

  const [base, qStr] = String(id).split('@');
  const def = ITEMS[base];
  if (!def || def.type!=='equipment'){ pushSmithLog?.('Selected item is not upgradable.'); return; }

  const qOld = parseInt(qStr||'0',10) || 0;
  const lvlSmith = levelFromXp(state.smithXp||0, XP_TABLE);
  const add = rollUpgradePercent(lvlSmith);
  const qNew = clamp(qOld + add, 1, 100);

  // consume one bar and the target, add upgraded item back
  removeItem(state, 'copper_upgrade_bar', 1);
  removeItem(state, id, 1);
  addItem(state, `${base}@${qNew}`, 1);

  pushSmithLog?.(`Upgraded ${def.name} from ${qOld}% → ${qNew}% (+${qNew - qOld}%).`);
  saveState(state);
  render(); // ensures counts/select re-populate
});

// Forging listener
el.forgeList?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-forge]'); if(!btn) return;
  const id = btn.dataset.forge;
  const r  = FORGE_RECIPES.find(x=>x.id===id);
  if (!r) return;

  if (!canForge(state, id)){
    if (typeof pushSmithLog === 'function') pushSmithLog('Missing materials.');
    return;
  }
  if (!state.action && startForge(state, id)){
    if (el.smithLabel) el.smithLabel.textContent = `Forging ${r.name || r.id}…`;
    if (typeof pushSmithLog === 'function') pushSmithLog(`Started forging ${r.name || r.id}…`);
    saveState(state);
  }
});

el.fightBtn?.addEventListener('click', ()=>{
  if(state.combat) return;
  beginFight(state, el.monsterSelect.value);
  const mon = MONSTERS.find(m=>m.id===el.monsterSelect.value);
  if(el.combatLog) el.combatLog.innerHTML = '';
  pushCombatLog(`Encounter started with ${mon.name}.`);
  render(); saveState(state);
});

el.attackTurnBtn?.addEventListener('click', ()=>{
  if(!state.combat) return;
  const res = turnFight(state);
  res.log?.forEach(l=>pushCombatLog(l));
  if(res.done){
    if(res.win){
      pushCombatLog(`Victory! XP: +${state.__lastFightXp.atk||0} Atk, +${state.__lastFightXp.str||0} Str, +${state.__lastFightXp.def||0} Def.`);
      if(state.__lastFightLootNames?.length) pushCombatLog(`Loot: ${state.__lastFightLootNames.join(', ')}`);
    } else {
      pushCombatLog('Defeat. You limp away at 1 HP.');
    }
  }
  render(); saveState(state);
});

el.fleeBtn?.addEventListener('click', ()=>{
  if(!state.combat) return;
  const mon = MONSTERS.find(m=>m.id===state.combat.monsterId);
  state.combat = null;
  pushCombatLog(`You fled from ${mon.name}.`);
  render(); saveState(state);
});

el.trainingSelect?.addEventListener('change', ()=>{ state.trainingStyle = el.trainingSelect.value; renderCharacterPanel(); saveState(state); });

el.cookList?.addEventListener('click', (e)=>{
  const btn=e.target.closest('button[data-cook]'); if(!btn) return;
  const id=btn.getAttribute('data-cook'); const amt=+btn.getAttribute('data-amt');
  const have=state.inventory[id]||0;
  const n = amt===-1?have:Math.min(have, amt);
  if(n<=0) return;
  const cooked = cookItems(state, id, n);
  if(cooked>0){ pushLog(`Cooked ${cooked}× ${ITEMS[id].name}.`); render(); saveState(state); }
});

// Inventory interactions: Sell popover + equip on tile click
el.inventory?.addEventListener('click', (e)=>{
  const sellBtn = e.target.closest('button.sell-btn');
  if(sellBtn){
    const id = sellBtn.getAttribute('data-sell');
    openSellPopover(sellBtn, id);
    return;
  }
  const tile = e.target.closest('.inv-slot.equip');
  if(tile){
    const id = tile.getAttribute('data-id');
    const base = (id||'').split('@')[0];
    const it = ITEMS[base];
    if(it?.type==='equipment'){ equipItem(state, id); render(); saveState(state); }
  }
});

// Inventory hover tooltip (name, quality %, stats)
el.inventory?.addEventListener('mousemove', (e)=>{
  const tile = e.target.closest('.inv-slot');
  if (!tile){ hideTip(); return; }
  const id = tile.getAttribute('data-id');
  if (!id){ hideTip(); return; }
  // prevent native title tooltip from fighting ours
  if (tile.hasAttribute('title')) tile.removeAttribute('title');

  const { title, body } = tipForItem(id);
  showTip(e, title, body);
});
el.inventory?.addEventListener('mouseleave', hideTip);

// Tooltip over equipped gear
const equipGrid = document.getElementById('equipmentGrid');
equipGrid?.addEventListener('mousemove', (e)=>{
  const cell = e.target.closest('.equip-cell');
  if (!cell){ hideTip(); return; }
  const slot = cell.getAttribute('data-slot');
  if (!slot){ hideTip(); return; }
  const id = state.equipment?.[slot];
  if (!id){ hideTip(); return; }

  const { title, body } = tipForItem(id);
  showTip(e, title, body);
});
equipGrid?.addEventListener('mouseleave', hideTip);

// Close popover when clicking elsewhere / Esc
document.addEventListener('click', (e)=>{
  const inside = e.target.closest('#popover');
  const isSell = e.target.closest('button.sell-btn');
  if(!inside && !isSell) closePopover();
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closePopover(); });

el.saveBtn?.addEventListener('click', ()=>{ saveState(state); pushLog('Game saved.'); });
el.resetBtn?.addEventListener('click', ()=>{
  if(confirm('Reset your save?')){
    localStorage.removeItem('runecut-save');
    state=defaultState();
    pushLog('Game reset.');
    populate(); render();
  }
});

// Tick: actions + regen
let lastTs = performance.now();
let regenCarry = 0;

function updateBar(barEl, labelEl, verb, pct){
  if (barEl)   barEl.style.width = (pct*100).toFixed(2) + '%';
  if (labelEl) labelEl.textContent = `${verb}… ${Math.round(pct*100)}%`;
}
function resetBar(barEl, labelEl){
  if (barEl)   barEl.style.width = '0%';
  if (labelEl) labelEl.textContent = 'Idle';
}

// Tick: actions + cooking HUD + passive regen
//let lastTs = performance.now();
//let regenCarry = 0;

function tick(){
  const now = performance.now();
  const dt  = (now - lastTs) / 1000;
  lastTs = now;

  const act = state.action;

  // --- Active timed action progress ---
  if (act){
    const pct = Math.max(0, Math.min(1, (now - act.startedAt) / Math.max(1, act.duration)));
    const rem = Math.max(0, act.endsAt - now);

    // Per-action progress UI
    switch (act.type){
      case 'chop':  updateBar(el.actionBar, el.actionLabel, 'Chopping', pct); break;
      case 'fish':  updateBar(el.fishBar,   el.fishLabel,   'Fishing',  pct); break;
      case 'mine':  updateBar(el.mineBar,   el.mineLabel,   'Mining',   pct); break;
      case 'craft': {
        const name = (CRAFT_RECIPES?.[act.key]?.name) || act.key;
        if (el.craftBar)   el.craftBar.style.width = (pct*100).toFixed(2) + '%';
        if (el.craftLabel) el.craftLabel.textContent = pct < 1 ? `Crafting ${name}…` : `Finished ${name}!`;
        break;
      }
      case 'smith': {
        if (el.smithBar) el.smithBar.style.width = (pct*100).toFixed(2) + '%';
        if (el.smithLabel){
          if (act.mode === 'smelt'){
            const name = (SMELT_RECIPES?.[act.key]?.name) || act.key;
            el.smithLabel.textContent = pct < 1 ? `Smelting ${name}…` : `Finished ${name}!`;
          } else {
            const name = (FORGE_RECIPES?.find(r=>r.id===act.key)?.name) || act.key;
            el.smithLabel.textContent = pct < 1 ? `Forging ${name}…` : `Finished ${name}!`;
          }
        }
        break;
      }
    }

    // Complete the action
    if (rem <= 0){
      if (act.type === 'chop'){
        const tree = TREES.find(t=>t.id===act.treeId);
        finishChop(state);
        if (tree) appendLog(el.log, `You chopped ${tree.name} (+1 ${ITEMS[tree.drop].name}, +${tree.xp} WC XP)`);
        resetBar(el.actionBar, el.actionLabel);
        state.action = null;
        render(); saveState(state);
        return requestAnimationFrame(tick);
      }

      if (act.type === 'craft'){
        const name = (CRAFT_RECIPES?.[act.key]?.name) || act.key;
        const out = finishOneCraft(state);
        if (out) pushCraftLog(`Made ${out.name}.`);
      
        state.action = null;
      
        const left = (act.queue||1) - 1;
        if (left > 0 && canCraft(state, act.key, 1)){
          startCraft(state, act.key, left);
        } else if (el.craftBar){
          el.craftBar.style.width = '0%';
          el.craftLabel.textContent = 'Idle';
        }
      
        render(); saveState(state);
        return requestAnimationFrame(tick);
      }

      if (act.type === 'fish'){
        const spot = FISHING_SPOTS?.find(s=>s.id===state.selectedSpotId);
        finishFish(state);
        if (spot){
          const nice = ITEMS[spot.drop]?.name || spot.drop;
          appendLog(el.fishLog, `You caught 1 ${nice}. +${spot.xp} Fishing XP`);
        }
        resetBar(el.fishBar, el.fishLabel);
        state.action = null;
        render(); saveState(state);
        return requestAnimationFrame(tick);
      }

      if (act.type === 'mine'){
        const rock = ROCKS?.find(r=>r.id===state.selectedRockId);
        finishMine(state);
        if (rock){
          const nice = ITEMS[rock.drop]?.name || rock.drop;
          appendLog(el.mineLog, `You mined 1 ${nice}. +${rock.xp} Mining XP`);
        }
        resetBar(el.mineBar, el.mineLabel);
        state.action = null;
        render(); saveState(state);
        return requestAnimationFrame(tick);
      }

      if (act.type === 'smith'){
        const { mode, key } = act;

        if (mode === 'smelt'){
          const r = SMELT_RECIPES[key];
          finishSmelt(state);
          pushSmithLog?.(`Smelted 1 ${r?.name || key}. +${r?.xp || 0} Smithing XP`);
        } else {
          const rec = FORGE_RECIPES.find(r=>r.id===key);
          const res = finishForge(state); // { outId, q } for gear; undefined for materials
          if (rec?.kind === 'material'){
            pushSmithLog?.(`Forged 1 ${rec?.name || key}. +${rec?.xp || 0} Smithing XP`);
          } else {
            const q = res?.q ?? (()=>{
              const at = String(res?.outId||'').split('@')[1];
              return at ? parseInt(at,10) : null;
            })();
            pushSmithLog?.(`Forged ${rec?.name || key}${q!=null ? ` (${q}% quality)` : ''}. +${rec?.xp || 0} Smithing XP`);
          }
        }

        state.action = null;

        // Continue "Smelt All" if queued
        if (mode === 'smelt' && state.__smeltAll === key && canSmelt(state, key)){
          startSmelt(state, key);
        } else if (mode === 'smelt') {
          state.__smeltAll = null;
          // optionally clear the smith bar immediately
          if (el.smithBar) el.smithBar.style.width = '0%';
          if (el.smithLabel) el.smithLabel.textContent = 'Idle';
        }

        render(); saveState(state);
        return requestAnimationFrame(tick);
      }
    }
  }

  // --- Cooking hover HUD runs every frame (independent of actions) ---
  if (cookSession && el.cookBar){
    const frac = Math.max(0, Math.min(1.15, (now - cookSession.startedAt) / cookSession.duration));
    el.cookBar.style.width = (frac * 100).toFixed(2) + '%';
    if (el.cookHint){
      if (frac > cookSession.pEnd) el.cookHint.textContent = 'Careful — burning!';
      else if (frac >= cookSession.pStart) el.cookHint.textContent = 'Release now!';
      else el.cookHint.textContent = 'Heating…';
    }
  }

  // --- Passive HP regen when not in combat ---
  if (!state.combat){
    const maxHp = hpMaxFor(state);
    if (state.hpCurrent < maxHp){
      regenCarry += dt;
      const rate = 0.5; // HP per second
      const whole = Math.floor(regenCarry * rate);
      if (whole > 0){
        state.hpCurrent = Math.min(maxHp, state.hpCurrent + whole);
        regenCarry -= whole / rate;
        renderCharacterPanel();
        renderCombatHud();
      }
    }
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

populate();
renderForgeList();
setTab('forests');
render();
setInterval(()=>saveState(state), 30_000);
requestAnimationFrame(tick);
