// systems/combat.js (buffed scaling, quality-aware gear)
import { MONSTERS } from '../data/monsters.js';
import { addItem, addGold } from './inventory.js';
import { XP_TABLE, levelFromXp } from './xp.js';
import { ITEMS } from '../data/items.js';

// --- Tuning knobs (edit to taste) ---
const BALANCE = {
  // Player ratings
  atkLevelWeight: 3.0,   // how much Attack level feeds accuracy
  atkGearWeight:  2.5,   // how much +Atk gear feeds accuracy
  strLevelWeight: 0.75,  // how much Strength level feeds max hit
  strGearWeight:  1.00,  // how much +Str gear feeds max hit

  // Accuracy curves
  accBase:   0.15,       // flat base hit chance
  accScale:  0.80,       // portion driven by ratings vs target

  // Defense vs monsters
  defLevelWeight: 1.4,   // how much Defense level resists monsters
  defGearWeight:  2.2,   // how much +Def gear resists monsters
  monAccBase:  0.05,     // monster base hit chance
  monAccScale: 0.90,     // monster accuracy scaling

  // HP
  hpBase: 30,
  hpLevelPerDef: 2.5,
  hpGearWeight: 2.0,

  // Minor extra tie-in: a bit of Attack into max hit
  maxHitAtkWeight: 0.2,

  // Damage mitigation from your defense gear (per point)
  dmgMitigationPerDef: 0.15
};

function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

// Quality-aware equipment stat sum (supports ids like "copper_plate@87")
function sumEquip(state, key){
  let total = 0;
  for(const id of Object.values(state.equipment||{})){
    if(!id) continue;
    const [base, qStr] = String(id).split('@');
    const it = ITEMS[base]; if(!it) continue;
    const mult = qStr ? clamp(parseInt(qStr,10)/100, 0.01, 2) : 1; // 1–100% => 0.01–1.00
    total += Math.round((it[key]||0) * mult);
  }
  return total;
}

export function hpMaxFor(state){
  const defLvl = levelFromXp(state.defXp, XP_TABLE);
  const hpGear = sumEquip(state, 'hp');
  return Math.floor(
    BALANCE.hpBase +
    defLvl * BALANCE.hpLevelPerDef +
    hpGear * BALANCE.hpGearWeight
  );
}

export function derivePlayerStats(state, mon){
  const atkLvl = levelFromXp(state.atkXp, XP_TABLE);
  const strLvl = levelFromXp(state.strXp, XP_TABLE);
  const defLvl = levelFromXp(state.defXp, XP_TABLE);

  const atkBonus = sumEquip(state,'atk');
  const strBonus = sumEquip(state,'str');
  const defBonus = sumEquip(state,'def');

  // Ratings (bigger numbers = stronger effect)
  const atkRating = atkLvl*BALANCE.atkLevelWeight + atkBonus*BALANCE.atkGearWeight;
  const defRating = defLvl*BALANCE.defLevelWeight + defBonus*BALANCE.defGearWeight;
  const strRating = strLvl*BALANCE.strLevelWeight + strBonus*BALANCE.strGearWeight;

  // Accuracy vs selected monster
  const targetDef = (mon?.defense ?? mon?.level ?? 1) * 1.3 + 10;
  const acc = clamp(BALANCE.accBase + (atkRating/(atkRating + targetDef))*BALANCE.accScale, 0.05, 0.95);

  // Max hit — now strongly driven by Strength gear & level
  const maxHit = Math.max(1, Math.floor(1 + strRating + atkLvl*BALANCE.maxHitAtkWeight));

  return { atkLvl, strLvl, defLvl, atkBonus, strBonus, defBonus, maxHit, acc, atkRating, defRating, strRating };
}

export function beginFight(state, monsterId){
  if(state.combat) return;
  const mon = MONSTERS.find(m=>m.id===monsterId);
  if(!mon) return;
  const mx = hpMaxFor(state);
  if(state.hpCurrent==null) state.hpCurrent = mx; else state.hpCurrent = Math.min(state.hpCurrent, mx);
  state.combat = { monsterId, monHp: mon.hp ?? 20, turn: 0 };
}

export function turnFight(state){
  if(!state.combat) return { done:true, reason:'no-combat' };
  const mon = MONSTERS.find(m=>m.id===state.combat.monsterId);
  const ps = derivePlayerStats(state, mon);

  let log = [];

  // --- Player attacks ---
  if(Math.random() < ps.acc){
    const dmg = 1 + Math.floor(Math.random()*ps.maxHit); // 1..maxHit
    state.combat.monHp = Math.max(0, state.combat.monHp - dmg);
    log.push(`You hit ${mon.name} for ${dmg}.`);
  } else {
    log.push(`You miss ${mon.name}.`);
  }

  if(state.combat.monHp<=0){
    awardWin(state, mon);
    log.push(`You defeated ${mon.name}!`);
    const xp = state.__lastFightXp;
    return { done:true, win:true, log, xp, loot: state.__lastFightLootNames||[] };
  }

  // --- Monster attacks ---
  const monAtkRating = (mon.attack ?? mon.level)*1.4 + 10;
  const monAcc = clamp(BALANCE.monAccBase + (monAtkRating/(monAtkRating + ps.defRating))*BALANCE.monAccScale, 0.05, 0.95);
  const monMaxHit = mon.maxHit ?? (3 + Math.floor((mon.level||1)/5));

  if(Math.random() < monAcc){
    let dmg = 1 + Math.floor(Math.random()*monMaxHit);
    const mitigation = Math.floor(ps.defBonus * BALANCE.dmgMitigationPerDef);
    dmg = Math.max(1, dmg - mitigation);
    state.hpCurrent = Math.max(0, state.hpCurrent - dmg);
    log.push(`${mon.name} hits you for ${dmg}.`);
  } else {
    log.push(`${mon.name} misses you.`);
  }

  state.combat.turn++;

  if(state.hpCurrent<=0){
    state.hpCurrent = 1; // You survive at 1 HP
    const result = { done:true, win:false, log:[...log, `You were defeated by ${mon.name}.`] };
    state.combat = null;
    state.__lastFightXp = { atk:0, str:0, def:0 };
    state.__lastFightLootNames = [];
    return result;
  }

  return { done:false, log };
}

function awardWin(state, mon){
  const style = state.trainingStyle || 'shared';
  const gained = { atk:0, str:0, def:0 };
  if(style==='attack') gained.atk = mon.xp.attack;
  else if(style==='strength') gained.str = mon.xp.strength;
  else if(style==='defense') gained.def = mon.xp.defense;
  else {
    gained.atk = Math.max(1, Math.floor(mon.xp.attack/3));
    gained.str = Math.max(1, Math.floor(mon.xp.strength/3));
    gained.def = Math.max(1, Math.floor(mon.xp.defense/3));
  }
  state.atkXp += gained.atk; state.strXp += gained.str; state.defXp += gained.def;

  // Loot roll
  const lootNames = [];
  for(const d of mon.drops){
    if(Math.random() < d.chance){
      if(d.id){ addItem(state, d.id, 1); lootNames.push(ITEMS[d.id].name); }
      if(d.gold){ addGold(state, d.gold); lootNames.push(`${d.gold}g`); }
    }
  }
  state.__lastFightXp = gained;
  state.__lastFightLootNames = lootNames;
  state.combat = null;
}
