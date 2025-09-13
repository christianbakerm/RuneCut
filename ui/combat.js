// /ui/combat.js
import { state, saveState } from '../systems/state.js';
import { MONSTERS } from '../data/monsters.js';
import { beginFight, turnFight, hpMaxFor, derivePlayerStats } from '../systems/combat.js';
import { qs, on } from '../utils/dom.js';
import { pushCombatLog, renderPanelLogs } from './logs.js';
import { renderInventory } from './inventory.js';
import { renderEquipment } from './equipment.js';
import { renderSkills } from './skills.js';
import { ensureMana, manaMaxFor, startManaRegen } from '../systems/mana.js';
import { ITEMS } from '../data/items.js';

const el = {
  monsterSelect:  qs('#monsterSelect'),
  trainingSelect: qs('#trainingSelect'),
  fightBtn:       qs('#fightBtn'),
  attackBtn:      qs('#attackTurnBtn'),
  fleeBtn:        qs('#fleeBtn'),

  // Monster card
  monImg:         qs('#monsterImg'),
  monNameCard:    qs('#monsterCardName'),
  monLvlCard:     qs('#monsterCardLevel'),
  monStatsCard:   qs('#monsterCardStats'),

  // HUD
  playerHpBar:    qs('#playerHpBar'),
  playerHpVal:    qs('#playerHpVal'),
  playerManaBar:  qs('#playerManaBar'),
  playerManaVal:  qs('#playerManaVal'),
  monHpBar:       qs('#monHpBar'),
  monHpVal:       qs('#monHpVal'),
  monNameHud:     qs('#monName'),
};

// ----- cooldown control -----
const ATK_COOLDOWN_MS = 500;
let atkCooldownUntil = 0;
const nowMs = () => performance.now();

// ----- micro-anim helpers -----
function pulse(el, cls, ms=300){
  if(!el) return;
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls), ms);
}

// Big floating numbers (relies on CSS for .floating-dmg, .dealt, .taken, .crit, .miss, .block)
function bubbleDamage(anchorBarEl, amount, kind='dealt', {crit=false, slam=false, text=null} = {}){
  if (!anchorBarEl) return;

  // Prefer the element *outside* the .progress pill to avoid clipping.
  const progress = anchorBarEl.closest('.progress');
  let host = progress?.parentElement || anchorBarEl.parentElement || anchorBarEl;

  // Ensure the host can position children absolutely and isn't clipped.
  const cs = host ? getComputedStyle(host) : null;
  if (host && cs && cs.position === 'static') host.style.position = 'relative';
  // If the host itself clips, try one more level up.
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

function currentMonster(){
  const id = state.selectedMonsterId || el.monsterSelect?.value;
  return MONSTERS.find(m=>m.id===id) || MONSTERS[0] || null;
}

function setBar(bar, label, cur, max){
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round(100*cur/max))) : 0;
  if (bar)   bar.style.width = pct + '%';
  if (label) label.textContent = `${cur}/${max}`;
}

function ensureSelection(){
  if (!el.monsterSelect) return;
  el.monsterSelect.innerHTML = (MONSTERS||[]).map(m=>
    `<option value="${m.id}">${m.name} (Lv ${m.level ?? 1})</option>`
  ).join('');
  const want = state.selectedMonsterId || (MONSTERS[0]?.id);
  el.monsterSelect.value = want;
  state.selectedMonsterId = el.monsterSelect.value;
}

function paintMonsterCard(mon){
  if (!mon) return;
  if (el.monImg)  { el.monImg.src = mon.img || ''; el.monImg.alt = mon.name || mon.id; }
  if (el.monNameCard) el.monNameCard.textContent = mon.name || mon.id;
  if (el.monLvlCard)  el.monLvlCard.textContent  = String(mon.level ?? 1);

  const statsBits = [];
  if (Number.isFinite(mon.hp))      statsBits.push(`HP ${mon.hp}`);
  if (Number.isFinite(mon.attack))  statsBits.push(`Atk ${mon.attack}`);
  if (Number.isFinite(mon.defense)) statsBits.push(`Def ${mon.defense}`);
  if (Number.isFinite(mon.maxHit))  statsBits.push(`Max ${mon.maxHit}`);
  el.monStatsCard && (el.monStatsCard.textContent = statsBits.join(' · ') || '—');
}

