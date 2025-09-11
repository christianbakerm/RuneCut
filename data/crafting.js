// data/crafting.js
export const CRAFT_RECIPES = {
    wood_handle: {
      id: 'wood_handle',
      name: 'Wood Handle',
      time: 1800,
      inputs:  [{ id:'log_oak', qty:1 }],
      outputs: [{ id:'wood_handle', qty:1 }],
      xp: { skill: 'craft', amount: 6 },
      speedSkill: 'craft',
    },
    pages: {
      id: 'pages',
      name: 'Pages',
      time: 1800,
      inputs:  [{ id:'log_oak', qty:1 }],
      outputs: [{ id:'pages', qty:10 }],
      xp: { skill: 'craft', amount: 6 },
      speedSkill: 'craft',
    },
  
    
  };