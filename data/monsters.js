// Custom creatures (no RuneScape names)
export const MONSTERS = [

  {
    id:'bog_mite', name:'Bog Mite', level:1, time:2800,
    hp:8, attack:3, defense:2, maxHit:2,
    xp:{attack:8,strength:8,defense:8},
    drops:[ 
      {gold:2, chance:0.7},
      { id:'wire_coil',     chance:0.1} 
    ],
    img:'assets/monsters/bog_mite.png'
  },
  {
    id:'bramble_sprite', name:'Bramble Sprite', level:3, time:3000,
    hp:16, attack:6, defense:4, maxHit:3,
    xp:{attack:12,strength:12,defense:12},
    drops: [
      { id:'briar_oil',     chance:0.25 },
      { id:'bramble_heart', chance:0.08 },
      { gold:4,             chance:0.70 }
    ],
    img:'assets/monsters/bramble_sprite.png'
  },
  {
    id:'dust_grub', name:'Dust Grub', level:5, time:3200,
    hp:24, attack:9, defense:6, maxHit:4,
    xp:{attack:18,strength:18,defense:18},
    drops:[ {gold:6, chance:0.7} ],
    img:'assets/monsters/dust_grub.png'
  },

  {
  id:'gutter_rat', name:'Gutter Rat', level:7, time:3400,
  hp:32, attack:11, defense:8, maxHit:5,
  xp:{attack:24,strength:24,defense:24},
  drops:[
    { gold:8, chance:0.7},
    { id: 'leather', chance: 0.5 }
   ],
  img:'assets/monsters/gutter_rat.png'
  },

{ id:'swamp_spider', name:'Swamp Spider', level:9, time:3600,
  hp:42, attack:13, defense:10, maxHit:6,
  xp:{attack:30,strength:30,defense:30},
  drops:[ 
    { gold:11, chance:0.7 },
    { id: 'silk_coil', chance: 0.1}
   ],
  img:'assets/monsters/swamp_spider.png'
},

// 6
{ id:'duskhound', name:'Duskhound', level:11, time:3800,
  hp:55, attack:16, defense:12, maxHit:7,
  xp:{attack:38,strength:38,defense:38},
  drops:[ {gold:14, chance:0.7} ],
  img:'assets/monsters/duskhound.png'
},

// 7
{ id:'thornback_toad', name:'Thornback Toad', level:13, time:4000,
  hp:70, attack:19, defense:14, maxHit:8,
  xp:{attack:46,strength:46,defense:46},
  drops:[ {gold:18, chance:0.7} ],
  img:'assets/monsters/thornback_toad.png'
},

// 8
{ id:'soot_imp', name:'Soot Imp', level:16, time:4200,
  hp:88, attack:22, defense:17, maxHit:9,
  xp:{attack:58,strength:58,defense:58},
  drops:[ 
    {gold:22, chance:0.7},
    { id: 'nylon_coil', chance:0.1 } 
  ],
  img:'assets/monsters/soot_imp.png'
},

// 9
{ id:'mire_gnash', name:'Mire Gnash', level:19, time:4400,
  hp:110, attack:26, defense:20, maxHit:11,
  xp:{attack:70,strength:70,defense:70},
  drops:[ {gold:27, chance:0.7} ],
  img:'assets/monsters/mire_gnash.png'
},

  {
    id:'rift_jackal', name:'Rift Jackal', level:22, time:4600,
    hp: 135, attack: 30, defense: 23, maxHit: 13,
    xp:{attack:86,strength:86,defense:86},
    drops:[ {gold:33, chance:0.7} ]
  },

  {
    id:'ironclaw_brute', name:'Ironclaw Brute', level:26, time:5000,
    hp: 165, attack: 35, defense: 27, maxHit: 15,
    xp:{attack:104,strength:104,defense:104},
    drops:[ {gold:40, chance:0.7} ]
  },

  {
    id:'grave_stalker', name:'Grave Stalker', level:30, time:5400,
    hp: 200, attack: 40, defense: 32, maxHit: 18,
    xp:{attack:124,strength:124,defense:124},
    drops:[ {gold:48, chance:0.7} ]
  },

  {
    id:'ember_warg', name:'Ember Warg', level:35, time:5800,
    hp: 240, attack: 46, defense: 38, maxHit: 21,
    xp:{attack:150,strength:150,defense:150},
    drops:[ {gold:58, chance:0.7} ]
  },

  {
    id:'night_reaver', name:'Night Reaver', level:40, time:6200,
    hp: 290, attack: 53, defense: 45, maxHit: 24,
    xp:{attack:180,strength:180,defense:180},
    drops:[ {gold:70, chance:0.7} ]
  },

  {
    id:'abyssal_ravager', name:'Abyssal Ravager', level:48, time:6800,
    hp: 360, attack: 62, defense: 54, maxHit: 28,
    xp:{attack:220,strength:220,defense:220},
    drops:[ {gold:85, chance:0.7} ]
  }
];
