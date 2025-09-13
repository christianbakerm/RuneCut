export const MONSTERS = [
  /* ---------- Swamp ---------- */
  { id:'bog_mite', name:'Bog Mite', level:1, time:2800,
    zone:'Swamp', hp:12, attack:3, defense:2, maxHit:3,
    xp:{attack:8,strength:8,defense:8},
    drops:[{gold:2, chance:0.7},{id:'wire_coil', chance:0.1}],
    img:'assets/monsters/bog_mite.png'
  },
  { id:'bramble_sprite', name:'Bramble Sprite', level:3, time:3000,
    zone:'Swamp', hp:24, attack:6, defense:4, maxHit:4,
    xp:{attack:12,strength:12,defense:12},
    drops:[{id:'briar_oil', chance:0.25},{id:'bramble_heart', chance:0.08},{gold:4, chance:0.7}],
    img:'assets/monsters/bramble_sprite.png'
  },
  { id:'gutter_rat', name:'Gutter Rat', level:7, time:3400,
    zone:'Swamp', hp:48, attack:11, defense:8, maxHit:7,
    xp:{attack:24,strength:24,defense:24},
    drops:[{gold:8, chance:0.7},{id:'leather', chance:0.5}],
    img:'assets/monsters/gutter_rat.png'
  },
  { id:'swamp_spider', name:'Swamp Spider', level:9, time:3600,
    zone:'Swamp', hp:63, attack:13, defense:10, maxHit:8,
    xp:{attack:30,strength:30,defense:30},
    drops:[{gold:11, chance:0.7},{id:'silk_coil', chance:0.1}],
    img:'assets/monsters/swamp_spider.png'
  },
  { id:'toxic_frog', name:'Toxic Frog', level:12, time:3800,
    zone:'Swamp', hp:85, attack:15, defense:11, maxHit:10,
    xp:{attack:36,strength:36,defense:36},
    drops:[{gold:14, chance:0.7},{id:'venom_gland', chance:0.15}],
    img:'assets/monsters/toxic_frog.png'
  },

  /* ---------- Wastes ---------- */
  { id:'dust_rat', name:'Dust Rat', level:5, time:3000,
    zone:'Wastes', hp:35, attack:8, defense:6, maxHit:5,
    xp:{attack:18,strength:18,defense:18},
    drops:[{gold:6, chance:0.7},{id:'scrap_fur', chance:0.2}],
    img:'assets/monsters/dust_rat.png'
  },
  { id:'scavenger_dog', name:'Scavenger Dog', level:9, time:3400,
    zone:'Wastes', hp:65, attack:14, defense:10, maxHit:9,
    xp:{attack:30,strength:30,defense:30},
    drops:[{gold:12, chance:0.7},{id:'dog_bone', chance:0.2}],
    img:'assets/monsters/scavenger_dog.png'
  },
  { id:'thorn_lizard', name:'Thorn Lizard', level:13, time:3800,
    zone:'Wastes', hp:100, attack:19, defense:14, maxHit:12,
    xp:{attack:48,strength:48,defense:48},
    drops:[{gold:18, chance:0.7},{id:'lizard_scale', chance:0.15}],
    img:'assets/monsters/thorn_lizard.png'
  },
  { id:'waste_vulture', name:'Waste Vulture', level:17, time:4200,
    zone:'Wastes', hp:140, attack:25, defense:19, maxHit:15,
    xp:{attack:66,strength:66,defense:66},
    drops:[{gold:24, chance:0.7},{id:'vulture_feather', chance:0.1}],
    img:'assets/monsters/waste_vulture.png'
  },
  { id:'sand_beast', name:'Sand Beast', level:22, time:4600,
    zone:'Wastes', hp:200, attack:31, defense:25, maxHit:20,
    xp:{attack:88,strength:88,defense:88},
    drops:[{gold:34, chance:0.7},{id:'sand_core', chance:0.08}],
    img:'assets/monsters/sand_beast.png'
  },

  /* ---------- Volcano ---------- */
  { id:'fire_mite', name:'Fire Mite', level:6, time:3000,
    zone:'Volcano', hp:40, attack:9, defense:7, maxHit:6,
    xp:{attack:18,strength:18,defense:18},
    drops:[{gold:7, chance:0.7},{id:'ember_dust', chance:0.2}],
    img:'assets/monsters/fire_mite.png'
  },
  { id:'charred_bat', name:'Charred Bat', level:11, time:3400,
    zone:'Volcano', hp:70, attack:15, defense:11, maxHit:9,
    xp:{attack:34,strength:34,defense:34},
    drops:[{gold:12, chance:0.7},{id:'bat_wing', chance:0.2}],
    img:'assets/monsters/charred_bat.png'
  },
  { id:'magma_goblin', name:'Magma Goblin', level:16, time:3800,
    zone:'Volcano', hp:115, attack:22, defense:17, maxHit:14,
    xp:{attack:52,strength:52,defense:52},
    drops:[{gold:20, chance:0.7},{id:'goblin_claw', chance:0.15}],
    img:'assets/monsters/magma_goblin.png'
  },
  { id:'lava_hound', name:'Lava Hound', level:21, time:4200,
    zone:'Volcano', hp:170, attack:29, defense:23, maxHit:19,
    xp:{attack:76,strength:76,defense:76},
    drops:[{gold:30, chance:0.7},{id:'molten_hide', chance:0.1}],
    img:'assets/monsters/lava_hound.png'
  },
  { id:'flame_ogre', name:'Flame Ogre', level:28, time:4800,
    zone:'Volcano', hp:260, attack:38, defense:32, maxHit:26,
    xp:{attack:110,strength:110,defense:110},
    drops:[{gold:44, chance:0.7},{id:'ogre_tooth', chance:0.05}],
    img:'assets/monsters/flame_ogre.png'
  },

  /* ---------- Crypts ---------- */
  { id:'bone_rat', name:'Bone Rat', level:8, time:3200,
    zone:'Crypts', hp:55, attack:12, defense:9, maxHit:7,
    xp:{attack:26,strength:26,defense:26},
    drops:[{gold:9, chance:0.7},{id:'rat_bone', chance:0.2}],
    img:'assets/monsters/bone_rat.png'
  },
  { id:'crypt_bat', name:'Crypt Bat', level:13, time:3600,
    zone:'Crypts', hp:95, attack:18, defense:14, maxHit:11,
    xp:{attack:42,strength:42,defense:42},
    drops:[{gold:16, chance:0.7},{id:'bat_fang', chance:0.15}],
    img:'assets/monsters/crypt_bat.png'
  },
  { id:'grave_ghoul', name:'Grave Ghoul', level:18, time:4000,
    zone:'Crypts', hp:140, attack:25, defense:19, maxHit:16,
    xp:{attack:60,strength:60,defense:60},
    drops:[{gold:24, chance:0.7},{id:'ghoul_flesh', chance:0.1}],
    img:'assets/monsters/grave_ghoul.png'
  },
  { id:'tomb_knight', name:'Tomb Knight', level:24, time:4400,
    zone:'Crypts', hp:200, attack:32, defense:26, maxHit:21,
    xp:{attack:82,strength:82,defense:82},
    drops:[{gold:34, chance:0.7},{id:'rusted_sword', chance:0.08}],
    img:'assets/monsters/tomb_knight.png'
  },
  { id:'shadow_wraith', name:'Shadow Wraith', level:32, time:5000,
    zone:'Crypts', hp:320, attack:46, defense:38, maxHit:30,
    xp:{attack:130,strength:130,defense:130},
    drops:[{gold:52, chance:0.7},{id:'wraith_essence', chance:0.05}],
    img:'assets/monsters/shadow_wraith.png'
  },

  /* ---------- Mountains ---------- */
  { id:'cliff_rat', name:'Cliff Rat', level:6, time:3000,
    zone:'Mountains', hp:38, attack:9, defense:7, maxHit:5,
    xp:{attack:18,strength:18,defense:18},
    drops:[{gold:6, chance:0.7},{id:'stone_chip', chance:0.2}],
    img:'assets/monsters/cliff_rat.png'
  },
  { id:'mountain_goat', name:'Mountain Goat', level:12, time:3400,
    zone:'Mountains', hp:85, attack:16, defense:12, maxHit:10,
    xp:{attack:36,strength:36,defense:36},
    drops:[{gold:14, chance:0.7},{id:'goat_horn', chance:0.15}],
    img:'assets/monsters/mountain_goat.png'
  },
  { id:'rock_troll', name:'Rock Troll', level:18, time:3800,
    zone:'Mountains', hp:150, attack:24, defense:19, maxHit:16,
    xp:{attack:60,strength:60,defense:60},
    drops:[{gold:26, chance:0.7},{id:'troll_tooth', chance:0.1}],
    img:'assets/monsters/rock_troll.png'
  },
  { id:'ice_wolf', name:'Ice Wolf', level:25, time:4200,
    zone:'Mountains', hp:230, attack:34, defense:27, maxHit:23,
    xp:{attack:90,strength:90,defense:90},
    drops:[{gold:38, chance:0.7},{id:'wolf_pelt', chance:0.08}],
    img:'assets/monsters/ice_wolf.png'
  },
  { id:'peak_giant', name:'Peak Giant', level:34, time:4800,
    zone:'Mountains', hp:350, attack:48, defense:40, maxHit:32,
    xp:{attack:140,strength:140,defense:140},
    drops:[{gold:58, chance:0.7},{id:'giant_club', chance:0.05}],
    img:'assets/monsters/peak_giant.png'
  }
];
