// data/smithing.js
export const SMELT_RECIPES = {
    bar_copper: { name:'Copper Bar', time:2000, xp:6, inputs:[{ id:'ore_copper', qty:1 }] }  
  };
  
  // Forging: uses bars by type via barId (e.g., 'bar_copper') and is timed.
  export const FORGE_RECIPES = [
    { id:'copper_helm',        name:'Copper Helm',        barId:'bar_copper', bars:2, time:2000, xp:16, level: 2 },
    { id:'copper_plate',       name:'Copper Platebody',   barId:'bar_copper', bars:5, time:3200, xp:40, level: 5 },
    { id:'copper_legs',        name:'Copper Platelegs',   barId:'bar_copper', bars:4, time:2800, xp:32, level: 3 },
    { id:'copper_gloves',      name:'Copper Gloves',      barId:'bar_copper', bars:1, time:1500, xp:8, level: 1 },
    { id:'copper_boots',       name:'Copper Boots',       barId:'bar_copper', bars:1, time:1500, xp:8, level: 1  },
    { id:'copper_shield',      name:'Copper Shield',      barId:'bar_copper', bars:3, time:2600, xp:24, level: 4 },
    // Weapons — REQUIRE WOOD HANDLE
    { id:'copper_dagger',  name:'Copper Dagger',  bars:1, time:1600, xp:8,  extras:[{ id:'wood_handle', qty:1 }], level: 1 },
    { id:'copper_sword',   name:'Copper Sword',   bars:3, time:2600, xp:28, extras:[{ id:'wood_handle', qty:1 }], level: 3 },
    { id:'copper_mace',    name:'Copper Mace',    bars:3, time:2600, xp:28, extras:[{ id:'wood_handle', qty:1 }], level: 4 },
    // Tools — REQUIRE WOOD HANDLE
    { id:'axe_copper',     name:'Copper Axe',     bars:2, time:2200, xp:19, extras:[{ id:'wood_handle', qty:1 }], quality:false, level: 1 },
    { id:'pick_copper',    name:'Copper Pickaxe', bars:2, time:2400, xp:19, extras:[{ id:'wood_handle', qty:1 }], quality:false, level: 1 },
  
    // Upgrade material (no quality; your forge code can skip @q when kind==='material')
    { id:'copper_upgrade_bar', name:'Copper Upgrade Bar', barId:'bar_copper', bars:3, time:1200, xp:18, kind:'material', quality:false, level: 5 },
  ];
  