function paintHud(){
  // Player
  const maxHp = hpMaxFor(state);
  if (state.hpCurrent == null) state.hpCurrent = maxHp;
  const curHp = Math.max(0, Math.min(maxHp, state.hpCurrent));
  setBar(el.playerHpBar, el.playerHpVal, curHp, maxHp);
  ensureMana(state);
  const maxMp = manaMaxFor(state);
  const curMp = Math.max(0, Math.min(maxMp, state.manaCurrent));
  setBar(el.playerManaBar, el.playerManaVal, curMp, maxMp);

  // Monster (selected or active)
  const active = state.combat;
  const mon = active ? MONSTERS.find(m=>m.id===active.monsterId) : currentMonster();

  const monMax = active ? (mon?.hp ?? 20) : (mon?.hp ?? 0);
  const monCur = active ? Math.max(0, state.combat.monHp) : monMax;
  setBar(el.monHpBar, el.monHpVal, monCur, monMax);
  if (el.monNameHud) el.monNameHud.textContent = mon?.name || '—';

  // Buttons
  const inFight = !!state.combat;
  const inCooldown = nowMs() < atkCooldownUntil;
  if (el.fightBtn)  el.fightBtn.disabled  = inFight || !mon;
  if (el.attackBtn) {
    // Delegate enable/disable to the eat-button logic only
    updateEatBtn();
  }
  if (el.fleeBtn)   el.fleeBtn.disabled   = !inFight;
}

function paintCharVsSelected(){
  const mon = currentMonster();
  const ps = derivePlayerStats(state, mon);
  const accEl = qs('#charAcc');
  if (accEl && ps?.acc != null) accEl.textContent = `${Math.round(ps.acc*100)}%`;
}

export function renderCombat(){
  ensureSelection();
  const mon = currentMonster();
  ensureMana(state);
  startManaRegen(state, ()=>{
    saveState(state);
    const maxMp = manaMaxFor(state);
    setBar(el.playerManaBar, el.playerManaVal, state.manaCurrent, maxMp);
  });
  paintMonsterCard(mon);
  paintHud();
  paintCharVsSelected();
}

/* ---------- Auto-fight loop ---------- */
let fightLoop = null;
function stopFightLoop(){
  if (fightLoop) { clearInterval(fightLoop); fightLoop = null; }
}

// Parse & apply FX for a single turn’s log lines
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
    pulse(el.monHpBar, 'flash-dmg', 350);
    pulse(el.monImg, 'shake', 250);
    bubbleDamage(el.monHpBar, dmgMon, 'dealt', { crit });
  } else if (youMissLine){
    bubbleDamage(el.monHpBar, 0, 'miss', { text:'Miss' });
  } else if (monBlockLn){
    bubbleDamage(el.monHpBar, 0, 'block', { text:'Block' });
  }

  // You take damage from enemy
  if (dmgYou != null){
    const crit = hasCrit(monHitLine);
    pulse(el.playerHpBar, 'flash-dmg', 350);
    bubbleDamage(el.playerHpBar, dmgYou, 'taken', { crit, slam:true });
  } else if (monMissLine){
    bubbleDamage(el.playerHpBar, 0, 'miss', { text:'Miss' });
  } else if (youBlockLn){
    bubbleDamage(el.playerHpBar, 0, 'block', { text:'Block' });
  }
}

