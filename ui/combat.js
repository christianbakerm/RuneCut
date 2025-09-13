// /ui/combat.js
import { state, saveState } from '../systems/state.js';
import { MONSTERS } from '../data/monsters.js';
import { beginFight, turnFight, hpMaxFor, derivePlayerStats } from '../systems/combat.js';
import { qs, on } from '../utils/dom.js';
import { renderInventory } from './inventory.js';
import { renderEquipment } from './equipment.js';
import { renderSkills } from './skills.js';
import { ensureMana, manaMaxFor, startManaRegen } from '../systems/mana.js';
import { ITEMS } from '../data/items.js'; // for food heal values

const overlayEls = {
  overlay:       qs('#combatOverlay'),
  close:         qs('#closeCombat'),

  // Actions (no "-Overlay" suffix in HTML)
  fightBtn:      qs('#fightBtn'),
  eatBtn:        qs('#attackTurnBtn'), // repurposed "Attack" button to Eat
  fleeBtn:       qs('#fleeBtn'),
  training:      qs('#trainingSelect'),

  // Log
  log:           qs('#combatLog'),

  // Monster card
  monImg:        qs('#monsterImg'),
  monName:       qs('#monsterCardName'),
  monLvl:        qs('#monsterCardLevel'),
  monStats:      qs('#monsterCardStats'),

  // HUD
  playerHpBar:   qs('#playerHpBar'),
  playerHpVal:   qs('#playerHpVal'),
  playerManaBar: qs('#playerManaBar'),
  playerManaVal: qs('#playerManaVal'),
  monHpBar:      qs('#monHpBar'),
  monHpVal:      qs('#monHpVal'),
  monNameHud:    qs('#monName'),
};

// ----- cooldown control for combat turns (unchanged) -----
const ATK_COOLDOWN_MS = 500;
let atkCooldownUntil = 0;
const nowMs = () => performance.now();

// ----- micro-anim helpers -----
function pulse(el, cls, ms=300){
  if(!el) return;
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls), ms);
}

// Floating numbers
function bubbleDamage(anchorBarEl, amount, kind='dealt', {crit=false, slam=false, text=null} = {}){
  if (!anchorBarEl) return;
  const progress = anchorBarEl.closest('.progress');
  let host = progress?.parentElement || anchorBarEl.parentElement || anchorBarEl;

  const cs = host ? getComputedStyle(host) : null;
  if (host && cs && cs.position === 'static') host.style.position = 'relative';
  if (host && cs && (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden')) {
    host = host.parentElement || host;
    const cs2 = getComputedStyle(host);
    if (cs2.position === 'static') host.style.position = 'relative';
  }

  const d = document.createElement('div');
  d.className = `floating-dmg ${kind}${crit ? ' crit' : ''}${slam ? ' slam' : ''}`;
  d.textContent = text ?? `-${amount}`;
  host.appendChild(d);
  d.addEventListener('animationend', ()=> d.remove(), { once:true });
}

// Small helper for healing bubbles
function bubbleHeal(anchorBarEl, amount){
  bubbleDamage(anchorBarEl, amount, 'heal', { text: `+${amount}` });
}

function currentMonster(){
  const id = state.selectedMonsterId;
  return MONSTERS.find(m=>m.id===id) || MONSTERS[0] || null;
}

function setBar(bar, label, cur, max){
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round(100*cur/max))) : 0;
  if (bar)   bar.style.width = pct + '%';
  if (label) label.textContent = `${cur}/${max}`;
}

/* ---------------- Eating helpers ---------------- */
function healAmountForBase(baseId){
  const def = ITEMS[baseId] || {};
  return Number.isFinite(def.heal) ? def.heal : 0;
}

function canEat(){
  const slots = state.equipment || {};
  const base  = slots.food;
  const qty   = Math.max(0, slots.foodQty|0);
  if (!base || qty <= 0) return false;
  const heal = healAmountForBase(base);
  if (heal <= 0) return false;
  const max = hpMaxFor(state);
  return (state.hpCurrent ?? max) < max;
}

