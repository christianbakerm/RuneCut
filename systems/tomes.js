import { addItem } from './inventory.js';
import { buildXpTable, levelFromXp } from './xp.js';
import { TREES } from '../data/woodcutting.js';
import { ITEMS } from '../data/items.js';

const XP = buildXpTable();

// ---------- generic helpers ----------
const clampMs = (ms)=> Math.max(250, ms);
const speedFromLevel = (lvl)=> 1 + 0.03*(lvl-1);

// Apply XP to the right pool
function addSkillXp(state, skill, amt){
  if (!amt) return;
  if (skill === 'wc')       state.wcXp       = (state.wcXp||0)       + amt;
  else if (skill === 'fish')state.fishXp     = (state.fishXp||0)     + amt;
  else if (skill === 'min') state.minXp      = (state.minXp||0)      + amt;
  else if (skill === 'smith')state.smithXp   = (state.smithXp||0)    + amt;
  else if (skill === 'craft')state.craftXp   = (state.craftXp||0)    + amt;
  else if (skill === 'cook') state.cookXp    = (state.cookXp||0)     + amt;
  else if (skill === 'atk')  state.atkXp     = (state.atkXp||0)      + amt;
  else if (skill === 'str')  state.strXp     = (state.strXp||0)      + amt;
  else if (skill === 'def')  state.defXp     = (state.defXp||0)      + amt;
  else if (skill === 'enchant') state.enchantXp = (state.enchantXp||0) + amt;
  // add others as you introduce new skills
}

// Tool speed (used by woodcutting resolver)
function axeSpeedFromState(state){
  const axeId = state.equipment?.axe;
  const def = axeId ? ITEMS[axeId] : null;
  return (def?.speed) || 1;
}

// --- Activity resolvers (add more later: fish, min, etc.) ---
const RESOLVERS = {
  /** Woodcutting auto-gather
   *  Uses tome meta (or fallbacks) to resolve drop, xp per tick, and tick speed.
   *  Tome meta fields used (optional):
   *    tome.activity = 'wc'
   *    tome.sourceId  -> tree id (e.g. 'oak')
   *    tome.dropId    -> explicit drop item id (defaults to tree.drop)
   *    tome.xpPer     -> override xp per tick (defaults to tree.xp)
   */
  wc: {
    resolveSpec(state, baseId, meta){
      const wcLvl = levelFromXp(state.wcXp||0, XP);
      const treeId = meta?.sourceId || 'oak';
      const tree = TREES.find(t=>t.id===treeId) || TREES.find(t=>t.id==='oak') || { baseTime:3000, drop:'log_oak', xp:5 };
      const dropId = meta?.dropId || tree.drop || 'log_oak';
      const xpPer  = Number.isFinite(meta?.xpPer) ? meta.xpPer : (tree.xp || 0);

      // tick speed based on player WC level and axe speed
      const tickMs = clampMs((tree.baseTime || 3000) / (axeSpeedFromState(state) * speedFromLevel(wcLvl)));

      return {
        activity: 'wc',
        xpSkill:  'wc',
        sourceId: treeId,
        dropId,
        xpPer,
        tickMs
      };
    }
  },

  // Example stubs you can flesh out later:
  // fish: { resolveSpec(state, baseId, meta){ ... } },
  // min:  { resolveSpec(state, baseId, meta){ ... } },
};

// ---------- public helpers ----------
export function isTomeActive(state){ return !!state.activeTome; }
export function tomeRemainingMs(state){
  const t = state.activeTome;
  return t ? Math.max(0, t.endsAt - performance.now()) : 0;
}

// Duration scales with Enchanting unless explicitly overridden in item meta
export function tomeDurationMsFor(state, itemId){
  const base = String(itemId).split('@')[0];
  const meta = ITEMS?.[base]?.tome || {};
  // normalize field names for duration
  const minS = (meta.minSeconds ?? meta.baseSec ?? 15);
  const maxS = (meta.maxSeconds ?? meta.maxSec ?? 30);
  const lvl  = levelFromXp(state.enchantXp||0, XP);
  const frac = Math.min(1, Math.max(0, lvl/99)); // L1→L99 linear scale
  return (minS + (maxS - minS)*frac) * 1000;
}

/* ---------- engine loop ---------- */
let TICK = null;
function ensureLoop(state){
  if (TICK) return; // singleton loop
  TICK = setInterval(()=>{
    const t = state.activeTome; if (!t) return;
    const now = performance.now();

    // Add items & XP on each tick boundary (can catch up if throttled)
    while (now >= t.nextTickAt && now < t.endsAt){
      addItem(state, t.dropId, 1);
      addSkillXp(state, t.xpSkill, t.xpPer);

      t.nextTickAt += t.tickMs;

      // notify UI listeners generically
      try {
        window.dispatchEvent(new CustomEvent('tome:tick', {
          detail:{ id:t.id, dropId:t.dropId, skill:t.xpSkill, xp:t.xpPer }
        }));
      } catch(_) {}
    }

    // Expire the current run
    if (now >= t.endsAt){
      state.activeTome = null;

      // Consume one equipped tome from the stack on the equipment slot
      if (state.equipment?.tome){
        const eqId = state.equipment.tome;
        const n = Math.max(1, state.equipment.tomeQty|0);
        const left = Math.max(0, n - 1);
        if (left > 0){
          state.equipment.tomeQty = left;
          // auto-start next run of same tome
          startTomeRun(state, eqId);
          try { window.dispatchEvent(new CustomEvent('tome:stack', { detail:{ qty:left } })); } catch(_) {}
        } else {
          // no more tomes left — clear slot
          state.equipment.tome = null;
          delete state.equipment.tomeQty;
          try { window.dispatchEvent(new CustomEvent('tome:empty')); } catch(_) {}
        }
      }

      try { window.dispatchEvent(new CustomEvent('tome:end')); } catch(_) {}
    }
  }, 250);
}

/* ---------- public control ---------- */
export function startTomeRun(state, tomeId){
  if (state.activeTome) return false; // one concurrent run for now

  const base = String(tomeId).split('@')[0];
  const meta = ITEMS?.[base]?.tome || {};

  // pick resolver (default to woodcutting for now)
  const activity = meta.activity || 'wc';
  const resolver = RESOLVERS[activity] || RESOLVERS.wc;
  const spec = resolver.resolveSpec(state, base, meta);

  const now = performance.now();
  const dur = tomeDurationMsFor(state, tomeId);

  state.activeTome = {
    id: base,
    activity: spec.activity,
    xpSkill:  spec.xpSkill,
    sourceId: spec.sourceId,
    dropId:   spec.dropId,
    xpPer:    spec.xpPer|0,
    tickMs:   spec.tickMs,

    startedAt: now,
    endsAt:    now + dur,
    nextTickAt:now + spec.tickMs,
  };

  ensureLoop(state);
  return true;
}

export function ensureTomeEngine(state){
  ensureLoop(state);
  const equippedTome = state.equipment?.tome;
  if (equippedTome && !state.activeTome){
    startTomeRun(state, equippedTome);
  }
}

export function stopTomeRun(state){
  state.activeTome = null;
}
