// /ui/tint.js
// Infer the metal from the item id, e.g. axe_copper, pick_bronze, bar_iron, ore_copper
export function metalFromItemId(id = '') {
    const s = String(id);
    // bars / ores
    let m = s.match(/^bar_(\w+)/)?.[1] || s.match(/^ore_(\w+)/)?.[1];
    if (m) return m;
  
    // tools and armor e.g. axe_copper, copper_helm
    m = s.match(/^(axe|pick)_(\w+)/)?.[2] || s.match(/^(\w+)_/ )?.[1];
    if (['copper','bronze','iron','steel','mith','adamant','rune'].includes(m)) return m;
  
    return null;
  }
  
  // Return a tint class for this item id (or '' if none)
  export function tintClassForItem(id = '') {
    const metal = metalFromItemId(id);
    if (!metal) return '';
    return `tint-${metal}`;
  }
  