function doEatOnce(){
  const slots = state.equipment || {};
  const base  = slots.food;
  let qty     = Math.max(0, slots.foodQty|0);
  if (!base || qty <= 0) return false;

  const heal = healAmountForBase(base);
  if (heal <= 0) return false;

  const max = hpMaxFor(state);
  const cur = state.hpCurrent == null ? max : state.hpCurrent;
  if (cur >= max) return false;

  const def = ITEMS[base] || {};
  const name = def.name || base;

  const healed = Math.min(heal, max - cur);
  state.hpCurrent = Math.min(max, cur + heal);
  qty -= 1;
  slots.foodQty = Math.max(0, qty);
  if (slots.foodQty === 0){
    slots.food = '';
  }

  // FX + log
  pulse(overlayEls.playerHpBar, 'flash-heal', 350);
  bubbleHeal(overlayEls.playerHpBar, healed);
  if (overlayEls.log){
    const line = document.createElement('div');
    line.textContent = `You eat ${name} and heal ${healed} HP.`;
    overlayEls.log.appendChild(line);
    overlayEls.log.scrollTop = overlayEls.log.scrollHeight;
  }

  // Broadcast & UI refresh
  try { window.dispatchEvent(new Event('hp:change')); } catch {}
  try { window.dispatchEvent(new Event('food:change')); } catch {}
  renderEquipment();
  renderCombat();
  saveState(state);
  return true;
}

/* ---------------- HUD paint ---------------- */
function paintHud(){
  // Player
  const maxHp = hpMaxFor(state);
  if (state.hpCurrent == null) state.hpCurrent = maxHp;
  const curHp = Math.max(0, Math.min(maxHp, state.hpCurrent));
  setBar(overlayEls.playerHpBar, overlayEls.playerHpVal, curHp, maxHp);

  ensureMana(state);
  const maxMp = manaMaxFor(state);
  const curMp = Math.max(0, Math.min(maxMp, state.manaCurrent));
  setBar(overlayEls.playerManaBar, overlayEls.playerManaVal, curMp, maxMp);

  // Monster (selected or active)
  const active = state.combat;
  const mon = active ? MONSTERS.find(m=>m.id===active.monsterId) : currentMonster();
  const monMax = active ? (mon?.hp ?? 20) : (mon?.hp ?? 0);
  const monCur = active ? Math.max(0, state.combat.monHp) : monMax;
  setBar(overlayEls.monHpBar, overlayEls.monHpVal, monCur, monMax);
  if (overlayEls.monNameHud) overlayEls.monNameHud.textContent = mon?.name || '—';

  // Buttons
  const inFight = !!state.combat;

  // Start Fight is disabled in-fight or if no monster
  if (overlayEls.fightBtn)  overlayEls.fightBtn.disabled  = inFight || !mon;

  // Eat button: enable when canEat(), regardless of combat cooldowns
  if (overlayEls.eatBtn){
    overlayEls.eatBtn.disabled = !canEat();
    overlayEls.eatBtn.classList.toggle('cooldown', false);
    overlayEls.eatBtn.setAttribute('title', canEat() ? 'Eat food to heal' : 'Nothing to eat or HP is full');
  }

  // Flee only enabled during a fight
  if (overlayEls.fleeBtn)   overlayEls.fleeBtn.disabled   = !inFight;
}

function paintMonsterCard(mon){
  if (!mon) return;
  if (overlayEls.monImg)  { overlayEls.monImg.src = mon.img || ''; overlayEls.monImg.alt = mon.name || mon.id; }
  if (overlayEls.monName) overlayEls.monName.textContent = mon.name || mon.id;
  if (overlayEls.monLvl)  overlayEls.monLvl.textContent  = String(mon.level ?? 1);

  const statsBits = [];
  if (Number.isFinite(mon.hp))      statsBits.push(`HP ${mon.hp}`);
  if (Number.isFinite(mon.attack))  statsBits.push(`Atk ${mon.attack}`);
  if (Number.isFinite(mon.defense)) statsBits.push(`Def ${mon.defense}`);
  if (Number.isFinite(mon.maxHit))  statsBits.push(`Max ${mon.maxHit}`);
  if (overlayEls.monStats) overlayEls.monStats.textContent = statsBits.join(' · ') || '—';
}

