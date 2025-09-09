// data/cooking.js
// Map RAW id → cooked id, base time (ms), and XP awarded on success.
export const COOK_RECIPES = {
    raw_shrimps: { name: 'Raw Shrimps', cookTo: 'cooked shrimps', time: 2000, xp: 6 },
    raw_trout:   { name: 'Raw Trout',   cookTo: 'trout',   time: 2800, xp: 10 },
  };
  
  export function canCookId(id){
    const base = String(id||'').split('@')[0];
    return !!COOK_RECIPES[base];
  }
  