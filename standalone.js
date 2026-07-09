/* BrowserQuest Standalone Game v3
 * Major renovation: area transitions, enemy AI, terrain, lighting, map, sword animations
 * Architecture: IIFE module, no external dependencies, Canvas 2D rendering with shape rendering
 */
(function () {
    'use strict';

    // ====================================================================
    // CONSTANTS
    // ====================================================================

    var STORAGE_KEY = 'bq_standalone_v4';
    var LEGACY_STORAGE_KEYS = ['bq_standalone_v3'];
    var SAVE_VERSION = 4;
    var CANVAS_W = 1100;
    var CANVAS_H = 620;
    var TRANSITION_THRESHOLD = 80;    // px from edge to trigger area transition
    var FADE_OUT_DUR = 0.20;          // seconds for fade-to-black
    var FADE_IN_DUR  = 0.28;          // seconds for fade-from-black
    var RESPAWN_COOLDOWN_TICKS = 600; // ~10 s at 60fps before enemies respawn in a cleared area

    // ====================================================================
    // WORLD AREAS
    // neighbors: { right, left, up, down } — area id or null (world boundary)
    // biome: 'meadow'|'forest'|'town'|'cave'|'keep'|'lair'
    // ambientLight: 1.0 = fully lit, 0 = pitch black (applied as dark overlay)
    // ====================================================================

    var AREAS = [
        {
            id: 0, name: 'Sunlit Meadow',
            biome: 'meadow',
            bgColor: '#4a8a22', gridColor: 'rgba(80,160,40,0.20)',
            borderColor: 'rgba(120,200,60,0.40)',
            ambientLight: 1.0,
            neighbors: { right: 1, left: null, up: null, down: 3 },
            enemyTypes: ['rat', 'goblin'],
            enemyCount: 3, difficulty: 1.0,
            description: 'A sun-drenched meadow with wildflowers and rustling grass.',
            storyTag: 'village_outskirts'
        },
        {
            id: 1, name: 'Forest Clearing',
            biome: 'forest',
            bgColor: '#2a6010', gridColor: 'rgba(50,120,30,0.28)',
            borderColor: 'rgba(80,160,40,0.30)',
            ambientLight: 0.80,
            neighbors: { right: 2, left: 0, up: null, down: 4 },
            enemyTypes: ['rat', 'goblin'],
            enemyCount: 4, difficulty: 1.2,
            description: 'Tall oaks and pines. Sunlight filters through the canopy.',
            storyTag: 'forest'
        },
        {
            id: 2, name: 'Ancient Town',
            biome: 'town',
            bgColor: '#9a8a6a', gridColor: 'rgba(160,140,100,0.28)',
            borderColor: 'rgba(210,190,130,0.40)',
            ambientLight: 1.0,
            neighbors: { right: null, left: 1, up: null, down: 5 },
            enemyTypes: ['goblin', 'skeleton'],
            enemyCount: 3, difficulty: 1.4,
            description: 'Crumbling stone buildings. Goblins have ransacked the market.',
            storyTag: 'village'
        },
        {
            id: 3, name: 'Dark Caves',
            biome: 'cave',
            bgColor: '#0d0d1a', gridColor: 'rgba(40,40,100,0.35)',
            borderColor: 'rgba(80,80,180,0.25)',
            ambientLight: 0.22,
            neighbors: { right: null, left: null, up: 0, down: 6 },
            enemyTypes: ['bat', 'skeleton'],
            enemyCount: 4, difficulty: 1.5,
            description: 'Eerie tunnels echoing with bat wings and rattling bones.',
            storyTag: 'caves'
        },
        {
            id: 4, name: 'Cursed Keep',
            biome: 'keep',
            bgColor: '#1a0d0d', gridColor: 'rgba(90,20,20,0.35)',
            borderColor: 'rgba(160,40,40,0.25)',
            ambientLight: 0.28,
            neighbors: { right: 5, left: null, up: 1, down: null },
            enemyTypes: ['skeleton', 'skeleton2', 'ogre'],
            enemyCount: 4, difficulty: 2.0,
            description: 'A crumbling fortress haunted by the cursed dead.',
            storyTag: 'keep'
        },
        {
            id: 5, name: 'Shadow Fortress',
            biome: 'keep',
            bgColor: '#120808', gridColor: 'rgba(100,20,20,0.40)',
            borderColor: 'rgba(180,50,50,0.28)',
            ambientLight: 0.18,
            neighbors: { right: 6, left: 4, up: 2, down: null },
            enemyTypes: ['skeleton2', 'ogre', 'eye'],
            enemyCount: 5, difficulty: 2.5,
            description: 'A dark iron fortress. Evil saturates the air.',
            storyTag: 'fortress'
        },
        {
            id: 6, name: "Dragon's Lair",
            biome: 'lair',
            bgColor: '#1a0800', gridColor: 'rgba(110,35,0,0.45)',
            borderColor: 'rgba(200,60,0,0.30)',
            ambientLight: 0.12,
            neighbors: { right: null, left: 5, up: 3, down: null },
            enemyTypes: ['eye', 'boss'],
            enemyCount: 3, difficulty: 3.0,
            description: 'A scorched lair. The air reeks of sulfur and ancient power.',
            storyTag: 'lair'
        },
        {
            id: 7, name: "Elder's Hall",
            biome: 'town',
            bgColor: '#8f7d5a', gridColor: 'rgba(160,140,100,0.22)',
            borderColor: 'rgba(210,190,130,0.35)',
            ambientLight: 0.92,
            neighbors: { right: null, left: null, up: null, down: null },
            enemyTypes: [],
            enemyCount: 0, difficulty: 0.0,
            description: 'The elder gathers relic lore and plans the cleansing ritual.',
            isInterior: true,
            storyTag: 'elder_hall'
        },
        {
            id: 8, name: 'Ironbound Smithy',
            biome: 'town',
            bgColor: '#7a6248', gridColor: 'rgba(140,110,80,0.20)',
            borderColor: 'rgba(200,160,110,0.35)',
            ambientLight: 0.88,
            neighbors: { right: null, left: null, up: null, down: null },
            enemyTypes: [],
            enemyCount: 0, difficulty: 0.0,
            description: 'A workshop where relics are traded for gear and supplies.',
            isInterior: true,
            storyTag: 'smithy'
        },
        {
            id: 9, name: 'Relic Cavern',
            biome: 'cave',
            bgColor: '#15142a', gridColor: 'rgba(50,50,110,0.35)',
            borderColor: 'rgba(90,90,180,0.30)',
            ambientLight: 0.25,
            neighbors: { right: null, left: null, up: null, down: null },
            enemyTypes: ['bat', 'skeleton'],
            enemyCount: 3, difficulty: 1.6,
            description: 'Fragments of a broken relic hum through this hidden cavern.',
            isInterior: true,
            storyTag: 'relic_cavern'
        },
        {
            id: 10, name: 'Shadow Sanctum',
            biome: 'keep',
            bgColor: '#130606', gridColor: 'rgba(110,20,20,0.44)',
            borderColor: 'rgba(185,45,45,0.32)',
            ambientLight: 0.14,
            neighbors: { right: null, left: null, up: null, down: null },
            enemyTypes: ['eye', 'boss'],
            enemyCount: 2, difficulty: 3.2,
            description: 'The core chamber where the final shadow relic feeds corruption.',
            isInterior: true,
            storyTag: 'shadow_sanctum'
        }
    ];

    // ====================================================================
    // TERRAIN OBSTACLES per area
    // type: 'tree' {x,y,r} | 'water' {x,y,w,h} | 'rect' {x,y,w,h} | 'circle' {x,y,r}
    // All types are solid (impassable); drawing varies by type+biome
    // ====================================================================

    var AREA_OBSTACLES = [
        // 0: Sunlit Meadow
        [
            { type: 'tree',   x: 160,  y: 130,  r: 26 },
            { type: 'tree',   x: 900,  y: 160,  r: 24 },
            { type: 'tree',   x: 130,  y: 430,  r: 26 },
            { type: 'tree',   x: 960,  y: 460,  r: 24 },
            { type: 'water',  x: 380,  y: 310,  w: 130, h: 65 },
            { type: 'tree',   x: 660,  y: 400,  r: 22 },
            { type: 'circle', x: 260,  y: 500,  r: 16 }
        ],
        // 1: Forest Clearing
        [
            { type: 'tree',  x: 110,  y: 90,   r: 30 },
            { type: 'tree',  x: 290,  y: 75,   r: 26 },
            { type: 'tree',  x: 540,  y: 100,  r: 32 },
            { type: 'tree',  x: 810,  y: 85,   r: 28 },
            { type: 'tree',  x: 980,  y: 130,  r: 26 },
            { type: 'tree',  x: 80,   y: 360,  r: 30 },
            { type: 'tree',  x: 360,  y: 440,  r: 28 },
            { type: 'tree',  x: 730,  y: 490,  r: 30 },
            { type: 'tree',  x: 1020, y: 420,  r: 26 },
            { type: 'rect',  x: 470,  y: 230,  w: 50, h: 170 },
            { type: 'water', x: 600,  y: 350,  w: 100, h: 60 }
        ],
        // 2: Ancient Town
        [
            { type: 'rect',   x: 70,   y: 70,   w: 150, h: 110 },
            { type: 'rect',   x: 290,  y: 55,   w: 130, h: 95  },
            { type: 'rect',   x: 690,  y: 70,   w: 170, h: 115 },
            { type: 'rect',   x: 900,  y: 90,   w: 110, h: 85  },
            { type: 'rect',   x: 55,   y: 400,  w: 120, h: 130 },
            { type: 'rect',   x: 860,  y: 430,  w: 140, h: 110 },
            { type: 'circle', x: 490,  y: 370,  r: 24          },
            { type: 'rect',   x: 0,    y: 240,  w: 45,  h: 130 },
            { type: 'rect',   x: 1055, y: 240,  w: 45,  h: 130 },
            { type: 'tree',   x: 500,  y: 200,  r: 22          }
        ],
        // 3: Dark Caves
        [
            { type: 'rect',   x: 0,    y: 0,    w: 110, h: 190 },
            { type: 'rect',   x: 990,  y: 0,    w: 110, h: 190 },
            { type: 'rect',   x: 0,    y: 430,  w: 110, h: 190 },
            { type: 'rect',   x: 990,  y: 430,  w: 110, h: 190 },
            { type: 'circle', x: 310,  y: 210,  r: 20          },
            { type: 'circle', x: 620,  y: 150,  r: 18          },
            { type: 'circle', x: 820,  y: 310,  r: 20          },
            { type: 'circle', x: 400,  y: 460,  r: 18          },
            { type: 'rect',   x: 440,  y: 265,  w: 220, h: 28  }
        ],
        // 4: Cursed Keep
        [
            { type: 'rect',   x: 0,    y: 0,    w: 220, h: 28  },
            { type: 'rect',   x: 880,  y: 0,    w: 220, h: 28  },
            { type: 'rect',   x: 0,    y: 592,  w: 220, h: 28  },
            { type: 'rect',   x: 880,  y: 592,  w: 220, h: 28  },
            { type: 'rect',   x: 190,  y: 140,  w: 32,  h: 210 },
            { type: 'rect',   x: 878,  y: 140,  w: 32,  h: 210 },
            { type: 'rect',   x: 370,  y: 240,  w: 360, h: 22  },
            { type: 'circle', x: 240,  y: 410,  r: 20          },
            { type: 'circle', x: 860,  y: 390,  r: 20          }
        ],
        // 5: Shadow Fortress
        [
            { type: 'rect',   x: 0,    y: 0,    w: 28,  h: 620 },
            { type: 'rect',   x: 1072, y: 0,    w: 28,  h: 620 },
            { type: 'rect',   x: 240,  y: 75,   w: 65,  h: 210 },
            { type: 'rect',   x: 795,  y: 75,   w: 65,  h: 210 },
            { type: 'rect',   x: 305,  y: 75,   w: 490, h: 28  },
            { type: 'rect',   x: 305,  y: 270,  w: 490, h: 28  },
            { type: 'circle', x: 550,  y: 460,  r: 28          }
        ],
        // 6: Dragon's Lair
        [
            { type: 'circle', x: 140,  y: 95,   r: 32          },
            { type: 'circle', x: 960,  y: 95,   r: 32          },
            { type: 'circle', x: 140,  y: 525,  r: 32          },
            { type: 'circle', x: 960,  y: 525,  r: 32          },
            { type: 'rect',   x: 370,  y: 0,    w: 360, h: 55  },
            { type: 'rect',   x: 180,  y: 240,  w: 210, h: 22  },
            { type: 'rect',   x: 710,  y: 240,  w: 210, h: 22  },
            { type: 'circle', x: 550,  y: 170,  r: 30          }
        ],
        // 7: Elder's Hall (interior)
        [
            { type: 'rect', x: 0,   y: 0,   w: 1100, h: 28 },
            { type: 'rect', x: 0,   y: 592, w: 1100, h: 28 },
            { type: 'rect', x: 0,   y: 0,   w: 28,   h: 620 },
            { type: 'rect', x: 1072,y: 0,   w: 28,   h: 620 },
            { type: 'rect', x: 330, y: 130, w: 440,  h: 20  },
            { type: 'circle', x: 220, y: 210, r: 18 },
            { type: 'circle', x: 880, y: 210, r: 18 }
        ],
        // 8: Ironbound Smithy (interior)
        [
            { type: 'rect', x: 0,   y: 0,   w: 1100, h: 28 },
            { type: 'rect', x: 0,   y: 592, w: 1100, h: 28 },
            { type: 'rect', x: 0,   y: 0,   w: 28,   h: 620 },
            { type: 'rect', x: 1072,y: 0,   w: 28,   h: 620 },
            { type: 'rect', x: 430, y: 110, w: 240,  h: 70  },
            { type: 'rect', x: 180, y: 280, w: 180,  h: 24  },
            { type: 'rect', x: 740, y: 280, w: 180,  h: 24  }
        ],
        // 9: Relic Cavern (interior)
        [
            { type: 'rect', x: 0,   y: 0,   w: 145, h: 210 },
            { type: 'rect', x: 955, y: 0,   w: 145, h: 210 },
            { type: 'rect', x: 0,   y: 410, w: 160, h: 210 },
            { type: 'rect', x: 940, y: 410, w: 160, h: 210 },
            { type: 'circle', x: 300, y: 240, r: 26 },
            { type: 'circle', x: 800, y: 260, r: 26 },
            { type: 'rect', x: 460, y: 320, w: 180, h: 24 }
        ],
        // 10: Shadow Sanctum (interior)
        [
            { type: 'rect', x: 0,   y: 0,   w: 40,  h: 620 },
            { type: 'rect', x: 1060,y: 0,   w: 40,  h: 620 },
            { type: 'rect', x: 260, y: 70,  w: 580, h: 30  },
            { type: 'rect', x: 260, y: 290, w: 580, h: 30  },
            { type: 'circle', x: 550, y: 500, r: 34 }
        ]
    ];

    var STORY_CHAPTERS = [
        'The elder senses shadow relic corruption spreading from the fortress.',
        'Gather clues from villagers, rangers, and scholars in nearby regions.',
        'Recover relic fragments from wild zones and the Relic Cavern.',
        'Prepare for the fortress by trading relics for tools and upgrades.',
        'Enter the Shadow Sanctum and cleanse the final relic.'
    ];

    var QUEST_STEPS = [
        'Speak to Elder Mira in the village hall.',
        'Gather guidance in the forest and cave routes.',
        'Recover 3 relic fragments from dangerous areas.',
        'Acquire Fortress Sigil access and enter the fortress.',
        'Prepare for the assault by purchasing at least 2 vendor upgrades.',
        'Confront the Shadow Sanctum and end the corruption.'
    ];

    var NPC_DEFS = [
        { id: 'elder_mira', name: 'Elder Mira', role: 'village elder', areaId: 7, x: 550, y: 220, vendorId: null },
        { id: 'tovin_smith', name: 'Tovin', role: 'blacksmith', areaId: 8, x: 450, y: 260, vendorId: 'smith_vendor' },
        { id: 'lyra_scholar', name: 'Lyra', role: 'relic scholar', areaId: 2, x: 500, y: 320, vendorId: null },
        { id: 'bran_ranger', name: 'Bran', role: 'ranger', areaId: 1, x: 180, y: 280, vendorId: null },
        { id: 'fort_guard', name: 'Captain Varr', role: 'guard', areaId: 5, x: 150, y: 335, vendorId: 'guard_vendor' },
        { id: 'mira_merchant', name: 'Sela', role: 'merchant', areaId: 2, x: 770, y: 260, vendorId: 'merchant_vendor' }
    ];

    var VENDOR_STOCK = {
        merchant_vendor: [
            { id: 'healing_draught', name: 'Healing Draught', cost: 2, desc: '+40 HP now', repeatable: true, effect: 'heal', value: 40 },
            { id: 'map_charter', name: 'Map Charter', cost: 4, desc: 'Reveal all known regions on map', effect: 'upgrade', key: 'mapCharter' }
        ],
        smith_vendor: [
            { id: 'tempered_blade', name: 'Tempered Blade', cost: 5, desc: 'Upgrade to Blue Sword', effect: 'weapon', weapon: 'bluesword' },
            { id: 'reinforced_mail', name: 'Reinforced Mail', cost: 5, desc: 'Upgrade to Mail Armor', effect: 'armor', armor: 'mailarmor' },
            { id: 'lantern_kit', name: 'Lantern Kit', cost: 3, desc: 'Brightens dark areas', effect: 'upgrade', key: 'lantern' }
        ],
        guard_vendor: [
            { id: 'fortress_sigil', name: 'Fortress Sigil', cost: 6, desc: 'Unlock Shadow Sanctum gate', effect: 'flag', key: 'fortressAccess' }
        ]
    };

    var PORTALS = [
        { id: 'town_to_elder', name: "Elder's Hall Door", areaId: 2, x: 145, y: 194, r: 24, targetAreaId: 7, targetX: 550, targetY: 520, label: 'Enter Elder Hall' },
        { id: 'elder_to_town', name: 'Hall Exit', areaId: 7, x: 550, y: 556, r: 28, targetAreaId: 2, targetX: 145, targetY: 230, label: 'Exit to Ancient Town' },
        { id: 'town_to_smith', name: 'Smithy Door', areaId: 2, x: 355, y: 166, r: 24, targetAreaId: 8, targetX: 560, targetY: 520, label: 'Enter Smithy' },
        { id: 'smith_to_town', name: 'Smithy Exit', areaId: 8, x: 560, y: 556, r: 28, targetAreaId: 2, targetX: 355, targetY: 205, label: 'Exit to Ancient Town' },
        { id: 'forest_to_cavern', name: 'Cave Mouth', areaId: 1, x: 920, y: 300, r: 28, targetAreaId: 9, targetX: 550, targetY: 520, label: 'Enter Relic Cavern' },
        { id: 'cavern_to_forest', name: 'Cavern Exit', areaId: 9, x: 550, y: 556, r: 28, targetAreaId: 1, targetX: 920, targetY: 340, label: 'Exit to Forest Clearing' },
        { id: 'fortress_to_sanctum', name: 'Sanctum Gate', areaId: 5, x: 550, y: 334, r: 28, targetAreaId: 10, targetX: 550, targetY: 520, requiresFlag: 'fortressAccess', lockedMsg: 'The gate is sealed. Captain Varr can provide a Fortress Sigil.', label: 'Enter Shadow Sanctum' },
        { id: 'sanctum_to_fortress', name: 'Sanctum Exit', areaId: 10, x: 550, y: 556, r: 28, targetAreaId: 5, targetX: 550, targetY: 375, label: 'Exit to Shadow Fortress' }
    ];

    // ====================================================================
    // ENEMY DEFINITIONS  (added aggroRadius, leashRadius, patrolSpeed)
    // ====================================================================

    var ENEMY_DEFS = {
        rat: {
            name: 'Rat', color: '#7a3a10', size: 9,
            maxHp: 3, attack: 8, speed: 68, xp: 5,
            itemChance: 0.15, items: ['flask'],
            aggroRadius: 90, leashRadius: 200, patrolSpeed: 28
        },
        goblin: {
            name: 'Goblin', color: '#2e6e18', size: 11,
            maxHp: 6, attack: 12, speed: 52, xp: 12,
            itemChance: 0.22, items: ['flask', 'sword1'],
            aggroRadius: 110, leashRadius: 230, patrolSpeed: 32
        },
        bat: {
            name: 'Bat', color: '#4a1e6a', size: 10,
            maxHp: 5, attack: 10, speed: 88, xp: 12,
            itemChance: 0.15, items: ['flask'],
            aggroRadius: 130, leashRadius: 260, patrolSpeed: 38
        },
        skeleton: {
            name: 'Skeleton', color: '#c0c0c0', size: 12,
            maxHp: 9, attack: 16, speed: 46, xp: 20,
            itemChance: 0.28, items: ['flask', 'clotharmor'],
            aggroRadius: 115, leashRadius: 240, patrolSpeed: 25
        },
        skeleton2: {
            name: 'Armored Skeleton', color: '#a0a8b0', size: 13,
            maxHp: 14, attack: 20, speed: 50, xp: 28,
            itemChance: 0.35, items: ['mailarmor', 'bluesword'],
            aggroRadius: 125, leashRadius: 255, patrolSpeed: 28
        },
        ogre: {
            name: 'Ogre', color: '#5e3618', size: 18,
            maxHp: 22, attack: 26, speed: 36, xp: 45,
            itemChance: 0.42, items: ['bluesword', 'leatherarmor', 'firepotion'],
            aggroRadius: 140, leashRadius: 270, patrolSpeed: 18
        },
        eye: {
            name: 'Evil Eye', color: '#a01818', size: 14,
            maxHp: 16, attack: 22, speed: 72, xp: 32,
            itemChance: 0.38, items: ['firepotion', 'bluesword'],
            aggroRadius: 155, leashRadius: 295, patrolSpeed: 35
        },
        boss: {
            name: 'Dragon', color: '#780000', size: 22,
            maxHp: 65, attack: 38, speed: 42, xp: 160,
            itemChance: 0.85, items: ['goldensword', 'goldenarmor', 'firepotion'],
            aggroRadius: 200, leashRadius: 400, patrolSpeed: 20
        }
    };

    var ITEM_DEFS = {
        sword1:      { name: 'Iron Sword',    type: 'weapon', color: '#b0b0b0', subColor: '#787878', attackBonus: 15, range: 10 },
        bluesword:   { name: 'Blue Sword',    type: 'weapon', color: '#4488ff', subColor: '#2244bb', attackBonus: 30, range: 15 },
        goldensword: { name: 'Golden Sword',  type: 'weapon', color: '#ffd700', subColor: '#b8860b', attackBonus: 50, range: 20 },
        clotharmor:  { name: 'Cloth Armor',   type: 'armor',  color: '#8b6914', subColor: '#5a4510', defenseBonus: 12 },
        leatherarmor:{ name: 'Leather Armor', type: 'armor',  color: '#8b4513', subColor: '#5a2b0d', defenseBonus: 22 },
        mailarmor:   { name: 'Mail Armor',    type: 'armor',  color: '#909090', subColor: '#585858', defenseBonus: 35 },
        goldenarmor: { name: 'Golden Armor',  type: 'armor',  color: '#ffd700', subColor: '#b8860b', defenseBonus: 50 },
        flask:       { name: 'Health Flask',  type: 'heal',   color: '#2ecc71', subColor: '#1a7a45', heal: 28 },
        firepotion:  { name: 'Fire Potion',   type: 'heal',   color: '#e74c3c', subColor: '#922b21', heal: 65 },
        relic:       { name: 'Ancient Relic', type: 'relic',  color: '#ffd76b', subColor: '#9b7200' }
    };

    var XP_TABLE = [0, 50, 120, 220, 350, 520, 730, 990, 1310, 1700];

    var HP_SCALING_FACTOR    = 0.35;
    var DMG_VARIANCE_MIN     = 0.85;
    var DMG_VARIANCE_RANGE   = 0.30;
    var ENEMY_DMG_PER_SEC    = 2.80;
    var ATTACK_COOLDOWN_SECS = 0.38;
    var DEF_CAP_PCT          = 80;

    // ====================================================================
    // RUNTIME STATE
    // ====================================================================

    var state;
    var paused           = false;
    var lastTick         = 0;
    var animFrame        = null;
    var keys             = {};
    var mouseTarget      = null;
    var floatTexts       = [];
    var hitFlashes       = [];
    var notifQueue       = [];
    var notifTimer       = 0;
    var mapOpen          = false;
    var transitionCooldown = 0; // seconds guard after a transition completes
    var interactionContext = null;
    var interactionCooldown = 0;
    var transitionBlockCooldown = 0;

    // Transition state (phase: 'none' | 'fadeout' | 'fadein')
    var trans = { active: false, phase: 'none', timer: 0, dir: null, fromAreaId: 0, toAreaId: 0, targetX: 0, targetY: 0, msg: '' };

    // Sword-swing animation
    var swordSwing = { active: false, progress: 0, duration: 0.22, dir: 0, hitDealt: false };

    // DOM refs
    var canvas, ctx;
    var elStatus, elHealth, elScore, elRelics, elLevel, elXp, elArea;
    var elWeapon, elArmor, elKills, elAtk, elDef, elNotif, elObjective;
    var elPauseBtn, elHint;

    // ====================================================================
    // HELPERS
    // ====================================================================

    function rnd(min, max)  { return Math.random() * (max - min) + min; }
    function rndInt(min, max){ return Math.floor(rnd(min, max + 1)); }
    function dist2(a, b)    { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
    function clamp(v, lo, hi){ return v < lo ? lo : (v > hi ? hi : v); }
    function easeInOut(t)   { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function addFloat(x, y, text, color, size) {
        floatTexts.push({ x: x, y: y, text: text, color: color || '#fff', size: size || 14, age: 0, life: 1.6, vy: -36 });
    }
    function addHitFlash(x, y, radius) {
        hitFlashes.push({ x: x, y: y, r: radius, age: 0, life: 0.28 });
    }
    function showNotif(msg) { notifQueue.push(msg); if (notifTimer <= 0) showNextNotif(); }
    function showNextNotif() {
        if (notifQueue.length === 0) { if (elNotif) elNotif.textContent = ''; notifTimer = 0; return; }
        if (elNotif) elNotif.textContent = notifQueue.shift();
        notifTimer = 2.8;
    }
    function setStatus(mode, msg) {
        if (!elStatus) return;
        elStatus.className = 'status status-' + mode;
        elStatus.textContent = 'Status: ' + msg;
    }

    // ====================================================================
    // COLLISION
    // ====================================================================

    function getObstacles(areaIndex) {
        var idx = (typeof areaIndex === 'number') ? areaIndex : state.areaIndex;
        return AREA_OBSTACLES[idx] || [];
    }

    function isBlockedInArea(areaIndex, px, py, radius) {
        var r   = radius || 14;
        var obs = getObstacles(areaIndex);
        for (var i = 0; i < obs.length; i++) {
            var o = obs[i];
            if (o.type === 'rect' || o.type === 'water') {
                var cx = clamp(px, o.x, o.x + o.w);
                var cy = clamp(py, o.y, o.y + o.h);
                var dx = px - cx, dy = py - cy;
                if (dx * dx + dy * dy < r * r) { return true; }
            } else {
                var dx2 = px - o.x, dy2 = py - o.y, md = r + o.r;
                if (dx2 * dx2 + dy2 * dy2 < md * md) { return true; }
            }
        }
        return false;
    }

    function isBlocked(px, py, radius) {
        return isBlockedInArea(state.areaIndex, px, py, radius);
    }

    function isSpawnClear(areaIndex, x, y, radius) {
        var r = radius || 14;
        if (x < r || x > CANVAS_W - r || y < r || y > CANVAS_H - r) return false;
        return !isBlockedInArea(areaIndex, x, y, r);
    }

    function findSafeSpawn(areaIndex, desiredX, desiredY, radius, maxRange) {
        var r = radius || 14;
        var max = maxRange || 140;
        var x = clamp(desiredX, r + 2, CANVAS_W - r - 2);
        var y = clamp(desiredY, r + 2, CANVAS_H - r - 2);
        if (isSpawnClear(areaIndex, x, y, r)) return { x: x, y: y, adjusted: false };

        var step = 16;
        for (var rad = step; rad <= max; rad += step) {
            for (var a = 0; a < Math.PI * 2; a += Math.PI / 10) {
                var tx = clamp(x + Math.cos(a) * rad, r + 2, CANVAS_W - r - 2);
                var ty = clamp(y + Math.sin(a) * rad, r + 2, CANVAS_H - r - 2);
                if (isSpawnClear(areaIndex, tx, ty, r)) return { x: tx, y: ty, adjusted: true };
            }
        }
        return null;
    }

    // ====================================================================
    // HERO STATS
    // ====================================================================

    function getHeroAttack() {
        var atk = state.hero.attack;
        if (state.hero.weapon && ITEM_DEFS[state.hero.weapon]) atk += ITEM_DEFS[state.hero.weapon].attackBonus || 0;
        return atk;
    }
    function getHeroDefense() {
        var def = state.hero.defense;
        if (state.hero.armor && ITEM_DEFS[state.hero.armor]) def += ITEM_DEFS[state.hero.armor].defenseBonus || 0;
        return Math.min(DEF_CAP_PCT, def);
    }
    function getAttackRange() {
        var range = 58;
        if (state.hero.weapon && ITEM_DEFS[state.hero.weapon]) range += ITEM_DEFS[state.hero.weapon].range || 0;
        return range;
    }

    // ====================================================================
    // BASE STATE
    // ====================================================================

    function makeHero() {
        return { x: CANVAS_W / 2, y: CANVAS_H / 2, speed: 148, radius: 14,
                 hp: 100, maxHp: 100, attack: 18, defense: 0, level: 1, xp: 0,
                 weapon: null, armor: null, attackCooldown: 0, hitFlash: 0, kills: 0, facing: 0 };
    }
    function makeStoryState() {
        return {
            chapter: 0,
            flags: {
                metElder: false,
                gatheredGuidance: false,
                relicTargetReached: false,
                fortressAccess: false,
                sanctumEntered: false,
                shadowCleansed: false
            },
            loreNotes: [],
            discoveredLocations: [0]
        };
    }
    function makeQuestState() {
        return { id: 'shadow_relics', step: 0, completed: false, objective: QUEST_STEPS[0] };
    }
    function makeBaseState() {
        return { areaIndex: 0, areasVisited: [0], hero: makeHero(), enemies: [], items: [],
                 score: 0, relics: 0, totalKills: 0, tick: 0, areaEnemyState: {},
                 storyState: makeStoryState(), questState: makeQuestState(),
                 vendorPurchases: {}, upgrades: { mapCharter: false, lantern: false },
                 purchaseCount: 0, npcFlags: {} };
    }

    // ====================================================================
    // SAVE / LOAD
    // ====================================================================

    function serialize() {
        return { version: SAVE_VERSION, areaIndex: state.areaIndex, areasVisited: state.areasVisited,
                 hero: state.hero, enemies: state.enemies, items: state.items,
                 score: state.score, relics: state.relics, totalKills: state.totalKills,
                 tick: state.tick, areaEnemyState: state.areaEnemyState || {},
                 storyState: state.storyState, questState: state.questState,
                 vendorPurchases: state.vendorPurchases, upgrades: state.upgrades,
                 purchaseCount: state.purchaseCount, npcFlags: state.npcFlags,
                 theme: document.body.getAttribute('data-theme') || 'dark' };
    }
    function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize())); } catch (e) {} }
    function migrateSaveData(data) {
        if (!data || !data.hero) return null;
        var out = JSON.parse(JSON.stringify(data));
        if (out.version !== SAVE_VERSION) {
            out.storyState = out.storyState || makeStoryState();
            out.questState = out.questState || makeQuestState();
            out.vendorPurchases = out.vendorPurchases || {};
            out.upgrades = out.upgrades || { mapCharter: false, lantern: false };
            out.purchaseCount = (typeof out.purchaseCount === 'number') ? out.purchaseCount : 0;
            out.npcFlags = out.npcFlags || {};
            out.version = SAVE_VERSION;
        }
        return out;
    }
    function ensureHeroSafePosition() {
        var safe = findSafeSpawn(state.areaIndex, state.hero.x, state.hero.y, state.hero.radius, 180);
        if (safe && (safe.adjusted || safe.x !== state.hero.x || safe.y !== state.hero.y)) {
            state.hero.x = safe.x;
            state.hero.y = safe.y;
            showNotif('Relocated to a safe spawn point.');
        }
        if (!safe) {
            state.hero.x = CANVAS_W / 2;
            state.hero.y = CANVAS_H / 2;
        }
    }
    function syncStateDefaults() {
        if (!Array.isArray(state.enemies))       state.enemies = [];
        if (!Array.isArray(state.items))         state.items = [];
        if (typeof state.areaIndex !== 'number') state.areaIndex = 0;
        if (!Array.isArray(state.areasVisited))  state.areasVisited = [0];
        if (typeof state.totalKills !== 'number')state.totalKills = 0;
        if (!state.areaEnemyState)               state.areaEnemyState = {};
        if (!state.storyState)                   state.storyState = makeStoryState();
        if (!state.questState)                   state.questState = makeQuestState();
        if (!state.vendorPurchases)              state.vendorPurchases = {};
        if (!state.upgrades)                     state.upgrades = { mapCharter: false, lantern: false };
        if (typeof state.purchaseCount !== 'number') state.purchaseCount = 0;
        if (!state.npcFlags)                     state.npcFlags = {};
        if (!Array.isArray(state.storyState.discoveredLocations)) state.storyState.discoveredLocations = [0];
        if (!state.storyState.flags)             state.storyState.flags = makeStoryState().flags;
        var base = makeHero();
        Object.keys(base).forEach(function (k) { if (state.hero[k] === undefined) state.hero[k] = base[k]; });
        ensureHeroSafePosition();
    }
    function loadSave() {
        var fresh = false;
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                for (var i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
                   raw = localStorage.getItem(LEGACY_STORAGE_KEYS[i]);
                   if (raw) break;
                }
            }
            if (!raw) { fresh = true; }
            else {
                var d = JSON.parse(raw);
                state = migrateSaveData(d);
                if (!state) { fresh = true; }
                else {
                   syncStateDefaults();
                   if (d.version && d.version !== SAVE_VERSION) showNotif('Save migrated from v' + d.version + ' to v' + SAVE_VERSION + '.');
                   if (d.theme === 'light') document.body.setAttribute('data-theme', 'light');
                   setStatus('ready', 'Ready (save restored)');
                }
            }
        } catch (e) { fresh = true; }
        if (fresh) { state = makeBaseState(); populateArea(); }
    }

    // ====================================================================
    // AREA MANAGEMENT
    // ====================================================================

    function spawnEnemiesForArea() {
        var area = AREAS[state.areaIndex];
        if (!area || !area.enemyTypes || area.enemyTypes.length === 0 || area.enemyCount <= 0) return [];
        var aes  = state.areaEnemyState[state.areaIndex] || {};
        // Respect respawn cooldown
        var pending = aes.respawnTick && state.tick < aes.respawnTick;
        var count   = pending ? 0 : (area.enemyCount + Math.floor(state.hero.level * 0.4));
        var enemies = [];
        for (var i = 0; i < count; i++) {
            var typeName = area.enemyTypes[rndInt(0, area.enemyTypes.length - 1)];
            var def      = ENEMY_DEFS[typeName];
            var scaledHp = Math.round(def.maxHp * (1 + (area.difficulty - 1) * HP_SCALING_FACTOR));
            var ex, ey, att = 0;
            do {
                ex = rnd(80, CANVAS_W - 80);
                ey = rnd(80, CANVAS_H - 80);
                att++;
            } while ((dist2({ x: ex, y: ey }, state.hero) < 200 || isBlocked(ex, ey, def.size + 4)) && att < 30);
            enemies.push({
                type: typeName, x: ex, y: ey, spawnX: ex, spawnY: ey,
                hp: scaledHp, maxHp: scaledHp,
                wobble: rnd(0, Math.PI * 2), attackCooldown: rnd(0.5, 1.5), hitFlash: 0,
                aiState: 'patrol', patrolTimer: rnd(1, 3),
                patrolTx: ex, patrolTy: ey
            });
        }
        return enemies;
    }

    function spawnItemsForArea() {
        if (state.areaIndex === 7 || state.areaIndex === 8) return [];
        var items = [];
        var relicCount = (state.areaIndex === 9 || state.areaIndex === 10) ? rndInt(2, 4) : rndInt(2, 3);
        for (var i = 0; i < relicCount; i++) {
            var ix, iy, att = 0;
            do { ix = rnd(60, CANVAS_W - 60); iy = rnd(60, CANVAS_H - 60); att++; }
            while (isBlocked(ix, iy, 12) && att < 20);
            items.push({ type: 'relic', x: ix, y: iy, radius: 11 });
        }
        if (Math.random() < 0.65) {
            var pool = ['flask', 'clotharmor', 'leatherarmor', 'mailarmor', 'sword1', 'bluesword', 'firepotion'];
            var key  = pool[rndInt(0, pool.length - 1)];
            var jx, jy, att2 = 0;
            do { jx = rnd(60, CANVAS_W - 60); jy = rnd(60, CANVAS_H - 60); att2++; }
            while (isBlocked(jx, jy, 12) && att2 < 20);
            items.push({ type: key, x: jx, y: jy, radius: 10 });
        }
        return items;
    }

    function populateArea() {
        state.enemies = spawnEnemiesForArea();
        state.items   = spawnItemsForArea();
        mouseTarget   = null;
    }

    // Entry position in new area based on travel direction
    function entryPosition(dir, axisCoord) {
        var pad = TRANSITION_THRESHOLD + 22;
        switch (dir) {
            case 'right': return { x: pad,            y: clamp(axisCoord, 40, CANVAS_H - 40) };
            case 'left':  return { x: CANVAS_W - pad, y: clamp(axisCoord, 40, CANVAS_H - 40) };
            case 'up':    return { x: clamp(axisCoord, 40, CANVAS_W - 40), y: CANVAS_H - pad };
            case 'down':  return { x: clamp(axisCoord, 40, CANVAS_W - 40), y: pad            };
            default:      return { x: CANVAS_W / 2, y: CANVAS_H / 2 };
        }
    }

    function hasPortalAccess(portal) {
        if (!portal.requiresFlag) return true;
        return !!(state.storyState && state.storyState.flags && state.storyState.flags[portal.requiresFlag]);
    }

    function setQuestStep(step, notification) {
        if (!state.questState || state.questState.completed || step <= state.questState.step) return;
        state.questState.step = step;
        state.questState.objective = QUEST_STEPS[Math.min(step, QUEST_STEPS.length - 1)];
        state.storyState.chapter = Math.min(step, STORY_CHAPTERS.length - 1);
        if (notification) showNotif(notification);
        persist();
    }

    function markLocationDiscovered(areaId) {
        if (state.storyState.discoveredLocations.indexOf(areaId) === -1) {
            state.storyState.discoveredLocations.push(areaId);
        }
    }

    function beginTransition(nextId, dir, desiredX, desiredY, msg, fallbackRange) {
        if (trans.active || transitionCooldown > 0) return false;
        var safe = findSafeSpawn(nextId, desiredX, desiredY, state.hero.radius, fallbackRange || 170);
        if (!safe) {
            if (transitionBlockCooldown <= 0) {
                showNotif('Path is blocked from this side. Try a clearer opening.');
                transitionBlockCooldown = 1.2;
            }
            return false;
        }
        trans.active     = true;
        trans.phase      = 'fadeout';
        trans.timer      = 0;
        trans.dir        = dir || null;
        trans.fromAreaId = state.areaIndex;
        trans.toAreaId   = nextId;
        trans.targetX    = safe.x;
        trans.targetY    = safe.y;
        trans.msg        = msg || ('Entering ' + AREAS[nextId].name + '…');
        showNotif(trans.msg + ' ' + AREAS[nextId].description);
        return true;
    }

    function canTraverseEdgeAt(dir, axisCoord) {
        var area = AREAS[state.areaIndex];
        var nextId = area.neighbors[dir];
        if (nextId == null) return false;
        var ep = entryPosition(dir, axisCoord);
        return !!findSafeSpawn(nextId, ep.x, ep.y, state.hero.radius, 120);
    }

    function doAreaTransition(dir, axisCoord) {
        var area = AREAS[state.areaIndex];
        var nextId = area.neighbors[dir];
        if (nextId === null || nextId === undefined) { return false; }
        var desired = entryPosition(dir, axisCoord);
        return beginTransition(nextId, dir, desired.x, desired.y, 'Entering ' + AREAS[nextId].name + '…', 140);
    }

    function doPortalTransition(portal) {
        if (!portal) return false;
        if (!hasPortalAccess(portal)) {
            showNotif(portal.lockedMsg || 'This passage is locked.');
            return false;
        }
        return beginTransition(portal.targetAreaId, null, portal.targetX, portal.targetY, portal.label || ('Entering ' + AREAS[portal.targetAreaId].name + '…'), 190);
    }

    function applyTransitionMidpoint() {
        var nextId   = trans.toAreaId;
        var nextArea = AREAS[nextId];
        if (!nextArea) return;
        // Record respawn timer for old area if it was fully cleared
        if (state.enemies.length === 0) {
            state.areaEnemyState[trans.fromAreaId] = {
                defeated: ((state.areaEnemyState[trans.fromAreaId] || {}).defeated || 0),
                respawnTick: state.tick + RESPAWN_COOLDOWN_TICKS
            };
        }
        state.areaIndex = nextId;
        if (state.areasVisited.indexOf(nextId) === -1) {
            state.areasVisited.push(nextId);
            state.score += 50;
            showNotif('New area discovered: ' + nextArea.name + ' (+50 score)');
        }
        markLocationDiscovered(nextId);
        if (nextArea.storyTag && state.storyState.loreNotes.indexOf(nextArea.storyTag) === -1) {
            state.storyState.loreNotes.push(nextArea.storyTag);
            showNotif('Lore discovered: ' + nextArea.description);
        }
        state.hero.x = clamp(trans.targetX, state.hero.radius + 5, CANVAS_W - state.hero.radius - 5);
        state.hero.y = clamp(trans.targetY, state.hero.radius + 5, CANVAS_H - state.hero.radius - 5);
        populateArea();
        if (nextId === 10) {
            state.storyState.flags.sanctumEntered = true;
            setQuestStep(5, 'You entered the Shadow Sanctum. End the corruption!');
        }
        persist();
        updateHUD();
    }

    function getPortalsInArea(areaId) {
        return PORTALS.filter(function (p) { return p.areaId === areaId; });
    }

    function getNpcsInArea(areaId) {
        return NPC_DEFS.filter(function (n) { return n.areaId === areaId; });
    }

    // ====================================================================
    // COMBAT
    // ====================================================================

    function tryAttack() {
        if (state.hero.attackCooldown > 0 || swordSwing.active) { return; }
        // Aim toward nearest enemy or mouse target
        var best = null, minD = Infinity;
        state.enemies.forEach(function (e) { var d = dist2(state.hero, e); if (d < minD) { minD = d; best = e; } });
        if (best) {
            swordSwing.dir = Math.atan2(best.y - state.hero.y, best.x - state.hero.x);
        } else if (mouseTarget) {
            swordSwing.dir = Math.atan2(mouseTarget.y - state.hero.y, mouseTarget.x - state.hero.x);
        } else {
            swordSwing.dir = state.hero.facing || 0;
        }
        swordSwing.active   = true;
        swordSwing.progress = 0;
        swordSwing.hitDealt = false;
        state.hero.facing   = swordSwing.dir;
        state.hero.attackCooldown = ATTACK_COOLDOWN_SECS;
    }

    function applySwingDamage() {
        var range    = getAttackRange();
        var atk      = getHeroAttack();
        var hitCount = 0;
        state.enemies = state.enemies.filter(function (enemy) {
            if (dist2(state.hero, enemy) > range) { return true; }
            var ang  = Math.atan2(enemy.y - state.hero.y, enemy.x - state.hero.x);
            var diff = Math.abs(ang - swordSwing.dir);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff > 1.4) { return true; } // outside ±80° cone (1.4 rad half-width, ~160° total arc)
            var def = ENEMY_DEFS[enemy.type];
            var dmg = Math.max(1, Math.round(atk * (DMG_VARIANCE_MIN + Math.random() * DMG_VARIANCE_RANGE)));
            enemy.hp      -= dmg;
            enemy.hitFlash = 0.3;
            addHitFlash(enemy.x, enemy.y, def.size);
            addFloat(enemy.x, enemy.y - def.size - 4, '-' + dmg, '#ff5555', 13);
            hitCount++;
            if (enemy.hp <= 0) {
                state.score      += def.xp;
                state.hero.xp    += def.xp;
                state.hero.kills++;
                state.totalKills++;
                addFloat(enemy.x, enemy.y, '+' + def.xp + ' XP', '#7ad985', 12);
                if (Math.random() < def.itemChance) {
                    var dropType = def.items[rndInt(0, def.items.length - 1)];
                    state.items.push({ type: dropType, x: enemy.x + rnd(-18, 18), y: enemy.y + rnd(-18, 18), radius: 10 });
                }
                checkLevelUp();
                return false;
            }
            return true;
        });
        if (state.areaIndex === 10 && state.enemies.length === 0 && !state.storyState.flags.shadowCleansed) {
            state.storyState.flags.shadowCleansed = true;
            state.questState.completed = true;
            state.questState.objective = 'Shadow relic cleansed. Return as the realm’s champion.';
            showNotif('The Shadow Relic is cleansed! The realm begins to heal.');
            state.score += 400;
            persist();
        }
        if (hitCount > 0) setStatus('playing', 'Playing');
    }

    function checkLevelUp() {
        var hero    = state.hero;
        var xpNeeded = XP_TABLE[Math.min(hero.level, XP_TABLE.length - 1)];
        if (hero.xp >= xpNeeded && hero.level < XP_TABLE.length) {
            hero.level++;
            hero.maxHp += 20;
            hero.hp     = Math.min(hero.maxHp, hero.hp + 30);
            hero.attack += 4;
            hero.speed   = Math.min(220, hero.speed + 4);
            addFloat(hero.x, hero.y - 32, 'LEVEL UP! ' + hero.level, '#ffd700', 18);
            showNotif('Level ' + hero.level + '! ATK +4, Max HP +20');
            persist();
        }
    }

    // ====================================================================
    // ITEM COLLECTION
    // ====================================================================

    function collectItems() {
        state.items = state.items.filter(function (item) {
            if (dist2(state.hero, item) > state.hero.radius + item.radius + 5) { return true; }
            var def = ITEM_DEFS[item.type];
            if (!def) { return false; }
            if (def.type === 'relic') {
                state.relics++; state.score += 30;
                addFloat(item.x, item.y, 'Relic! +30', '#ffd76b', 14);
                showNotif('Ancient Relic collected! (' + state.relics + ' total)');
                if ((state.areaIndex === 1 || state.areaIndex === 3 || state.areaIndex === 9) && state.questState.step >= 1) {
                    state.storyState.flags.gatheredGuidance = true;
                    setQuestStep(2, 'Relic traces found. Recover at least 3 relic fragments.');
                }
                if (state.relics >= 3) {
                    state.storyState.flags.relicTargetReached = true;
                    setQuestStep(3, 'Relic target reached. Secure fortress access.');
                }
            } else if (def.type === 'weapon') {
                var oldBonus = state.hero.weapon ? (ITEM_DEFS[state.hero.weapon].attackBonus || 0) : 0;
                if ((def.attackBonus || 0) > oldBonus) {
                    state.hero.weapon = item.type;
                    addFloat(item.x, item.y, def.name + '!', '#66aaff', 14);
                    showNotif('Equipped: ' + def.name + ' (ATK +' + def.attackBonus + ', Range +' + (def.range || 0) + ')');
                } else {
                    state.score += 8;
                    addFloat(item.x, item.y, def.name, '#9999cc', 12);
                    showNotif('Found ' + def.name + ' (already have better weapon)');
                }
            } else if (def.type === 'armor') {
                var oldDef = state.hero.armor ? (ITEM_DEFS[state.hero.armor].defenseBonus || 0) : 0;
                if ((def.defenseBonus || 0) > oldDef) {
                    state.hero.armor = item.type;
                    addFloat(item.x, item.y, def.name + '!', '#ffaa33', 14);
                    showNotif('Equipped: ' + def.name + ' (DEF +' + def.defenseBonus + '%)');
                } else {
                    state.score += 8;
                    addFloat(item.x, item.y, def.name, '#cc9944', 12);
                    showNotif('Found ' + def.name + ' (already have better armor)');
                }
            } else if (def.type === 'heal') {
                var before = state.hero.hp;
                state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + def.heal);
                addFloat(item.x, item.y, '+' + Math.round(state.hero.hp - before) + ' HP', '#2ecc71', 14);
                showNotif(def.name + ': restored ' + Math.round(state.hero.hp - before) + ' HP');
            }
            persist();
            return false;
        });
    }

    function getNpcDialogue(npc) {
        var f = state.storyState.flags;
        switch (npc.id) {
            case 'elder_mira':
                if (!f.metElder) return 'The shadow relics are poisoning every road. Speak with our scouts and return with relic fragments.';
                if (f.shadowCleansed) return 'You ended the corruption. The villages will sing your name.';
                return 'Carry this purpose: gather relics, prepare, then break the Sanctum.';
            case 'tovin_smith':
                return f.shadowCleansed ? 'My forge burns brighter now. You are always welcome here.' : 'Relics for steel. I can arm you for the fortress.';
            case 'lyra_scholar':
                return f.relicTargetReached ? 'Good. Three fragments resonate. The fortress gate should weaken soon.' : 'Shadow glyphs point toward caves and old stone roads.';
            case 'bran_ranger':
                return f.gatheredGuidance ? 'You know the routes now. Stay mobile near the borders.' : 'Forest pass is safer than the old keep road. Watch edge chokepoints.';
            case 'fort_guard':
                if (!f.fortressAccess) return 'The Sanctum gate only yields to a Fortress Sigil.';
                return 'You hold the sigil. Enter, and end this.';
            case 'mira_merchant':
                return 'Supplies for relics. A good map and draught can save a campaign.';
            default:
                return 'Stay safe out there.';
        }
    }

    function applyVendorEffect(item) {
        if (item.effect === 'heal') {
            var before = state.hero.hp;
            state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + item.value);
            showNotif(item.name + ' restored ' + Math.round(state.hero.hp - before) + ' HP.');
            return true;
        }
        if (item.effect === 'weapon') {
            state.hero.weapon = item.weapon;
            showNotif('Equipped ' + ITEM_DEFS[item.weapon].name + '.');
            return true;
        }
        if (item.effect === 'armor') {
            state.hero.armor = item.armor;
            showNotif('Equipped ' + ITEM_DEFS[item.armor].name + '.');
            return true;
        }
        if (item.effect === 'upgrade') {
            state.upgrades[item.key] = true;
            showNotif(item.name + ' unlocked.');
            return true;
        }
        if (item.effect === 'flag') {
            state.storyState.flags[item.key] = true;
            showNotif(item.name + ' obtained.');
            if (item.key === 'fortressAccess') setQuestStep(4, 'Fortress access granted. Prepare before entering the Sanctum.');
            return true;
        }
        return false;
    }

    function isPurchased(itemId) {
        return !!state.vendorPurchases[itemId];
    }

    function interactVendor(vendorId) {
        var stock = VENDOR_STOCK[vendorId] || [];
        if (!stock.length) return;
        var lines = stock.map(function (it, idx) {
            var owned = (!it.repeatable && isPurchased(it.id)) ? ' (owned)' : '';
            return (idx + 1) + '. ' + it.name + ' - ' + it.cost + ' relics' + owned + ' [' + it.desc + ']';
        }).join('\n');
        var choiceRaw = window.prompt('Vendor stock (Relics: ' + state.relics + ')\n' + lines + '\nEnter item number to buy, or cancel.');
        if (choiceRaw === null) return;
        var choice = parseInt(choiceRaw, 10) - 1;
        if (choice < 0 || choice >= stock.length) { showNotif('Invalid choice.'); return; }
        var item = stock[choice];
        if (!item.repeatable && isPurchased(item.id)) { showNotif('Already purchased.'); return; }
        if (state.relics < item.cost) { showNotif('Not enough relics for ' + item.name + '.'); return; }
        state.relics -= item.cost;
        state.score = Math.max(0, state.score - item.cost * 5);
        if (!item.repeatable) state.vendorPurchases[item.id] = true;
        state.purchaseCount++;
        applyVendorEffect(item);
        if (state.purchaseCount >= 2 && state.questState.step >= 4) {
            setQuestStep(5, 'Preparations complete. Enter the Shadow Sanctum.');
        }
        persist();
    }

    function talkToNpc(npc) {
        state.npcFlags[npc.id] = (state.npcFlags[npc.id] || 0) + 1;
        var msg = npc.name + ' (' + npc.role + '): ' + getNpcDialogue(npc);
        showNotif(msg);
        if (npc.id === 'elder_mira') {
            state.storyState.flags.metElder = true;
            setQuestStep(1, 'Seek guidance from Bran and Lyra.');
        }
        if (npc.id === 'bran_ranger' || npc.id === 'lyra_scholar') {
            if (state.storyState.flags.metElder) {
                state.storyState.flags.gatheredGuidance = true;
                setQuestStep(2, 'Recover relic fragments from forest/caves.');
            }
        }
        if (npc.vendorId) interactVendor(npc.vendorId);
        persist();
    }

    function getInteractionContext() {
        var hero = state.hero;
        var best = null;
        getNpcsInArea(state.areaIndex).forEach(function (npc) {
            var d = dist2(hero, npc);
            if (d < 58 && (!best || d < best.dist)) best = { type: 'npc', npc: npc, dist: d };
        });
        getPortalsInArea(state.areaIndex).forEach(function (portal) {
            var d = dist2(hero, { x: portal.x, y: portal.y });
            if (d < (portal.r + 20) && (!best || d < best.dist)) best = { type: 'portal', portal: portal, dist: d };
        });
        return best;
    }

    function interact() {
        if (interactionCooldown > 0 || paused || trans.active) return;
        var ctxInt = getInteractionContext();
        if (!ctxInt) return;
        if (ctxInt.type === 'npc') talkToNpc(ctxInt.npc);
        if (ctxInt.type === 'portal') doPortalTransition(ctxInt.portal);
        interactionCooldown = 0.25;
    }

    // ====================================================================
    // MOVEMENT
    // ====================================================================

    function tryMove(hero, nx, ny) {
        if (!isBlocked(hero.x + nx, hero.y + ny, hero.radius)) { hero.x += nx; hero.y += ny; }
        else if (!isBlocked(hero.x + nx, hero.y, hero.radius)) { hero.x += nx; }
        else if (!isBlocked(hero.x, hero.y + ny, hero.radius)) { hero.y += ny; }
    }

    function moveHero(dt) {
        if (trans.active) { return; }
        var vx = 0, vy = 0;
        if (keys.ArrowLeft  || keys.a || keys.A) vx -= 1;
        if (keys.ArrowRight || keys.d || keys.D) vx += 1;
        if (keys.ArrowUp    || keys.w || keys.W) vy -= 1;
        if (keys.ArrowDown  || keys.s || keys.S) vy += 1;

        if (vx !== 0 || vy !== 0) {
            mouseTarget = null;
            var len = Math.sqrt(vx * vx + vy * vy) || 1;
            tryMove(state.hero, (vx / len) * state.hero.speed * dt, (vy / len) * state.hero.speed * dt);
            state.hero.facing = Math.atan2(vy, vx);
        } else if (mouseTarget) {
            var dx = mouseTarget.x - state.hero.x, dy = mouseTarget.y - state.hero.y;
            var d  = Math.sqrt(dx * dx + dy * dy);
            if (d < 3) { mouseTarget = null; }
            else {
                tryMove(state.hero, (dx / d) * state.hero.speed * dt, (dy / d) * state.hero.speed * dt);
                state.hero.facing = Math.atan2(dy, dx);
            }
        }

        // Edge transition — trigger early (TRANSITION_THRESHOLD from edge)
        var thr  = TRANSITION_THRESHOLD;
        var area = AREAS[state.areaIndex];
        if (area && !area.isInterior) {
            if (state.hero.x < thr && area.neighbors.left != null && canTraverseEdgeAt('left', state.hero.y)) doAreaTransition('left', state.hero.y);
            else if (state.hero.x > CANVAS_W - thr && area.neighbors.right != null && canTraverseEdgeAt('right', state.hero.y)) doAreaTransition('right', state.hero.y);
            else if (state.hero.y < thr && area.neighbors.up != null && canTraverseEdgeAt('up', state.hero.x)) doAreaTransition('up', state.hero.x);
            else if (state.hero.y > CANVAS_H - thr && area.neighbors.down != null && canTraverseEdgeAt('down', state.hero.x)) doAreaTransition('down', state.hero.x);
        }

        state.hero.x = clamp(state.hero.x, state.hero.radius, CANVAS_W - state.hero.radius);
        state.hero.y = clamp(state.hero.y, state.hero.radius, CANVAS_H - state.hero.radius);
        interactionContext = getInteractionContext();
    }

    function moveEnemies(dt) {
        var hero = state.hero;
        var area = AREAS[state.areaIndex];

        state.enemies.forEach(function (enemy) {
            var def = ENEMY_DEFS[enemy.type];
            enemy.wobble       += dt;
            enemy.hitFlash      = Math.max(0, enemy.hitFlash - dt);
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

            var dHero  = dist2(hero, enemy);
            var dSpawn = dist2({ x: enemy.spawnX, y: enemy.spawnY }, enemy);

            // AI state machine
            switch (enemy.aiState) {
                case 'idle':
                    enemy.patrolTimer -= dt;
                    if (enemy.patrolTimer <= 0) {
                        enemy.patrolTx = clamp(enemy.spawnX + rnd(-130, 130), 60, CANVAS_W - 60);
                        enemy.patrolTy = clamp(enemy.spawnY + rnd(-130, 130), 60, CANVAS_H - 60);
                        enemy.aiState  = 'patrol';
                        enemy.patrolTimer = rnd(2, 5);
                    }
                    if (dHero < def.aggroRadius) enemy.aiState = 'chase';
                    break;

                case 'patrol': {
                    var dpx = enemy.patrolTx - enemy.x, dpy = enemy.patrolTy - enemy.y;
                    var dp  = Math.sqrt(dpx * dpx + dpy * dpy);
                    if (dp < 8) { enemy.aiState = 'idle'; enemy.patrolTimer = rnd(1.5, 4); }
                    else {
                        var pa = Math.atan2(dpy, dpx) + Math.sin(enemy.wobble * 1.2) * 0.15;
                        var pnx = Math.cos(pa) * def.patrolSpeed * dt;
                        var pny = Math.sin(pa) * def.patrolSpeed * dt;
                        if (!isBlocked(enemy.x + pnx, enemy.y + pny, def.size)) { enemy.x += pnx; enemy.y += pny; }
                    }
                    if (dHero < def.aggroRadius) enemy.aiState = 'chase';
                    break;
                }

                case 'chase': {
                    if (dHero > def.leashRadius) { enemy.aiState = 'return'; break; }
                    var ca = Math.atan2(hero.y - enemy.y, hero.x - enemy.x) + Math.sin(enemy.wobble * 1.8) * 0.35;
                    var cnx = Math.cos(ca) * def.speed * dt, cny = Math.sin(ca) * def.speed * dt;
                    if      (!isBlocked(enemy.x + cnx, enemy.y + cny, def.size)) { enemy.x += cnx; enemy.y += cny; }
                    else if (!isBlocked(enemy.x + cnx, enemy.y, def.size))       { enemy.x += cnx; }
                    else if (!isBlocked(enemy.x, enemy.y + cny, def.size))       { enemy.y += cny; }
                    break;
                }

                case 'return': {
                    if (dSpawn < 12) { enemy.aiState = 'idle'; enemy.patrolTimer = rnd(2, 5); break; }
                    var dsx = enemy.spawnX - enemy.x, dsy = enemy.spawnY - enemy.y;
                    var ds  = Math.sqrt(dsx * dsx + dsy * dsy);
                    var rnx = (dsx / ds) * def.speed * 0.65 * dt, rny = (dsy / ds) * def.speed * 0.65 * dt;
                    if (!isBlocked(enemy.x + rnx, enemy.y + rny, def.size)) { enemy.x += rnx; enemy.y += rny; }
                    if (dHero < def.aggroRadius * 0.7) enemy.aiState = 'chase';
                    break;
                }
            }

            enemy.x = clamp(enemy.x, def.size, CANVAS_W - def.size);
            enemy.y = clamp(enemy.y, def.size, CANVAS_H - def.size);

            // Contact damage only while chasing
            if (enemy.aiState === 'chase' && dHero < hero.radius + def.size + 2 && enemy.attackCooldown <= 0) {
                var rawDmg   = def.attack * area.difficulty;
                var reduction = getHeroDefense() / 100;
                var dmg      = Math.max(1, rawDmg * (1 - reduction) * dt * ENEMY_DMG_PER_SEC);
                hero.hp     -= dmg;
                hero.hitFlash = 0.22;
                enemy.attackCooldown = 0.7;
                if (hero.hp <= 0) {
                    hero.hp = 0; paused = true;
                    if (elPauseBtn) elPauseBtn.textContent = 'Resume';
                    setStatus('paused', 'Defeated!');
                    if (elHint) elHint.textContent = 'You were defeated! Press New Game or N to try again.';
                    showNotif('Defeated by ' + def.name + '!');
                }
            }
        });
        // No automatic in-area respawn — enemies reappear only on area re-entry via populateArea()
    }

    // ====================================================================
    // RENDERING — background / ground layers
    // ====================================================================

    function drawMeadowGround() {
        var g = ctx.createLinearGradient(0, 0, 0, 220);
        g.addColorStop(0, 'rgba(120,200,240,0.22)'); g.addColorStop(1, 'rgba(120,200,240,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, CANVAS_W, 220);
        ctx.fillStyle = 'rgba(255,220,60,0.32)';
        for (var i = 0; i < 30; i++) { var fx = (i * 137 + 40) % (CANVAS_W - 80) + 40, fy = (i * 211 + 60) % (CANVAS_H - 100) + 60; ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,100,140,0.28)';
        for (var j = 0; j < 20; j++) { var fx2 = (j * 173 + 80) % (CANVAS_W - 80) + 40, fy2 = (j * 247 + 90) % (CANVAS_H - 100) + 60; ctx.beginPath(); ctx.arc(fx2, fy2, 3, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawForestGround() {
        ctx.fillStyle = 'rgba(100,200,50,0.10)';
        for (var i = 0; i < 14; i++) { var sx = (i * 193 + 60) % (CANVAS_W - 120) + 60, sy = (i * 157 + 50) % (CANVAS_H - 100) + 50; ctx.beginPath(); ctx.arc(sx, sy, 34 + (i % 4) * 9, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawTownGround() {
        ctx.fillStyle = 'rgba(180,160,120,0.16)';
        for (var gx = 30; gx < CANVAS_W - 30; gx += 50) {
            for (var gy = 30; gy < CANVAS_H - 30; gy += 30) {
                ctx.fillRect(gx + ((Math.floor((gy - 30) / 30) % 2) * 25), gy, 44, 24);
            }
        }
    }

    function drawCaveGround() {
        ctx.fillStyle = 'rgba(60,60,90,0.20)';
        for (var i = 0; i < 12; i++) { var cx = (i * 173 + 80) % (CANVAS_W - 160) + 80, cy = (i * 211 + 80) % (CANVAS_H - 120) + 80; ctx.beginPath(); ctx.ellipse(cx, cy, 36 + i % 5 * 8, 22 + i % 3 * 6, 0, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawDarkGround(biome) {
        if (biome === 'lair') { ctx.fillStyle = 'rgba(160,50,0,0.14)'; for (var i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc((i * 241 + 100) % (CANVAS_W - 200) + 100, (i * 183 + 100) % (CANVAS_H - 150) + 100, 22 + i * 3, 0, Math.PI * 2); ctx.fill(); } }
    }

    function drawBackground() {
        var area = AREAS[state.areaIndex];
        ctx.fillStyle = area.bgColor;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        switch (area.biome) {
            case 'meadow': drawMeadowGround(); break;
            case 'forest': drawForestGround(); break;
            case 'town':   drawTownGround();   break;
            case 'cave':   drawCaveGround();   break;
            case 'keep':
            case 'lair':   drawDarkGround(area.biome); break;
        }

        // Subtle grid dots
        ctx.fillStyle = area.gridColor;
        for (var gx = 0; gx < CANVAS_W; gx += 48)
            for (var gy = 0; gy < CANVAS_H; gy += 48)
                ctx.fillRect(gx + ((gx + gy) % 14), gy + ((gx + gy) % 11), 3, 3);

        // Border glow
        ctx.strokeStyle = area.borderColor; ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);

        // Edge neighbor arrows
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (area.neighbors.right != null) ctx.fillText('\u25B6 ' + AREAS[area.neighbors.right].name, CANVAS_W - 55, CANVAS_H / 2);
        if (area.neighbors.left  != null) ctx.fillText('\u25C4 ' + AREAS[area.neighbors.left ].name, 55,            CANVAS_H / 2);
        if (area.neighbors.up    != null) ctx.fillText('\u25B2 ' + AREAS[area.neighbors.up   ].name, CANVAS_W / 2,  20);
        if (area.neighbors.down  != null) ctx.fillText('\u25BC ' + AREAS[area.neighbors.down  ].name, CANVAS_W / 2,  CANVAS_H - 20);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

        // Darkness overlay for low-ambientLight biomes
        if (area.ambientLight < 1.0) {
            var boost = (state.upgrades && state.upgrades.lantern && (area.biome === 'cave' || area.biome === 'keep' || area.biome === 'lair')) ? 0.18 : 0;
            var light = clamp(area.ambientLight + boost, 0, 1);
            ctx.fillStyle = 'rgba(0,0,0,' + ((1.0 - light) * 0.70) + ')';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }
    }

    // ====================================================================
    // TERRAIN OBSTACLE DRAWING
    // ====================================================================

    function drawTree(cx, cy, r, biome) {
        var trunk  = (biome === 'forest') ? '#4a2a0a' : (biome === 'cave' || biome === 'keep' || biome === 'lair') ? '#2a1a0a' : '#6b3a1a';
        var canopy = (biome === 'forest') ? '#1a5a0a' : (biome === 'cave' || biome === 'keep' || biome === 'lair') ? '#1a2a08' : '#2a7a14';
        ctx.fillStyle = trunk;  ctx.fillRect(cx - 4, cy - r * 0.3, 8, r * 0.9);
        ctx.fillStyle = canopy; ctx.beginPath(); ctx.arc(cx, cy - r * 0.3, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = (biome === 'meadow' || biome === 'town') ? 'rgba(100,220,50,0.22)' : 'rgba(60,160,30,0.18)';
        ctx.beginPath(); ctx.arc(cx - r * 0.28, cy - r * 0.55, r * 0.42, 0, Math.PI * 2); ctx.fill();
    }

    function drawWater(x, y, w, h, biome) {
        ctx.fillStyle   = (biome === 'lair') ? '#cc3300' : '#1e5a99';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = (biome === 'lair') ? 'rgba(255,100,30,0.35)' : 'rgba(80,160,255,0.40)';
        ctx.lineWidth   = 1.5;
        for (var i = 0; i < 3; i++) {
            var ry = y + h * (0.25 + i * 0.25);
            ctx.beginPath(); ctx.moveTo(x + 8, ry); ctx.bezierCurveTo(x + w * 0.3, ry - 4, x + w * 0.7, ry + 4, x + w - 8, ry); ctx.stroke();
        }
    }

    function drawWallRect(x, y, w, h, biome) {
        var wall   = biome === 'cave' ? '#3a3a50' : biome === 'town' ? '#a08060' : biome === 'lair' ? '#4a2010' : '#3a2828';
        var detail = biome === 'cave' ? '#2a2a40' : biome === 'lair' ? '#3a1808' : '#2a1818';
        ctx.fillStyle = wall; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = detail; ctx.lineWidth = 1;
        var bW = 30, bH = 18;
        for (var bx = x; bx < x + w; bx += bW)
            for (var by = y; by < y + h; by += bH)
                ctx.strokeRect(bx + ((Math.floor((by - y) / bH) % 2) * (bW / 2)), by, bW, bH);
    }

    function drawRock(cx, cy, r, biome) {
        ctx.fillStyle = (biome === 'lair') ? '#5a3020' : '#6a6060';
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.78, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = (biome === 'lair') ? 'rgba(200,80,30,0.22)' : 'rgba(200,200,200,0.18)';
        ctx.beginPath(); ctx.ellipse(cx - r * 0.25, cy - r * 0.28, r * 0.38, r * 0.28, -0.4, 0, Math.PI * 2); ctx.fill();
    }

    function drawBuilding(x, y, w, h, biome) {
        var wall  = biome === 'keep' ? '#3a2828' : biome === 'town' ? '#c0a878' : '#9a8060';
        var roof  = biome === 'keep' ? '#2a1818' : '#7a5a38';
        var door  = biome === 'keep' ? '#1a0808' : '#5a3a1a';
        ctx.fillStyle = wall;
        ctx.fillRect(x, y, w, h);
        // Roof strip
        ctx.fillStyle = roof; ctx.fillRect(x, y, w, Math.min(14, h * 0.2));
        // Door
        var dw = Math.min(20, w * 0.3), dh = Math.min(28, h * 0.45);
        ctx.fillStyle = door; ctx.fillRect(x + (w - dw) / 2, y + h - dh, dw, dh);
        // Window
        if (w > 50) {
            ctx.fillStyle = 'rgba(255,230,100,0.25)';
            ctx.fillRect(x + w * 0.15, y + h * 0.28, w * 0.18, h * 0.22);
            ctx.fillRect(x + w * 0.67, y + h * 0.28, w * 0.18, h * 0.22);
        }
        // Outline
        ctx.strokeStyle = roof; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
    }

    function drawWell(cx, cy, r) {
        ctx.fillStyle = '#7a6a50'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.60, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(30,90,160,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#5a4a30'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - r * 0.1, cy - r); ctx.lineTo(cx - r * 0.1, cy - r * 1.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + r * 0.1, cy - r); ctx.lineTo(cx + r * 0.1, cy - r * 1.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy - r * 1.55); ctx.lineTo(cx + r * 0.35, cy - r * 1.55); ctx.stroke();
    }

    function drawTerrainObstacles() {
        var area = AREAS[state.areaIndex];
        var biome = area.biome;
        (AREA_OBSTACLES[state.areaIndex] || []).forEach(function (o) {
            switch (o.type) {
                case 'tree':   drawTree(o.x, o.y, o.r, biome); break;
                case 'water':  drawWater(o.x, o.y, o.w, o.h, biome); break;
                case 'rect':
                    // Town buildings vs generic walls
                    if (biome === 'town' && o.w > 80 && o.h > 70) drawBuilding(o.x, o.y, o.w, o.h, biome);
                    else if (biome === 'keep' && o.w > 80 && o.h > 70) drawBuilding(o.x, o.y, o.w, o.h, biome);
                    else drawWallRect(o.x, o.y, o.w, o.h, biome);
                    break;
                case 'circle':
                    // Town well
                    if (biome === 'town' && o.r >= 20) drawWell(o.x, o.y, o.r);
                    else drawRock(o.x, o.y, o.r, biome);
                    break;
            }
        });
    }

    function drawPortals() {
        var portals = getPortalsInArea(state.areaIndex);
        portals.forEach(function (p) {
            var unlocked = hasPortalAccess(p);
            ctx.save();
            ctx.strokeStyle = unlocked ? 'rgba(255,220,120,0.88)' : 'rgba(180,80,80,0.85)';
            ctx.fillStyle = unlocked ? 'rgba(255,220,120,0.18)' : 'rgba(180,80,80,0.16)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = unlocked ? '#ffe6a0' : '#ff9a9a';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(unlocked ? 'Door' : 'Locked', p.x, p.y - p.r - 8);
            ctx.restore();
        });
    }

    function drawNpcs() {
        getNpcsInArea(state.areaIndex).forEach(function (npc) {
            ctx.save();
            ctx.translate(npc.x, npc.y);
            ctx.fillStyle = '#f0c090';
            ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = npc.vendorId ? '#5a8ae0' : '#5a9a5a';
            ctx.fillRect(-8, -3, 16, 18);
            ctx.fillStyle = '#d0d6ff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, 0, -22);
            if (interactionContext && interactionContext.type === 'npc' && interactionContext.npc.id === npc.id) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('[E]', 0, -34);
            }
            ctx.restore();
        });
    }

    // Transition preview: tinted strip of next area at active edges
    function drawTransitionPreview() {
        if (trans.active) return;
        var area = AREAS[state.areaIndex];
        if (area.isInterior) return;
        var thr  = TRANSITION_THRESHOLD;
        var dirs = ['right', 'left', 'up', 'down'];
        dirs.forEach(function (dir) {
            var nid = area.neighbors[dir];
            if (nid == null) return;
            var alpha = 0;
            switch (dir) {
                case 'right': alpha = Math.max(0, (state.hero.x - (CANVAS_W - thr * 2.2)) / thr); break;
                case 'left':  alpha = Math.max(0, (thr * 2.2 - state.hero.x) / thr); break;
                case 'up':    alpha = Math.max(0, (thr * 2.2 - state.hero.y) / thr); break;
                case 'down':  alpha = Math.max(0, (state.hero.y - (CANVAS_H - thr * 2.2)) / thr); break;
            }
            if (alpha <= 0) return;
            alpha = Math.min(0.50, alpha);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = AREAS[nid].bgColor;
            var sw = 110;
            switch (dir) {
                case 'right': ctx.fillRect(CANVAS_W - sw, 0, sw, CANVAS_H); break;
                case 'left':  ctx.fillRect(0, 0, sw, CANVAS_H); break;
                case 'up':    ctx.fillRect(0, 0, CANVAS_W, sw); break;
                case 'down':  ctx.fillRect(0, CANVAS_H - sw, CANVAS_W, sw); break;
            }
            ctx.globalAlpha = Math.min(0.95, alpha + 0.2);
            ctx.fillStyle = 'rgba(180,40,40,0.85)';
            var segment = 42;
            for (var pos = 30; pos < (dir === 'left' || dir === 'right' ? CANVAS_H - 30 : CANVAS_W - 30); pos += segment) {
                if (canTraverseEdgeAt(dir, pos)) continue;
                if (dir === 'right') ctx.fillRect(CANVAS_W - 20, pos - 10, 18, 18);
                if (dir === 'left')  ctx.fillRect(2, pos - 10, 18, 18);
                if (dir === 'up')    ctx.fillRect(pos - 10, 2, 18, 18);
                if (dir === 'down')  ctx.fillRect(pos - 10, CANVAS_H - 20, 18, 18);
            }
            ctx.globalAlpha = Math.min(1, alpha * 2);
            ctx.fillStyle = '#fff'; ctx.font = '13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            switch (dir) {
                case 'right': ctx.fillText(AREAS[nid].name, CANVAS_W - sw / 2, CANVAS_H / 2); break;
                case 'left':  ctx.fillText(AREAS[nid].name, sw / 2, CANVAS_H / 2); break;
                case 'up':    ctx.fillText(AREAS[nid].name, CANVAS_W / 2, sw / 2); break;
                case 'down':  ctx.fillText(AREAS[nid].name, CANVAS_W / 2, CANVAS_H - sw / 2); break;
            }
            ctx.restore();
        });
    }

    // ====================================================================
    // STAR HELPER
    // ====================================================================

    function drawStar(cx, cy, spikes, outerR, innerR) {
        var rot = -Math.PI / 2, step = Math.PI / spikes;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        for (var i = 0; i < spikes; i++) { rot += step; ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step; ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); }
        ctx.closePath();
    }

    // ====================================================================
    // ITEM DRAWING
    // ====================================================================

    function drawItems() {
        state.items.forEach(function (item) {
            var def = ITEM_DEFS[item.type];
            if (!def) return;
            ctx.save(); ctx.translate(item.x, item.y);
            if (def.type === 'relic') {
                ctx.fillStyle = def.color; drawStar(0, 0, 5, 11, 5); ctx.fill();
                ctx.strokeStyle = def.subColor; ctx.lineWidth = 1.5; ctx.stroke();
            } else if (def.type === 'weapon') {
                ctx.fillStyle = def.color; ctx.fillRect(-2.5, -11, 5, 15);
                ctx.fillStyle = def.subColor; ctx.fillRect(-7, -1, 14, 3.5); ctx.fillRect(-2, 4, 4, 6);
            } else if (def.type === 'armor') {
                ctx.fillStyle = def.color; ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(9,-5); ctx.lineTo(9,3); ctx.lineTo(0,11); ctx.lineTo(-9,3); ctx.lineTo(-9,-5); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = def.subColor; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.strokeStyle = def.subColor; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(0,7); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.stroke();
            } else if (def.type === 'heal') {
                ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(0, 4, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = def.subColor; ctx.fillRect(-2.5, -8, 5, 8); ctx.fillRect(-4, -10, 8, 3);
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(-2, 2, 2.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });
    }

    // ====================================================================
    // ENEMY DRAWING
    // ====================================================================

    function drawEnemy(enemy) {
        var def = ENEMY_DEFS[enemy.type];
        if (!def) return;
        var s = def.size;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Chase alert badge
        if (enemy.aiState === 'chase') {
            ctx.fillStyle = 'rgba(255,80,0,0.85)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('!', 0, -s - 13); ctx.textAlign = 'left';
        }
        if (enemy.hitFlash > 0) ctx.globalAlpha = 0.45 + 0.55 * (1 - enemy.hitFlash / 0.3);

        switch (enemy.type) {
            case 'rat':
                ctx.fillStyle = def.color; ctx.save(); ctx.scale(1.2, 0.75); ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill(); ctx.restore();
                ctx.strokeStyle = '#5a2808'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s*0.9,2); ctx.bezierCurveTo(s+6,-3,s+11,5,s+9,8); ctx.stroke();
                ctx.fillStyle = '#cc7755'; ctx.beginPath(); ctx.arc(-s*0.35,-s*0.7,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.35,-s*0.7,3,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(-s*0.3,-s*0.1,1.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.3,-s*0.1,1.8,0,Math.PI*2); ctx.fill();
                break;
            case 'goblin':
                ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(-s+1,-s*0.3); ctx.lineTo(-s-5,-s); ctx.lineTo(-s+4,-s*0.5); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(s-1,-s*0.3); ctx.lineTo(s+5,-s); ctx.lineTo(s-4,-s*0.5); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#ffee00'; ctx.beginPath(); ctx.arc(-s*0.35,-s*0.15,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.35,-s*0.15,2.5,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-s*0.35,-s*0.15,1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.35,-s*0.15,1,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#1a5a08'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0,s*0.3,s*0.35,0.2,Math.PI-0.2); ctx.stroke();
                break;
            case 'bat':
                ctx.fillStyle = def.color;
                ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-s*2.2,-s*1.1,-s*2.8,s*0.5,-s*1.1,s*0.4); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(s*2.2,-s*1.1,s*2.8,s*0.5,s*1.1,s*0.4); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#6a2a8a'; ctx.beginPath(); ctx.arc(0,0,s*0.55,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(-2.5,-1,1.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(2.5,-1,1.8,0,Math.PI*2); ctx.fill();
                break;
            case 'skeleton': case 'skeleton2':
                ctx.fillStyle = def.color;
                ctx.beginPath(); ctx.arc(0,-s*0.55,s*0.52,0,Math.PI*2); ctx.fill();
                ctx.fillRect(-s*0.3,-s*0.1,s*0.6,s*0.95);
                ctx.strokeStyle = '#888'; ctx.lineWidth = 1.2;
                for (var ri = 0; ri < 3; ri++) { ctx.beginPath(); ctx.moveTo(-s*0.28,-s*0.05+ri*s*0.28); ctx.lineTo(s*0.28,-s*0.05+ri*s*0.28); ctx.stroke(); }
                ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(-s*0.18,-s*0.6,s*0.14,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.18,-s*0.6,s*0.14,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0,-s*0.46,s*0.07,0,Math.PI*2); ctx.fill();
                break;
            case 'ogre':
                ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#cc4400'; ctx.beginPath(); ctx.arc(-s*0.32,-s*0.22,s*0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.32,-s*0.22,s*0.2,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-s*0.32,-s*0.22,s*0.08,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.32,-s*0.22,s*0.08,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#3a2208'; ctx.fillRect(s*0.75,-s,s*0.35,s*1.3); ctx.beginPath(); ctx.arc(s*0.92,-s*1.0,s*0.32,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#f0e8c0'; ctx.beginPath(); ctx.moveTo(-s*0.2,s*0.35); ctx.lineTo(-s*0.1,s*0.7); ctx.lineTo(0,s*0.38); ctx.closePath(); ctx.fill();
                break;
            case 'eye':
                ctx.fillStyle = '#550000'; ctx.beginPath(); ctx.arc(0,0,s*1.15,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#aa1111'; ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#dd2222'; ctx.beginPath(); ctx.arc(0,0,s*0.65,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(0,0,s*0.38,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0,0,s*0.15,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#881111'; ctx.lineWidth = 2;
                for (var ti = 0; ti < 6; ti++) { var ta = (ti/6)*Math.PI*2+enemy.wobble*0.6; ctx.beginPath(); ctx.moveTo(Math.cos(ta)*s,Math.sin(ta)*s); ctx.lineTo(Math.cos(ta)*s*1.8,Math.sin(ta)*s*1.8); ctx.stroke(); }
                break;
            case 'boss':
                ctx.fillStyle = '#3a0000';
                ctx.beginPath(); ctx.moveTo(-s*0.8,-s*0.3); ctx.lineTo(-s*2.8,-s*2.2); ctx.lineTo(-s*1.6,-s*0.1); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(s*0.8,-s*0.3); ctx.lineTo(s*2.8,-s*2.2); ctx.lineTo(s*1.6,-s*0.1); ctx.closePath(); ctx.fill();
                ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#5a0000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0,0,s*0.7,0,Math.PI*2); ctx.stroke();
                ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(-s*0.38,-s*0.22,s*0.22,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.38,-s*0.22,s*0.22,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-s*0.38,-s*0.22,s*0.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(s*0.38,-s*0.22,s*0.1,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#c0a040'; ctx.beginPath(); ctx.moveTo(-s*0.15,-s); ctx.lineTo(0,-s*1.55); ctx.lineTo(s*0.15,-s); ctx.closePath(); ctx.fill();
                break;
            default:
                ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1; ctx.restore();
        // HP bar
        var bw = def.size * 2.6, bh = 4, bx = enemy.x - bw/2, by = enemy.y - def.size - 9;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
        ctx.fillStyle = '#333'; ctx.fillRect(bx,by,bw,bh);
        var ratio = enemy.hp / enemy.maxHp;
        ctx.fillStyle = ratio > 0.6 ? '#4cbb6c' : ratio > 0.3 ? '#f0a020' : '#e03030';
        ctx.fillRect(bx, by, bw * ratio, bh);
    }

    function drawEnemies() { state.enemies.forEach(drawEnemy); }

    // ====================================================================
    // SWORD SWING ANIMATION
    // ====================================================================

    function drawSwordSwingAnim() {
        if (!swordSwing.active) return;
        var h     = state.hero;
        var t     = easeInOut(swordSwing.progress);
        var range = getAttackRange();
        var arc   = Math.PI * 0.85;
        var start = swordSwing.dir - arc / 2;
        var wColor = '#e0e0e0', wSub = '#888';
        if (h.weapon && ITEM_DEFS[h.weapon]) { wColor = ITEM_DEFS[h.weapon].color; wSub = ITEM_DEFS[h.weapon].subColor; }

        ctx.save();
        ctx.translate(h.x, h.y);

        // Trail arc
        ctx.globalAlpha = (1 - t) * 0.85;
        ctx.strokeStyle = wColor; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 0, range * 0.72, start, start + arc * t); ctx.stroke();

        // Blade at tip of arc
        var cur = start + arc * t;
        ctx.globalAlpha = 0.92;
        ctx.rotate(cur);
        ctx.fillStyle = wColor; ctx.fillRect(-2, -range * 0.88, 4, range * 0.70);
        ctx.fillStyle = wSub;   ctx.fillRect(-6, -range * 0.20, 12, 4);

        ctx.restore();
    }

    // ====================================================================
    // HERO DRAWING
    // ====================================================================

    function drawHero() {
        var h = state.hero, s = h.radius;
        ctx.save();
        ctx.translate(h.x, h.y);
        if (h.hitFlash > 0) { ctx.globalAlpha = 0.5 + 0.5 * (1 - h.hitFlash / 0.22); h.hitFlash = Math.max(0, h.hitFlash - 0.016); }
        var bodyColor = h.armor && ITEM_DEFS[h.armor] ? ITEM_DEFS[h.armor].color : '#2a5a9a';
        ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.arc(0, s*0.2, s*0.82, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f0c090'; ctx.beginPath(); ctx.arc(0, -s*0.45, s*0.58, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#553311'; ctx.beginPath(); ctx.arc(0, -s*0.72, s*0.5, Math.PI, Math.PI*2); ctx.fill();
        ctx.fillStyle = h.armor && ITEM_DEFS[h.armor] ? ITEM_DEFS[h.armor].subColor : '#1a3a6a';
        ctx.beginPath(); ctx.moveTo(-s*0.72,s*0.1); ctx.lineTo(-s*0.6,s*1.25); ctx.lineTo(s*0.6,s*1.25); ctx.lineTo(s*0.72,s*0.1); ctx.closePath(); ctx.fill();
        if (!swordSwing.active && h.weapon && ITEM_DEFS[h.weapon]) {
            var wDef = ITEM_DEFS[h.weapon];
            ctx.save(); ctx.translate(s*0.85, s*0.1); ctx.rotate(-0.45);
            ctx.fillStyle = wDef.color; ctx.fillRect(-2, -s*1.1, 4, s*1.1);
            ctx.fillStyle = wDef.subColor; ctx.fillRect(-5, -s*1.1, 10, 3);
            ctx.fillStyle = '#8b6914'; ctx.fillRect(-1.5, -s*0.05, 3, s*0.6);
            ctx.restore();
        } else if (!swordSwing.active) {
            ctx.fillStyle = '#f0c090'; ctx.beginPath(); ctx.arc(s*0.82, s*0.18, 3.5, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1; ctx.restore();

        drawSwordSwingAnim();

        if (h.attackCooldown > 0.05) {
            var prog = 1 - h.attackCooldown / ATTACK_COOLDOWN_SECS;
            ctx.strokeStyle = 'rgba(255,255,200,' + (0.10 * (1 - prog)) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, h.y, getAttackRange(), 0, Math.PI * 2); ctx.stroke();
        }
        var hbW = 32, hbH = 4, hpR = h.hp / h.maxHp, hbX = h.x - hbW/2, hbY = h.y - s - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(hbX-1,hbY-1,hbW+2,hbH+2);
        ctx.fillStyle = '#222'; ctx.fillRect(hbX,hbY,hbW,hbH);
        ctx.fillStyle = hpR > 0.6 ? '#4cbb6c' : hpR > 0.3 ? '#f0a020' : '#e03030';
        ctx.fillRect(hbX, hbY, hbW * hpR, hbH);
    }

    // ====================================================================
    // FLOAT TEXTS & HIT FLASHES
    // ====================================================================

    function drawFloatTexts(dt) {
        floatTexts = floatTexts.filter(function (ft) {
            ft.age += dt; ft.y += ft.vy * dt;
            if (ft.age >= ft.life) return false;
            ctx.globalAlpha = 1 - ft.age / ft.life;
            ctx.fillStyle = ft.color; ctx.font = 'bold ' + ft.size + 'px Arial';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1; return true;
        });
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    function drawHitFlashes(dt) {
        hitFlashes = hitFlashes.filter(function (hf) {
            hf.age += dt; if (hf.age >= hf.life) return false;
            ctx.globalAlpha = 0.55 * (1 - hf.age / hf.life);
            ctx.fillStyle = '#ff5555'; ctx.beginPath(); ctx.arc(hf.x, hf.y, hf.r * 1.6, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1; return true;
        });
    }

    // ====================================================================
    // TRANSITION OVERLAY
    // ====================================================================

    function drawTransitionOverlay() {
        if (!trans.active) return;
        var alpha;
        if (trans.phase === 'fadeout') {
            alpha = easeInOut(clamp(trans.timer / FADE_OUT_DUR, 0, 1));
        } else {
            alpha = easeInOut(clamp(1 - trans.timer / FADE_IN_DUR, 0, 1));
        }
        ctx.fillStyle = 'rgba(0,0,0,' + (alpha * 0.92) + ')';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        if (alpha > 0.3) {
            ctx.fillStyle = 'rgba(255,215,0,' + ((alpha - 0.3) / 0.7) + ')';
            ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(trans.msg, CANVAS_W / 2, CANVAS_H / 2);
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        }
    }

    function drawPauseOverlay() {
        if (!paused) return;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('\u23F8 PAUSED', CANVAS_W/2, CANVAS_H/2);
        ctx.fillStyle = '#dddddd'; ctx.font = '20px Arial';
        ctx.fillText('Press P or click Resume to continue', CANVAS_W/2, CANVAS_H/2+50);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    // ====================================================================
    // WORLD MAP OVERLAY
    // ====================================================================

    // Layout positions for each area on the map panel (relative to panel origin)
    var MAP_LAYOUT = [
        { id: 7, col: 0, row: 0 },   // Elder's Hall
        { id: 8, col: 1, row: 0 },   // Smithy
        { id: 9, col: 2, row: 0 },   // Relic Cavern
        { id: 10, col: 3, row: 0 },  // Shadow Sanctum
        { id: 0, col: 0, row: 1 },   // Sunlit Meadow
        { id: 1, col: 1, row: 1 },   // Forest Clearing
        { id: 2, col: 2, row: 1 },   // Ancient Town
        { id: 3, col: 0, row: 2 },   // Dark Caves
        { id: 4, col: 1, row: 2 },   // Cursed Keep
        { id: 5, col: 2, row: 2 },   // Shadow Fortress
        { id: 6, col: 3, row: 2 }    // Dragon's Lair
    ];

    var BIOME_MAP_COLOR = {
        meadow: '#4a9a28', forest: '#1a6010', town: '#c8a870',
        cave:   '#1a1a44', keep:   '#3a1818', lair: '#5a1800'
    };

    function drawWorldMap() {
        if (!mapOpen) return;
        var pw = 680, ph = 390, px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2;
        var cellW = 136, cellH = 82, colOff = 52, rowOff = 62;

        ctx.save();
        // Panel background
        ctx.fillStyle   = 'rgba(8,8,20,0.92)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#8888aa'; ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        // Title
        ctx.fillStyle   = '#ffd700'; ctx.font = 'bold 18px Arial';
        ctx.textAlign   = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('World Map & Story Routes [M to close]', px + pw / 2, py + 10);

        // Compute area box positions
        var boxes = {};
        MAP_LAYOUT.forEach(function (ml) {
            boxes[ml.id] = {
                x: px + colOff + ml.col * (cellW + 10),
                y: py + rowOff + ml.row * (cellH + 10)
            };
        });

        // Draw connection lines
        ctx.strokeStyle = 'rgba(140,140,180,0.55)'; ctx.lineWidth = 2;
        AREAS.forEach(function (area) {
            var b = boxes[area.id];
            if (!b) return;
            ['right','left','up','down'].forEach(function (dir) {
                var nid = area.neighbors[dir];
                if (nid == null || !boxes[nid]) return;
                var nb = boxes[nid];
                ctx.beginPath();
                ctx.moveTo(b.x + cellW / 2, b.y + cellH / 2);
                ctx.lineTo(nb.x + cellW / 2, nb.y + cellH / 2);
                ctx.stroke();
            });
        });

        // Portal links (interior/exterior)
        ctx.strokeStyle = 'rgba(255,205,90,0.42)';
        ctx.setLineDash([5, 4]);
        PORTALS.forEach(function (portal) {
            if (portal.areaId > portal.targetAreaId) return;
            if (!boxes[portal.areaId] || !boxes[portal.targetAreaId]) return;
            var a = boxes[portal.areaId], b = boxes[portal.targetAreaId];
            ctx.beginPath();
            ctx.moveTo(a.x + cellW / 2, a.y + cellH / 2);
            ctx.lineTo(b.x + cellW / 2, b.y + cellH / 2);
            ctx.stroke();
        });
        ctx.setLineDash([]);

        // Draw area boxes
        AREAS.forEach(function (area) {
            var b = boxes[area.id];
            if (!b) return;
            var visited = state.areasVisited.indexOf(area.id) !== -1 || state.upgrades.mapCharter;
            var current = area.id === state.areaIndex;
            var discovered = state.storyState.discoveredLocations.indexOf(area.id) !== -1 || visited;
            var showName = visited || discovered;

            ctx.fillStyle = showName ? BIOME_MAP_COLOR[area.biome] || '#333' : '#111122';
            ctx.fillRect(b.x, b.y, cellW, cellH);

            // Current area highlight
            if (current) {
                ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3;
                ctx.strokeRect(b.x - 2, b.y - 2, cellW + 4, cellH + 4);
            } else {
                ctx.strokeStyle = showName ? '#6688aa' : '#333355'; ctx.lineWidth = 1.5;
                ctx.strokeRect(b.x, b.y, cellW, cellH);
            }

            // Name label
            if (showName) {
                ctx.fillStyle   = current ? '#ffd700' : '#dde0ff';
                ctx.font        = current ? 'bold 11px Arial' : '10px Arial';
                ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(area.name, b.x + cellW / 2, b.y + cellH / 2 - 6);
                // Difficulty stars
                ctx.fillStyle = '#ffcc00'; ctx.font = '10px Arial';
                var stars = '';
                for (var k = 0; k < Math.round(area.difficulty); k++) stars += '\u2605';
                ctx.fillText(stars || (area.isInterior ? 'Interior' : ''), b.x + cellW / 2, b.y + cellH / 2 + 10);
            } else {
                ctx.fillStyle = '#555566'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('???', b.x + cellW / 2, b.y + cellH / 2);
            }

            if (area.id === 10 && !state.storyState.flags.fortressAccess) {
                ctx.fillStyle = '#ff8888';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('LOCKED', b.x + cellW / 2, b.y + cellH - 14);
            }

            // Player marker
            if (current) {
                ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Arial';
                ctx.fillText('\u2605', b.x + cellW / 2, b.y + cellH - 14);
            }
        });

        // Legend
        ctx.fillStyle = '#aaaacc'; ctx.font = '11px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('\u2605 current  \u2605\u2605\u2605 difficulty  dashed line = portal  LOCKED = needs sigil', px + 12, py + ph - 12);

        ctx.restore();
    }

    // ====================================================================
    // FULL SCENE
    // ====================================================================

    function drawScene(dt) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawBackground();
        drawTerrainObstacles();
        drawTransitionPreview();
        drawPortals();
        drawItems();
        drawHitFlashes(dt);
        drawNpcs();
        drawEnemies();
        drawHero();
        drawFloatTexts(dt);
        drawTransitionOverlay();
        drawPauseOverlay();
        drawWorldMap();
    }

    // ====================================================================
    // HUD UPDATE
    // ====================================================================

    function updateHUD() {
        var h    = state.hero;
        var area = AREAS[state.areaIndex] || AREAS[0];
        var lvlIdx = Math.min(h.level, XP_TABLE.length - 1);
        if (elHealth) elHealth.textContent = Math.max(0, Math.round(h.hp)) + ' / ' + h.maxHp;
        if (elScore)  elScore.textContent  = state.score;
        if (elRelics) elRelics.textContent = state.relics;
        if (elLevel)  elLevel.textContent  = h.level;
        if (elXp)     elXp.textContent     = h.xp + ' / ' + XP_TABLE[lvlIdx];
        if (elArea)   elArea.textContent   = area.name;
        if (elWeapon) elWeapon.textContent = h.weapon ? (ITEM_DEFS[h.weapon] ? ITEM_DEFS[h.weapon].name : h.weapon) : 'None';
        if (elArmor)  elArmor.textContent  = h.armor  ? (ITEM_DEFS[h.armor]  ? ITEM_DEFS[h.armor].name  : h.armor)  : 'None';
        if (elKills)  elKills.textContent  = state.totalKills;
        if (elAtk)    elAtk.textContent    = getHeroAttack();
        if (elDef)    elDef.textContent    = getHeroDefense() + '%';
        if (elObjective) {
            var chapter = STORY_CHAPTERS[Math.min(state.storyState.chapter || 0, STORY_CHAPTERS.length - 1)];
            var objective = state.questState.completed ? 'Completed: ' + state.questState.objective : state.questState.objective;
            elObjective.textContent = objective + ' — ' + chapter;
        }
    }

    function updateHintText() {
        if (!elHint) return;
        if (interactionContext && interactionContext.type === 'npc') {
            elHint.textContent = 'Press E to talk to ' + interactionContext.npc.name + '.';
            return;
        }
        if (interactionContext && interactionContext.type === 'portal') {
            var p = interactionContext.portal;
            if (hasPortalAccess(p)) elHint.textContent = 'Press E to ' + (p.label || 'enter') + '.';
            else elHint.textContent = p.lockedMsg || 'This entrance is locked.';
            return;
        }
        var area = AREAS[state.areaIndex];
        if (area && area.isInterior) elHint.textContent = 'Explore interior spaces and talk to NPCs. Press E near doors or NPCs.';
        else elHint.textContent = 'Explore! Edge arrows transition where passages are clear. Press E for NPCs and doors.';
    }

    // ====================================================================
    // GAME LOOP
    // ====================================================================

    function gameTick(ts) {
        try {
            if (!lastTick) lastTick = ts;
            var dt = Math.min(0.05, (ts - lastTick) / 1000);
            lastTick = ts;

            if (!paused && !trans.active) {
                state.hero.attackCooldown = Math.max(0, state.hero.attackCooldown - dt);
                moveHero(dt);
                moveEnemies(dt);
                collectItems();

                // Sword swing animation tick
                if (swordSwing.active) {
                    swordSwing.progress += dt / swordSwing.duration;
                    // Apply damage at midpoint of swing
                    if (!swordSwing.hitDealt && swordSwing.progress >= 0.45) {
                        applySwingDamage();
                        swordSwing.hitDealt = true;
                    }
                    if (swordSwing.progress >= 1.0) {
                        swordSwing.active   = false;
                        swordSwing.progress = 0;
                    }
                }

                if (transitionCooldown > 0) transitionCooldown -= dt;
                if (interactionCooldown > 0) interactionCooldown -= dt;
                if (transitionBlockCooldown > 0) transitionBlockCooldown -= dt;
                if (state.tick % 300 === 0) persist();
                state.tick++;
            }

            // Transition phase ticking
            if (trans.active) {
                trans.timer += dt;
                if (trans.phase === 'fadeout' && trans.timer >= FADE_OUT_DUR) {
                    applyTransitionMidpoint();
                    trans.phase = 'fadein';
                    trans.timer = 0;
                } else if (trans.phase === 'fadein' && trans.timer >= FADE_IN_DUR) {
                    trans.active = false;
                    trans.phase  = 'none';
                    trans.timer  = 0;
                    transitionCooldown = 0.6; // brief lockout to prevent re-trigger
                }
            }

            // Notifications
            if (notifTimer > 0) { notifTimer -= dt; if (notifTimer <= 0) showNextNotif(); }

            drawScene(dt);
            updateHUD();
            updateHintText();
            animFrame = requestAnimationFrame(gameTick);
        } catch (err) {
            console.error('gameTick error', err);
            setStatus('error', 'Error \u2014 see console');
        }
    }

    // ====================================================================
    // GAME CONTROL
    // ====================================================================

    function newGame() {
        if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null; }
        state              = makeBaseState();
        paused             = false;
        mouseTarget        = null;
        trans              = { active: false, phase: 'none', timer: 0, dir: null, fromAreaId: 0, toAreaId: 0, targetX: 0, targetY: 0, msg: '' };
        swordSwing         = { active: false, progress: 0, duration: 0.22, dir: 0, hitDealt: false };
        transitionCooldown = 0;
        mapOpen            = false;
        floatTexts         = [];
        hitFlashes         = [];
        notifQueue         = [];
        notifTimer         = 0;
        lastTick           = 0;
        populateArea();
        persist();
        setStatus('playing', 'New Adventure!');
        if (elHint)    elHint.textContent    = 'Explore! M = map, Space/Enter = attack, E = interact.';
        if (elPauseBtn)elPauseBtn.textContent = 'Pause';
        if (elNotif)   elNotif.textContent   = '';
        updateHUD();
        animFrame = requestAnimationFrame(gameTick);
    }

    function togglePause() {
        paused = !paused;
        setStatus(paused ? 'paused' : 'playing', paused ? 'Paused' : 'Playing');
        if (elPauseBtn) elPauseBtn.textContent = paused ? 'Resume' : 'Pause';
    }

    // ====================================================================
    // INITIALIZATION
    // ====================================================================

    function init() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        elStatus  = document.getElementById('statusText');
        elHealth  = document.getElementById('healthValue');
        elScore   = document.getElementById('scoreValue');
        elRelics  = document.getElementById('relicValue');
        elLevel   = document.getElementById('levelValue');
        elXp      = document.getElementById('xpValue');
        elArea    = document.getElementById('areaValue');
        elWeapon  = document.getElementById('weaponValue');
        elArmor   = document.getElementById('armorValue');
        elKills   = document.getElementById('killsValue');
        elAtk     = document.getElementById('attackValue');
        elDef     = document.getElementById('defenseValue');
        elNotif   = document.getElementById('notifText');
        elObjective = document.getElementById('objectiveValue');
        elPauseBtn = document.getElementById('pauseBtn');
        elHint    = document.getElementById('gameHint');

        var themeToggle = document.getElementById('themeToggle');
        var saveDataEl  = document.getElementById('saveData');

        window.addEventListener('keydown', function (evt) {
            keys[evt.key] = true;
            if (evt.key === ' ' || evt.key === 'Enter') {
                evt.preventDefault();
                if (!paused && !trans.active) tryAttack();
            } else if (evt.key === 'p' || evt.key === 'P') {
                if (!trans.active) togglePause();
            } else if (evt.key === 'n' || evt.key === 'N') {
                newGame();
            } else if (evt.key === 'm' || evt.key === 'M') {
                mapOpen = !mapOpen;
            } else if (evt.key === 'e' || evt.key === 'E') {
                evt.preventDefault();
                interact();
            }
        });
        window.addEventListener('keyup', function (evt) { keys[evt.key] = false; });

        canvas.addEventListener('click', function (evt) {
            if (mapOpen) { mapOpen = false; return; }
            if (paused || trans.active) return;
            var rect = canvas.getBoundingClientRect();
            mouseTarget = {
                x: (evt.clientX - rect.left) * (CANVAS_W / rect.width),
                y: (evt.clientY - rect.top)  * (CANVAS_H / rect.height)
            };
        });

        canvas.addEventListener('touchstart', function (evt) {
            if (!evt.touches || !evt.touches.length) return;
            if (paused || trans.active) return;
            var rect = canvas.getBoundingClientRect(), t = evt.touches[0];
            mouseTarget = {
                x: (t.clientX - rect.left) * (CANVAS_W / rect.width),
                y: (t.clientY - rect.top)  * (CANVAS_H / rect.height)
            };
        }, { passive: true });

        var newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) newGameBtn.addEventListener('click', newGame);

        if (elPauseBtn) elPauseBtn.addEventListener('click', function () { if (!trans.active) togglePause(); });

        var attackBtn = document.getElementById('attackBtn');
        if (attackBtn) attackBtn.addEventListener('click', function () { if (!paused && !trans.active) tryAttack(); });

        var interactBtn = document.getElementById('interactBtn');
        if (interactBtn) interactBtn.addEventListener('click', interact);

        var mapBtn = document.getElementById('mapBtn');
        if (mapBtn) mapBtn.addEventListener('click', function () { mapOpen = !mapOpen; });

        var saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.addEventListener('click', function () { persist(); setStatus(paused ? 'paused' : 'playing', 'Saved!'); });

        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', function () {
            persist();
            var raw = ''; try { raw = localStorage.getItem(STORAGE_KEY) || ''; } catch (e) {}
            if (saveDataEl) { saveDataEl.value = raw; saveDataEl.focus(); saveDataEl.select(); }
            setStatus(paused ? 'paused' : 'playing', 'Exported!');
        });

        var importBtn = document.getElementById('importBtn');
        if (importBtn) importBtn.addEventListener('click', function () {
            if (!saveDataEl) return;
            try {
                var parsed = JSON.parse(saveDataEl.value);
                if (!parsed || !parsed.hero) throw new Error('Invalid save data payload.');
                if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null; }
                state = migrateSaveData(parsed);
                if (!state) throw new Error('Save migration failed.');
                syncStateDefaults();
                paused = false; mouseTarget = null;
                trans  = { active: false, phase: 'none', timer: 0, dir: null, fromAreaId: 0, toAreaId: 0, targetX: 0, targetY: 0, msg: '' };
                swordSwing = { active: false, progress: 0, duration: 0.22, dir: 0, hitDealt: false };
                transitionCooldown = 0; floatTexts = []; hitFlashes = []; lastTick = 0;
                persist(); setStatus('playing', 'Save imported!');
                if (elPauseBtn) elPauseBtn.textContent = 'Pause';
                updateHUD();
                animFrame = requestAnimationFrame(gameTick);
            } catch (err) { setStatus('error', 'Import failed: ' + err.message); }
        });

        var resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.addEventListener('click', function () {
            if (!window.confirm('Reset all progress and start a brand new game?')) return;
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
            newGame();
        });

        if (themeToggle) themeToggle.addEventListener('click', function () {
            var next = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', next);
            themeToggle.setAttribute('aria-pressed', String(next === 'light'));
            themeToggle.textContent = next === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';
            persist();
        });

        window.addEventListener('beforeunload', persist);
        loadSave();
        updateHUD();
        setStatus('playing', 'Ready \u2014 Press New Game or start moving!');
        animFrame = requestAnimationFrame(gameTick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());
