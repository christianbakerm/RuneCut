// data/items.js
export const ITEMS = {
    // Resources
    log_oak:   { id:'log_oak',   name:'Oak Logs',  type:'resource', sell:1, icon:'🪵' },
    log_pine:  { id:'log_pine',  name:'Pine Logs', type:'resource', sell:2, icon:'🪵' },

    // Materials
    wood_handle: { id:'wood_handle', name:'Wood Handle', type:'material', sell:2, icon:'🪵' },
  
    // Tools
    axe_copper: { id:'axe_copper', name:'Copper Axe', type:'equipment', slot:'axe', speed:1.25, img:'assets/equipment/bronze-axe.png' },
    pick_copper: { id:'pick_copper', name:'Copper Pick', type:'equipment', slot:'pick', speed:1.25, img:'assets/equipment/bronze-axe.png' },

    // Fishing resources
    raw_shrimps: { id:'raw_shrimps', name:'Raw Shrimp',  type:'resource', sell:1, img:'assets/food/raw_shrimp.png' },
    raw_trout:   { id:'raw_trout',   name:'Raw Trout',   type:'resource', sell:2, img:'assets/food/raw_trout.png' },
    raw_eel:     { id:'raw_eel',     name:'Raw Eel',     type:'resource', sell:8, img:'assets/food/raw_eel.png' },
    raw_salmon:  { id:'raw_salmon',  name:'Raw Salmon',  type:'resource', sell:15, img:'assets/food/raw_salmon.png' },
    raw_halibut: { id:'raw_halibut', name:'Raw Halibut', type:'resource', sell:29, img:'assets/food/raw_halibut.png' },
    raw_manta_ray: { id:'raw_manta_ray', name:'Raw Manta Ray', type:'resource', sell:40,  img:'assets/food/raw_manta-ray.png' },
    raw_angler: { id:'raw_angler', name:'Raw Angler', type:'resource', sell:65, img:'assets/food/raw_angler.png' },
    raw_dolphin: { id:'raw_dolphin', name:'Raw Dolphin', type:'resource', sell:90, img:'assets/food/raw_dolphin.png' },

    // Cooked foods
    shrimps: { id:'shrimps', name:'Shrimp',   type:'food', heal:5,  sell:2,  img:'assets/food/shrimp.png' },
    trout:   { id:'trout',   name:'Trout',    type:'food', heal:12, sell:3,  img:'assets/food/trout.png' },
    eel:     { id:'eel',     name:'Eel',      type:'food', heal:20, sell:10, img:'assets/food/eel.png' },
    salmon:  { id:'salmon',  name:'Salmon',   type:'food', heal:30, sell:19, img:'assets/food/salmon.png' },
    halibut: { id:'halibut', name:'Halibut',  type:'food', heal:45, sell:36, img:'assets/food/halibut.png' },
    manta_ray:     { id:'manta_ray',     name:'Manta Ray',     type:'food',     heal:36, sell:52, img:'assets/food/manta-ray.png' },
    angler:     { id:'angler',     name:'Angler',     type:'food',     heal:44, sell:82, img:'assets/food/angler.png' },
    dolphin:     { id:'dolphin',     name:'Dolphin',     type:'food',     heal:55, sell:115, img:'assets/food/dolphin.png' },

    // Ores
    ore_copper: { id:'ore_copper', name:'Copper Ore', type:'resource', sell:1, icon:'🪨' },
    ore_tin:    { id:'ore_tin',    name:'Tin Ore',    type:'resource', sell:2, icon:'🪨' },
    ore_iron:   { id:'ore_iron',   name:'Iron Ore',   type:'resource', sell:4, icon:'🪨' },

    // Smithing resource
    bar_copper: { id:'bar_copper', name:'Copper Bar',  type:'resource', sell:3, icon:'🔶' },
    bar_bronze: { id:'bar_bronze', name:'Bronze Bar', type:'resource', sell:5, icon:'🟫' },
    bar_iron:   { id:'bar_iron',   name:'Iron Bar',   type:'resource', sell:8, icon:'⬜' },
    copper_upgrade_bar: { id:'copper_upgrade_bar', name:'Copper Upgrade Bar', type:'material', sell:8, icon:'➕' },

    // --- Copper ---
    copper_helm:   { id:'copper_helm',   name:'Copper Helm',   type:'equipment', slot:'head',   def:3, sell:6, img:'assets/equipment/bronze-helm.png' },
    copper_plate:  { id:'copper_plate',  name:'Copper Plate',  type:'equipment', slot:'body',   def:8, sell:18, img:'assets/equipment/bronze-plate.png' },
    copper_legs:   { id:'copper_legs',   name:'Copper Greaves',type:'equipment', slot:'legs',   def:5, sell:12, img:'assets/equipment/bronze-legs.png' },
    copper_gloves: { id:'copper_gloves', name:'Copper Gloves', type:'equipment', slot:'gloves', def:2, sell:3, img:'assets/equipment/bronze-gloves.png' },
    copper_boots:  { id:'copper_boots',  name:'Copper Boots',  type:'equipment', slot:'boots',  def:2, sell:3, img:'assets/equipment/bronze-boots.png' },
    copper_shield: { id:'copper_shield', name:'Copper Shield', type:'equipment', slot:'shield', def:7, sell:15, img:'assets/equipment/bronze-shield.png' },
    copper_dagger: { id:'copper_dagger', name:'Copper Dagger', type:'equipment', slot:'weapon', atk:6,  str:2,  sell:10, img:'assets/equipment/bronze-dagger.png' },
    copper_sword:  { id:'copper_sword',  name:'Copper sword',  type:'equipment', slot:'weapon', atk:9,  str:5,  sell:18, img:'assets/equipment/bronze-sword.png' },
    copper_hammer: { id:'copper_hammer',   name:'Copper hammer',   type:'equipment', slot:'weapon', atk:4,  str:10, sell:18, img:'assets/equipment/bronze-hammer.png' },
    // --- Bronze ---
    bronze_helm:   { id:'bronze_helm',   name:'Bronze Helm',   type:'equipment', slot:'head',   def:5,  sell:12, img:'assets/equipment/bronze-helm.png',   tint:'bronze' },
    bronze_plate:  { id:'bronze_plate',  name:'Bronze Plate',  type:'equipment', slot:'body',   def:12, sell:28, img:'assets/equipment/bronze-plate.png',  tint:'bronze' },
    bronze_legs:   { id:'bronze_legs',   name:'Bronze Greaves',type:'equipment', slot:'legs',   def:8,  sell:20, img:'assets/equipment/bronze-legs.png',   tint:'bronze' },
    bronze_gloves: { id:'bronze_gloves', name:'Bronze Gloves', type:'equipment', slot:'gloves', def:3,  sell:6,  img:'assets/equipment/bronze-gloves.png', tint:'bronze' },
    bronze_boots:  { id:'bronze_boots',  name:'Bronze Boots',  type:'equipment', slot:'boots',  def:3,  sell:6,  img:'assets/equipment/bronze-boots.png',  tint:'bronze' },
    bronze_shield: { id:'bronze_shield', name:'Bronze Shield', type:'equipment', slot:'shield', def:10, sell:24, img:'assets/equipment/bronze-shield.png', tint:'bronze' },
    bronze_dagger: { id:'bronze_dagger', name:'Bronze Dagger', type:'equipment', slot:'weapon', atk:9,  str:4,  sell:16, img:'assets/equipment/bronze-dagger.png', tint:'bronze' },
    bronze_sword:  { id:'bronze_sword',  name:'Bronze Sword',  type:'equipment', slot:'weapon', atk:12, str:9,  sell:28, img:'assets/equipment/bronze-sword.png',  tint:'bronze' },
    bronze_hammer: { id:'bronze_hammer', name:'Bronze Hammer', type:'equipment', slot:'weapon', atk:8,  str:16, sell:28, img:'assets/equipment/bronze-hammer.png',tint:'bronze' },
    // --- Iron ---
    iron_helm:   { id:'iron_helm',   name:'Iron Helm',   type:'equipment', slot:'head',   def:8,  sell:22, img:'assets/equipment/bronze-helm.png',   tint:'iron' },
    iron_plate:  { id:'iron_plate',  name:'Iron Plate',  type:'equipment', slot:'body',   def:18, sell:42, img:'assets/equipment/bronze-plate.png',  tint:'iron' },
    iron_legs:   { id:'iron_legs',   name:'Iron Greaves',type:'equipment', slot:'legs',   def:12, sell:32, img:'assets/equipment/bronze-legs.png',   tint:'iron' },
    iron_gloves: { id:'iron_gloves', name:'Iron Gloves', type:'equipment', slot:'gloves', def:5,  sell:12, img:'assets/equipment/bronze-gloves.png', tint:'iron' },
    iron_boots:  { id:'iron_boots',  name:'Iron Boots',  type:'equipment', slot:'boots',  def:5,  sell:12, img:'assets/equipment/bronze-boots.png',  tint:'iron' },
    iron_shield: { id:'iron_shield', name:'Iron Shield', type:'equipment', slot:'shield', def:15, sell:38, img:'assets/equipment/bronze-shield.png', tint:'iron' },
    iron_dagger: { id:'iron_dagger', name:'Iron Dagger', type:'equipment', slot:'weapon', atk:13, str:6,  sell:24, img:'assets/equipment/bronze-dagger.png', tint:'iron' },
    iron_sword:  { id:'iron_sword',  name:'Iron Sword',  type:'equipment', slot:'weapon', atk:16, str:12,  sell:40, img:'assets/equipment/bronze-sword.png',  tint:'iron' },
    iron_hammer: { id:'iron_hammer', name:'Iron Hammer', type:'equipment', slot:'weapon', atk:11,  str:25, sell:40, img:'assets/equipment/bronze-hammer.png',tint:'iron' },


    // Ingredients
    briar_oil:     { id:'briar_oil', name:'Briar Oil', type:'reagent', sell:5,  icon:'🛢️' },
    bramble_heart: { id:'bramble_heart', name:'Bramble Heart', type:'reagent', sell:25, icon:'💚' },

  };
  