export function renderCombat(){
  ensureMana(state);
  startManaRegen(state, ()=>{
    saveState(state);
    const maxMp = manaMaxFor(state);
    setBar(overlayEls.playerManaBar, overlayEls.playerManaVal, state.manaCurrent, maxMp);
  });
  paintHud();
}

/* ---------- Auto-fight loop (unchanged) ---------- */
let fightLoop = null;
function stopFightLoop(){
  if (fightLoop) { clearInterval(fightLoop); fightLoop = null; }
}

function applyTurnFx(logs){
  const parseDamage = (line)=> {
    const m = /for\s+(\d+)/i.exec(line||'');
    return m ? parseInt(m[1],10) : null;
  };
  const hasCrit = (s='') => /\bcrit/i.test(s) || /\bcritical\b/i.test(s);

  const youHitLine  = logs.find(l => l.startsWith('You hit '));
  const monHitLine  = logs.find(l => /\bhits you for\b/i.test(l));
  const youMissLine = logs.find(l => /\byou miss\b/i.test(l));
  const monMissLine = logs.find(l => /misses you\b/i.test(l));
  const youBlockLn  = logs.find(l => /\byou block\b/i.test(l));
  const monBlockLn  = logs.find(l => /\bblocks your\b/i.test(l));

  const dmgMon = parseDamage(youHitLine);
  const dmgYou = parseDamage(monHitLine);

  // Enemy takes damage from you
  if (dmgMon != null){
    const crit = hasCrit(youHitLine);
    pulse(overlayEls.monHpBar, 'flash-dmg', 350);
    bubbleDamage(overlayEls.monHpBar, dmgMon, 'dealt', { crit });
  } else if (youMissLine){
    bubbleDamage(overlayEls.monHpBar, 0, 'miss', { text:'Miss' });
  } else if (monBlockLn){
    bubbleDamage(overlayEls.monHpBar, 0, 'block', { text:'Block' });
  }

  // You take damage from enemy
  if (dmgYou != null){
    const crit = hasCrit(monHitLine);
    pulse(overlayEls.playerHpBar, 'flash-dmg', 350);
    bubbleDamage(overlayEls.playerHpBar, dmgYou, 'taken', { crit, slam:true });
  } else if (monMissLine){
    bubbleDamage(overlayEls.playerHpBar, 0, 'miss', { text:'Miss' });
  } else if (youBlockLn){
    bubbleDamage(overlayEls.playerHpBar, 0, 'block', { text:'Block' });
  }
}

// Runs one combat turn: logs, FX, HUD, end handling. Returns result from turnFight.
function runCombatTurn(){
  const result = turnFight(state);
  const logs = result?.log || [];

  logs.forEach(line => {
    const div = document.createElement('div');
    div.textContent = line;
    overlayEls.log.appendChild(div);
    overlayEls.log.scrollTop = overlayEls.log.scrollHeight;
  });
  applyTurnFx(logs);

  // Apply cooldown immediately
  atkCooldownUntil = nowMs() + ATK_COOLDOWN_MS;

  renderCombat();
  renderEquipment();

  if (result?.done){
    if (result.win){
      const xp = result.xp || { atk:0, str:0, def:0 };
      const loot = result.loot || [];
      overlayEls.log.appendChild(Object.assign(document.createElement('div'),{
        textContent: `Victory! XP — Atk +${xp.atk||0}, Str +${xp.str||0}, Def +${xp.def||0}.`
      }));
      if (loot.length) overlayEls.log.appendChild(Object.assign(document.createElement('div'),{
        textContent: `Loot: ${loot.join(', ')}`
      }));
    } else {
      overlayEls.log.appendChild(Object.assign(document.createElement('div'),{textContent: `You were defeated.`}));
    }
    saveState(state);
    renderInventory();
    renderEquipment();
    renderSkills();
  } else {
    saveState(state);
  }

  return result;
}