// Runs one combat turn: logs, FX, HUD, end handling. Returns result from turnFight.
function runCombatTurn(){
  const result = turnFight(state);
  const logs = result?.log || [];
  logs.forEach(line => pushCombatLog(line));
  applyTurnFx(logs);

  // Apply cooldown immediately
  atkCooldownUntil = nowMs() + ATK_COOLDOWN_MS;

  renderCombat();
  renderEquipment();
  renderPanelLogs();

  if (result?.done){
    if (result.win){
      const xp = result.xp || { atk:0, str:0, def:0 };
      const loot = result.loot || [];
      pushCombatLog(`Victory! XP — Atk +${xp.atk||0}, Str +${xp.str||0}, Def +${xp.def||0}.`);
      if (loot.length) pushCombatLog(`Loot: ${loot.join(', ')}`);
    } else {
      pushCombatLog(`You were defeated.`);
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

/* ----------------- Eating ----------------- */
function healAmountForBase(base){
  const def = ITEMS[base] || {};
  return Number.isFinite(def.heal) ? def.heal : 0;
}

function eatFromFoodSlot(){
  const eq   = state.equipment || {};
  const base = eq.food;
  const qty  = Math.max(0, eq.foodQty|0);
  if (!base || qty <= 0) return;

  const heal = healAmountForBase(base);
  if (heal <= 0) return;

  const max = hpMaxFor(state);
  const before = Math.max(0, Math.min(max, state.hpCurrent ?? max));
  if (before >= max) return; // no overheal

  const after = Math.min(max, before + heal);
  state.hpCurrent = after;

  eq.foodQty = qty - 1;
  if (eq.foodQty <= 0) { eq.food = ''; }

  // Log + repaint
  try {
    const name = (ITEMS[base]?.name) || base;
    pushCombatLog(`You eat ${name} and heal ${after - before} HP.`);
    renderPanelLogs?.();
  } catch {}

  renderEquipment();
  renderInventory?.();
  saveState(state);

  // notify other UIs
  window.dispatchEvent(new Event('hp:change'));
  window.dispatchEvent(new Event('food:change'));
}

function updateEatBtn(){
  const btn = el.attackBtn; if (!btn) return;
  const eq   = state.equipment || {};
  const base = eq.food;
  const qty  = Math.max(0, eq.foodQty|0);
  const heal = base ? healAmountForBase(base) : 0;
  const max  = hpMaxFor(state);
  const cur  = Math.max(0, Math.min(max, state.hpCurrent ?? max));

  btn.textContent = qty > 0 ? `Eat (×${qty})` : 'Eat';
  btn.title = 'Eat one from your equipped food stack';
  const disabled = !(qty > 0 && heal > 0 && cur < max);
  btn.disabled = disabled;
  btn.classList.toggle('disabled', disabled);
}


/* ----------------- Wiring ----------------- */

on(document, 'change', '#monsterSelect', ()=>{
  state.selectedMonsterId = el.monsterSelect.value;
  saveState(state);
  renderCombat();
  renderEquipment(); // keep "Accuracy vs Selected" pill fresh
});

on(document, 'change', '#trainingSelect', ()=>{
  state.trainingStyle = el.trainingSelect.value || 'shared';
  saveState(state);
  pushCombatLog?.(`Training style set to ${state.trainingStyle}.`);
  renderPanelLogs();
});

el.fightBtn?.addEventListener('click', ()=>{
  const mon = currentMonster();
  if (!mon || state.combat) return;
  beginFight(state, mon.id);
  pushCombatLog?.(`You engage ${mon.name}!`);
  saveState(state);
  renderCombat();
  renderPanelLogs();
  renderEquipment();
  startFightLoop(); // ⟵ start auto-attacks every 0.5s
});

// Change label immediately
if (el.attackBtn) {
  el.attackBtn.textContent = 'Eat';
  el.attackBtn.title = 'Eat one from your equipped food stack';
}

el.attackBtn?.addEventListener('click', (e)=>{
  e.preventDefault();
  eatFromFoodSlot();
});

window.addEventListener('hp:change',   updateEatBtn);
window.addEventListener('food:change', updateEatBtn);
document.addEventListener('DOMContentLoaded', updateEatBtn);
updateEatBtn();


el.fleeBtn?.addEventListener('click', ()=>{
  if (!state.combat) return;
  const mon = MONSTERS.find(m=>m.id===state.combat.monsterId);
  pushCombatLog?.(`You fled from ${mon?.name || state.combat.monsterId}.`);
  state.combat = null;
  saveState(state);
  stopFightLoop();
  renderCombat();
  renderEquipment();
  renderPanelLogs();
});
