// data/smithing.js
export const SMELT_RECIPES = {
  bar_copper: { 
    name: 'Copper Bar', 
    time: 2000, 
    xp: 6, 
    inputs: [{ id: 'ore_copper', qty: 1 }] 
  },  
  bar_bronze: {
    name: 'Bronze Bar',
    level: 10,
    time: 2000,
    xp: 15,
    inputs: [{ id: 'ore_copper', qty: 1 }, { id: 'ore_tin', qty: 1 }]
  },
  bar_iron: {
    name: 'Iron Bar',
    level: 20,
    time: 2000,
    xp: 25,
    inputs: [{ id: 'ore_iron', qty: 2 }]
  }
};

// Forging: uses bars by type via barId (e.g., 'bar_copper') and is timed.
export const FORGE_RECIPES = [
  // Copper gear
  { id:'copper_helm',   metal:'copper', name:'Copper Helm',       barId:'bar_copper', bars:2, time:2000, xp:16, level:2 },
  { id:'copper_plate',  metal:'copper', name:'Copper Platebody',  barId:'bar_copper', bars:5, time:3200, xp:40, level:5 },
  { id:'copper_legs',   metal:'copper', name:'Copper Platelegs',  barId:'bar_copper', bars:4, time:2800, xp:32, level:3 },
  { id:'copper_gloves', metal:'copper', name:'Copper Gloves',     barId:'bar_copper', bars:1, time:1500, xp:8,  level:1 },
  { id:'copper_boots',  metal:'copper', name:'Copper Boots',      barId:'bar_copper', bars:1, time:1500, xp:8,  level:1 },
  { id:'copper_shield', metal:'copper', name:'Copper Shield',     barId:'bar_copper', bars:3, time:2600, xp:24, level:4 },
  { id:'copper_dagger', metal:'copper', name:'Copper Dagger',     bars:1, time:1600, xp:8,  extras:[{ id:'wood_handle', qty:1 }], level:1 },
  { id:'copper_sword',  metal:'copper', name:'Copper Sword',      bars:3, time:2600, xp:28, extras:[{ id:'wood_handle', qty:1 }], level:3 },
  { id:'copper_hammer', metal:'copper', name:'Copper hammer',     bars:3, time:2600, xp:28, extras:[{ id:'wood_handle', qty:1 }], level:4 },
  { id:'axe_copper',    metal:'copper', name:'Copper Axe',        bars:2, time:2200, xp:19, extras:[{ id:'wood_handle', qty:1 }], quality:false, level:1 },
  { id:'pick_copper',   metal:'copper', name:'Copper Pickaxe',    bars:2, time:2400, xp:19, extras:[{ id:'wood_handle', qty:1 }], quality:false, level:1 },

  // Bronze gear
  { id:'bronze_helm',   metal:'bronze', name:'Bronze Helm',       barId:'bar_bronze', bars:2, time:2600, xp:14, level:11 },
  { id:'bronze_plate',  metal:'bronze', name:'Bronze Platebody',  barId:'bar_bronze', bars:4, time:3400, xp:22, level:15 },
  { id:'bronze_legs',   metal:'bronze', name:'Bronze Platelegs',  barId:'bar_bronze', bars:4, time:3000, xp:18, level:13 },
  { id:'bronze_gloves', metal:'bronze', name:'Bronze Gloves',     barId:'bar_bronze', bars:1, time:2000, xp:8,  level:10 },
  { id:'bronze_boots',  metal:'bronze', name:'Bronze Boots',      barId:'bar_bronze', bars:1, time:2000, xp:8,  level:10 },
  { id:'bronze_shield', metal:'bronze', name:'Bronze Shield',     barId:'bar_bronze', bars:3, time:3200, xp:20, level:14 },
  { id:'bronze_dagger', metal:'bronze', name:'Bronze Dagger',     barId:'bar_bronze', bars:1, time:2200, xp:10, extras:[{ id:'wood_handle', qty:1 }], level:10 },
  { id:'bronze_sword',  metal:'bronze', name:'Bronze Sword',      barId:'bar_bronze', bars:3, time:2800, xp:18, extras:[{ id:'wood_handle', qty:1 }], level:13 },
  { id:'bronze_hammer', metal:'bronze', name:'Bronze Hammer',     barId:'bar_bronze', bars:3, time:2800, xp:18, extras:[{ id:'wood_handle', qty:1 }], level:15 },
  { id:'axe_bronze',    metal:'bronze', name:'Bronze Axe',        barId:'bar_bronze', bars:2, time:2400, xp:22, extras:[{ id:'wood_handle', qty:1 }], quality:false, level:10 },
  { id:'pick_bronze',   metal:'bronze', name:'Bronze Pickaxe',    barId:'bar_bronze', bars:2, time:2600, xp:22, extras:[{ id:'wood_handle', qty:1 }], quality:false, level:10 },

  // Iron gear
  { id:'iron_helm',     metal:'iron',   name:'Iron Helm',         barId:'bar_iron',   bars:2, time:3000, xp:20, level:21 },
  { id:'iron_plate',    metal:'iron',   name:'Iron Platebody',    barId:'bar_iron',   bars:5, time:3800, xp:30, level:25 },
  { id:'iron_legs',     metal:'iron',   name:'Iron Platelegs',    barId:'bar_iron',   bars:4, time:3400, xp:24, level:23 },
  { id:'iron_gloves',   metal:'iron',   name:'Iron Gloves',       barId:'bar_iron',   bars:1, time:2400, xp:12, level:20 },
  { id:'iron_boots',    metal:'iron',   name:'Iron Boots',        barId:'bar_iron',   bars:1, time:2400, xp:12, level:20 },
  { id:'iron_shield',   metal:'iron',   name:'Iron Shield',       barId:'bar_iron',   bars:1, time:3600, xp:28, level:24 },
  { id:'iron_dagger',   metal:'iron',   name:'Iron Dagger',       barId:'bar_iron',   bars:1, time:2600, xp:14, extras:[{ id:'wood_handle', qty:1 }], level:20 },
  { id:'iron_sword',    metal:'iron',   name:'Iron Sword',        barId:'bar_iron',   bars:3, time:3200, xp:24, extras:[{ id:'wood_handle', qty:1 }], level:23 },
  { id:'iron_hammer',   metal:'iron',   name:'Iron Hammer',       barId:'bar_iron',   bars:3, time:3200, xp:24, extras:[{ id:'wood_handle', qty:1 }], level:25 },
  { id:'axe_iron',      metal:'iron',   name:'Iron Axe',          barId:'bar_iron',   bars:2, time:2600, xp:26, extras:[{ id:'wood_handle', qty:1 }], quality:false, level:20 },
  { id:'pick_iron',     metal:'iron',   name:'Iron Pickaxe',      barId:'bar_iron',   bars:2, time:2800, xp:26, extras:[{ id:'wood_handle', qty:1 }], quality:false, level:20 },

  // Upgrade materials
  { id:'copper_upgrade_bar', name:'Copper Upgrade Bar', metal:'copper', barId:'bar_copper', bars:3, time:1200, xp:18, kind:'material', quality:false, level:5 },
  { id:'bronze_upgrade_bar', name:'Bronze Upgrade Bar', metal:'bronze', barId:'bar_bronze', bars:3, time:2000, xp:45, kind:'material', quality:false, level:15 },
  { id:'iron_upgrade_bar',   name:'Iron Upgrade Bar',   metal:'iron',   barId:'bar_iron',   bars:3, time:2000, xp:75, kind:'material', quality:false, level:25 },
];
