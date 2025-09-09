// data/smithing.js

// Smelting: key is the OUTPUT id. Supports multi-inputs.
// Example scales when you add more metals (tin, bronze, etc.)
export const SMELT_RECIPES = {
    bar_copper: { name:'Copper Bar', time:2000, xp:8, inputs:[{ id:'ore_copper', qty:1 }] }
  
    // Future examples (uncomment when you add items):
    // bar_tin:    { name:'Tin Bar',    time:2000, xp:8,  inputs:[ { id:'ore_tin', qty:1 } ] },
    // bar_bronze: { name:'Bronze Bar', time:3200, xp:16, inputs:[ { id:'ore_copper', qty:1 }, { id:'ore_tin', qty:1 } ] },
  };
  
  // Forging: uses bars by type via barId (e.g., 'bar_copper') and is timed.
  export const FORGE_RECIPES = [
    { id:'copper_helm',        name:'Copper Helm',        barId:'bar_copper', bars:2, time:2000, xp:12 },
    { id:'copper_plate',       name:'Copper Platebody',   barId:'bar_copper', bars:5, time:3200, xp:30 },
    { id:'copper_legs',        name:'Copper Platelegs',   barId:'bar_copper', bars:4, time:2800, xp:24 },
    { id:'copper_gloves',      name:'Copper Gloves',      barId:'bar_copper', bars:1, time:1500, xp:6  },
    { id:'copper_boots',       name:'Copper Boots',       barId:'bar_copper', bars:1, time:1500, xp:6  },
    { id:'copper_shield',      name:'Copper Shield',      barId:'bar_copper', bars:3, time:2600, xp:18 },
    { id:'copper_dagger',      name:'Copper Dagger',      barId:'bar_copper', bars:1, time:1600, xp:8  },
    { id:'copper_sword',       name:'Copper Sword',       barId:'bar_copper', bars:3, time:2600, xp:18 },
    { id:'copper_mace',        name:'Copper Mace',        barId:'bar_copper', bars:3, time:2600, xp:18 },
  
    // Upgrade material (no quality; your forge code can skip @q when kind==='material')
    { id:'copper_upgrade_bar', name:'Copper Upgrade Bar', barId:'bar_copper', bars:3, time:1200, xp:18, kind:'material' },
  ];
  