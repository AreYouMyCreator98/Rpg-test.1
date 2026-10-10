// Stable IDs are shared by saves, encounters, maps, quests and the server catalog.
export const EXPANSION_ENEMIES=[
 {id:'boar',name:'Mossback Boar',biome:'Forest',x:-65,z:65,hp:90,damage:13,speed:3.3,xp:38,level:3,mechanic:'charge',color:0x6b8549},
 {id:'thornling',name:'Thornling',biome:'Forest',x:-70,z:4,hp:75,damage:12,speed:2,xp:42,level:4,mechanic:'thorns',color:0x79a45b},
 {id:'bear',name:'Dire Bear',biome:'Forest',x:-106,z:88,hp:190,damage:24,speed:2.8,xp:75,level:6,mechanic:'maul',color:0x967450},
 {id:'slime',name:'Mire Slime',biome:'Marsh',x:85,z:-100,hp:95,damage:13,speed:1.9,xp:48,level:7,mechanic:'slow',color:0x9cc673},
 {id:'witch',name:'Bog Witch',biome:'Marsh',x:137,z:-162,hp:110,damage:19,speed:2.3,xp:65,level:9,mechanic:'poison',color:0xb1a0cc},
 {id:'basilisk',name:'Marsh Basilisk',biome:'Marsh',x:63,z:-185,hp:170,damage:22,speed:3.1,xp:78,level:10,mechanic:'venom',color:0x9fb563},
 {id:'wraith',name:'Frost Wraith',biome:'Mountains',x:36,z:-266,hp:130,damage:24,speed:3.5,xp:88,level:12,mechanic:'frost',color:0xb9e6ef},
 {id:'troll',name:'Ice Troll',biome:'Mountains',x:-104,z:-260,hp:290,damage:36,speed:1.6,xp:120,level:14,mechanic:'slam',color:0xc1dae1},
 {id:'harpy',name:'Mountain Harpy',biome:'Mountains',x:70,z:-240,hp:125,damage:23,speed:4,xp:92,level:12,mechanic:'dive',color:0xd7e5dd},
 {id:'sentinel',name:'Ancient Sentinel',biome:'Ruins',x:-205,z:-240,hp:250,damage:30,speed:1.9,xp:115,level:16,mechanic:'guard',color:0xd0b881}
];
export const EXPANSION_DUNGEONS=[
 {id:'roots',name:'Rootbound Catacombs',x:-79,z:32,origin:500,color:0x425348,light:0xd9ba76,enemies:['thornling','wraith'],boss:'warden',hazard:'roots'},
 {id:'sunken',name:'The Sunken Temple',x:94,z:-163,origin:700,color:0x496b68,light:0x8ce2cd,enemies:['slime','witch','basilisk'],boss:'serpent',hazard:'water'},
 {id:'frost',name:'Frostspire Crypt',x:-105,z:-295,origin:900,color:0x79939f,light:0xb5d9fa,enemies:['wraith','troll','harpy'],boss:'wyrm',hazard:'ice'},
 {id:'forge',name:'The Obsidian Forge',x:-240,z:-207,origin:1100,color:0x3f4146,light:0xffa965,enemies:['sentinel','troll'],boss:'titan',hazard:'lava'}
];
export const EXPANSION_BOSSES=[
 {id:'warden',name:'The Grove Warden',dungeon:'roots',kind:'warden',hp:550,damage:27,speed:2,level:8,xp:300,weapon:'Rootcrown Cleaver',power:30,color:0x85aa5b,mechanic:'thorns'},
 {id:'serpent',name:'Nythra, the Bog Serpent',dungeon:'sunken',kind:'serpent',hp:760,damage:32,speed:3,level:13,xp:430,weapon:'Nythra’s Fang',power:38,color:0xbad478,mechanic:'venom'},
 {id:'knight',name:'The Hollow Knight',x:-70,z:-154,kind:'knight',hp:840,damage:34,speed:2.6,level:16,xp:500,weapon:'Hollow Oath',power:43,color:0xb2bcca,mechanic:'guard'},
 {id:'wyrm',name:'Skarveth, the Frost Wyrm',dungeon:'frost',kind:'wyrm',hp:1080,damage:38,speed:3,level:21,xp:650,weapon:'Winter’s Edge',power:49,color:0xc2e6f2,mechanic:'frost'},
 {id:'titan',name:'The Ash Titan',dungeon:'forge',kind:'titan',hp:1300,damage:44,speed:1.7,level:26,xp:820,weapon:'Heart of the Forge',power:56,color:0xffb15b,mechanic:'slam'},
 {id:'priestess',name:'Selene, the Moon Priestess',x:92,z:-300,kind:'priestess',hp:1120,damage:36,speed:2.8,level:25,xp:760,weapon:'Moonlit Grace',power:54,color:0xd6d5ef,mechanic:'moon'},
 {id:'king',name:'The Forgotten King',x:-284,z:-299,kind:'king',hp:1750,damage:48,speed:2.5,level:32,xp:1200,weapon:'The Last Crown',power:64,color:0xe1bd77,mechanic:'royal'}
];
export const PETS=[
 {id:'fox',name:'Forest Fox',description:'An inquisitive friend. +3% walking speed.',cost:80,level:1},
 {id:'wolf',name:'Wolf Pup',description:'A loyal hunter. +2 melee damage.',cost:180,level:4},
 {id:'owl',name:'Arcane Owl',description:'A watchful guide. +2% critical chance.',cost:260,level:7},
 {id:'dragon',name:'Baby Dragon',description:'A playful ember. +1.5 stamina regeneration.',cost:440,level:12},
 {id:'golem',name:'Miniature Stone Golem',description:'A patient guardian. +2 defence.',cost:380,level:10}
];
export const MOUNTS=[
 {id:'horse',name:'Wayfarer Horse',cost:220,level:3,speed:10,acceleration:4,turn:4,stamina:130},
 {id:'wolf',name:'Dire Wolf',cost:480,level:8,speed:11,acceleration:6,turn:6,stamina:115},
 {id:'emberhorn',name:'Emberhorn',cost:850,level:16,speed:12,acceleration:3.5,turn:3.5,stamina:170}
];
