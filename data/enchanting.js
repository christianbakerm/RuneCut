// /data/enchanting.js
export const ENCHANT_RECIPES = {
    tome_forest_novice: {
      id: 'tome_forest_novice',
      name: 'Enchant Novice Forest Tome',
      level: 1,
      time: 2000,
      mana: 5,
      inputs: [
        { id: 'book', qty: 1 },
        { id: 'forest_essence', qty: 1 }
      ],
      outputs: [
        { id: 'tome_forest_novice', qty: 1 }
      ],
      xp: { skill: 'enchant', amount: 25 }
    },
  tome_sea_novice: {
    id: 'tome_sea_novice',
    name: 'Enchant Novice Sea Tome',
    level: 1,
    time: 2000,
    mana: 5,
    inputs: [
      { id: 'book', qty: 1 },
      { id: 'sea_essence', qty: 1 }
    ],
    outputs: [
      { id: 'tome_sea_novice', qty: 1 }
    ],
    xp: { skill: 'enchant', amount: 25 }
  },
  tome_rock_novice: {
    id: 'tome_rock_novice',
    name: 'Enchant Novice Rock Tome',
    level: 1,
    time: 2000,
    mana: 5,
    inputs: [
      { id: 'book', qty: 1 },
      { id: 'rock_essence', qty: 1 }
    ],
    outputs: [
      { id: 'tome_rock_novice', qty: 1 }
    ],
    xp: { skill: 'enchant', amount: 25 }
  }
};