function startFightLoop(){
  stopFightLoop();
  fightLoop = setInterval(()=>{
    if (!state.combat) { stopFightLoop(); return; }
    if (nowMs() < atkCooldownUntil) return; // respect cooldown
    const res = runCombatTurn();
    if (res?.done) stopFightLoop();
  }, ATK_COOLDOWN_MS);
}

/* ----------------- Overlay Control ----------------- */
function openCombat(mon){
  if (!overlayEls.overlay) return;

  // Select & paint monster
  state.selectedMonsterId = mon.id;
  saveState(state);

  paintMonsterCard(mon);

  // Sync training style UI
  if (overlayEls.training) {
    overlayEls.training.value = state.trainingStyle || 'shared';
  }

  // Clear log and show
  if (overlayEls.log) overlayEls.log.innerHTML = '';

  overlayEls.overlay.classList.remove('hidden');
  renderCombat();
}

function closeCombat(){
  overlayEls.overlay?.classList.add('hidden');
  state.combat = null;
  saveState(state);
  stopFightLoop();
}

// Close button
overlayEls.close?.addEventListener('click', closeCombat);

// Backdrop click (don’t close when clicking inside the box)
overlayEls.overlay?.addEventListener('click', (e)=>{
  if (e.target === overlayEls.overlay) closeCombat();
});

// ESC to close
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && !overlayEls.overlay.classList.contains('hidden')) closeCombat();
});

// Training style
overlayEls.training?.addEventListener('change', ()=>{
  state.trainingStyle = overlayEls.training.value || 'shared';
  saveState(state);
});

/* ----------------- Buttons ----------------- */
overlayEls.fightBtn?.addEventListener('click', ()=>{
  const mon = currentMonster();
  if (!mon || state.combat) return;
  beginFight(state, mon.id);
  overlayEls.log.appendChild(Object.assign(document.createElement('div'),{textContent:`You engage ${mon.name}!`}));
  saveState(state);
  renderCombat();
  renderEquipment();
  startFightLoop(); // auto-attacks every 0.5s
});

// Eat button (formerly Attack)
overlayEls.eatBtn?.addEventListener('click', ()=>{
  // Eating is allowed both in and out of combat as long as canEat() is true
  if (!canEat()) return;
  doEatOnce();
});

// Flee
overlayEls.fleeBtn?.addEventListener('click', ()=>{
  if (!state.combat) return;
  const mon = MONSTERS.find(m=>m.id===state.combat.monsterId);
  overlayEls.log.appendChild(Object.assign(document.createElement('div'),{textContent:`You fled from ${mon?.name || state.combat.monsterId}.`}));
  closeCombat();
});

/* ----------------- Monster Grid & Zones ----------------- */
function renderMonsterGrid(zone) {
  const grid = document.querySelector('#monsterGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const monsters = MONSTERS.filter(m => m.zone === zone);
  monsters.forEach(mon => {
    const card = document.createElement('div');
    card.className = 'monster-choice';
    card.dataset.id = mon.id;
    card.innerHTML = `
      <img src="${mon.img || ''}" alt="${mon.name}">
      <div class="title">${mon.name}</div>
      <div class="muted">Lv ${mon.level}</div>
    `;
    card.addEventListener('click', ()=> openCombat(mon));
    grid.appendChild(card);
  });
}

function setupZones() {
  const map = document.querySelector('#combatMap');
  if (!map) return;
  map.querySelectorAll('.zone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      map.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMonsterGrid(btn.dataset.zone);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupZones();
  const firstZone = document.querySelector('.zone-btn')?.dataset.zone;
  if (firstZone) renderMonsterGrid(firstZone);
});
