/* BrowserQuest Standalone Game v2
 * Refactored from single-file standalone.html into standalone.js + standalone.css + standalone.html
 * Architecture: IIFE module, no external dependencies, Canvas 2D rendering with shape-based fallback
 */
(function () {
    'use strict';

    // ====================================================================
    // CONSTANTS
    // ====================================================================

    var STORAGE_KEY = 'bq_standalone_v2';
    var CANVAS_W = 1100;
    var CANVAS_H = 620;

    var AREAS = [
        {
            id: 0, name: 'Forest Clearing',
            bgColor: '#0b1a0b', gridColor: 'rgba(34,90,34,0.35)',
            borderColor: 'rgba(60,160,60,0.25)',
            enemyTypes: ['rat', 'goblin'],
            enemyCount: 3, difficulty: 1.0,
            description: 'A mossy clearing teeming with rats and goblins.'
        },
        {
            id: 1, name: 'Dark Caves',
            bgColor: '#0d0d1a', gridColor: 'rgba(40,40,100,0.35)',
            borderColor: 'rgba(80,80,180,0.25)',
            enemyTypes: ['bat', 'skeleton'],
            enemyCount: 4, difficulty: 1.5,
            description: 'Eerie tunnels echoing with bat wings and rattling bones.'
        },
        {
            id: 2, name: 'Cursed Keep',
            bgColor: '#1a0d0d', gridColor: 'rgba(90,20,20,0.35)',
            borderColor: 'rgba(160,40,40,0.25)',
            enemyTypes: ['skeleton', 'ogre'],
            enemyCount: 4, difficulty: 2.0,
            description: 'A crumbling fortress haunted by the cursed dead.'
        },
        {
            id: 3, name: "Dragon's Lair",
            bgColor: '#1a0800', gridColor: 'rgba(110,35,0,0.45)',
            borderColor: 'rgba(200,60,0,0.3)',
            enemyTypes: ['eye', 'boss'],
            enemyCount: 3, difficulty: 3.0,
            description: 'A scorched lair. The air reeks of sulfur and ancient power.'
        }
    ];

    var ENEMY_DEFS = {
        rat: {
            name: 'Rat', color: '#7a3a10', size: 9,
            maxHp: 3, attack: 8, speed: 68, xp: 5,
            itemChance: 0.15, items: ['flask']
        },
        goblin: {
            name: 'Goblin', color: '#2e6e18', size: 11,
            maxHp: 6, attack: 12, speed: 52, xp: 12,
            itemChance: 0.22, items: ['flask', 'sword1']
        },
        bat: {
            name: 'Bat', color: '#4a1e6a', size: 10,
            maxHp: 5, attack: 10, speed: 88, xp: 12,
            itemChance: 0.15, items: ['flask']
        },
        skeleton: {
            name: 'Skeleton', color: '#c0c0c0', size: 12,
            maxHp: 9, attack: 16, speed: 46, xp: 20,
            itemChance: 0.28, items: ['flask', 'clotharmor']
        },
        ogre: {
            name: 'Ogre', color: '#5e3618', size: 18,
            maxHp: 22, attack: 26, speed: 36, xp: 45,
            itemChance: 0.42, items: ['bluesword', 'leatherarmor', 'firepotion']
        },
        eye: {
            name: 'Evil Eye', color: '#a01818', size: 14,
            maxHp: 16, attack: 22, speed: 72, xp: 32,
            itemChance: 0.38, items: ['firepotion', 'bluesword']
        },
        boss: {
            name: 'Dragon', color: '#780000', size: 22,
            maxHp: 65, attack: 38, speed: 42, xp: 160,
            itemChance: 0.85, items: ['goldensword', 'goldenarmor', 'firepotion']
        }
    };

    var ITEM_DEFS = {
        /* Weapons */
        sword1: {
            name: 'Iron Sword', type: 'weapon',
            color: '#b0b0b0', subColor: '#787878',
            attackBonus: 15, range: 10
        },
        bluesword: {
            name: 'Blue Sword', type: 'weapon',
            color: '#4488ff', subColor: '#2244bb',
            attackBonus: 30, range: 15
        },
        goldensword: {
            name: 'Golden Sword', type: 'weapon',
            color: '#ffd700', subColor: '#b8860b',
            attackBonus: 50, range: 20
        },
        /* Armor */
        clotharmor: {
            name: 'Cloth Armor', type: 'armor',
            color: '#8b6914', subColor: '#5a4510',
            defenseBonus: 12
        },
        leatherarmor: {
            name: 'Leather Armor', type: 'armor',
            color: '#8b4513', subColor: '#5a2b0d',
            defenseBonus: 22
        },
        mailarmor: {
            name: 'Mail Armor', type: 'armor',
            color: '#909090', subColor: '#585858',
            defenseBonus: 35
        },
        goldenarmor: {
            name: 'Golden Armor', type: 'armor',
            color: '#ffd700', subColor: '#b8860b',
            defenseBonus: 50
        },
        /* Consumables */
        flask: {
            name: 'Health Flask', type: 'heal',
            color: '#2ecc71', subColor: '#1a7a45',
            heal: 28
        },
        firepotion: {
            name: 'Fire Potion', type: 'heal',
            color: '#e74c3c', subColor: '#922b21',
            heal: 65
        },
        /* Collectibles */
        relic: {
            name: 'Ancient Relic', type: 'relic',
            color: '#ffd76b', subColor: '#9b7200'
        }
    };

    var XP_TABLE = [0, 50, 120, 220, 350, 520, 730, 990, 1310, 1700];

    // ====================================================================
    // RUNTIME STATE
    // ====================================================================

    var state;
    var paused = false;
    var lastTick = 0;
    var animFrame = null;
    var keys = {};
    var mouseTarget = null;
    var transitioning = false;
    var transitionTimer = 0;
    var transitionMsg = '';
    var floatTexts = [];
    var hitFlashes = [];
    var notifQueue = [];
    var notifTimer = 0;

    // ====================================================================
    // DOM REFERENCES (set up in init)
    // ====================================================================

    var canvas, ctx;
    var elStatus, elHealth, elScore, elRelics, elLevel, elXp, elArea;
    var elWeapon, elArmor, elKills, elAtk, elDef, elNotif;
    var elPauseBtn, elHint;

    // ====================================================================
    // HELPERS
    // ====================================================================

    function rnd(min, max) { return Math.random() * (max - min) + min; }
    function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
    function dist2(a, b) {
        var dx = a.x - b.x, dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    function addFloat(x, y, text, color, size) {
        floatTexts.push({
            x: x, y: y, text: text,
            color: color || '#fff',
            size: size || 14,
            age: 0, life: 1.6, vy: -36
        });
    }

    function addHitFlash(x, y, radius) {
        hitFlashes.push({ x: x, y: y, r: radius, age: 0, life: 0.28 });
    }

    function showNotif(msg) {
        notifQueue.push(msg);
        if (notifTimer <= 0) showNextNotif();
    }

    function showNextNotif() {
        if (notifQueue.length === 0) {
            if (elNotif) elNotif.textContent = '';
            notifTimer = 0;
            return;
        }
        var msg = notifQueue.shift();
        if (elNotif) elNotif.textContent = msg;
        notifTimer = 2.8;
    }

    function setStatus(mode, msg) {
        if (!elStatus) return;
        elStatus.className = 'status status-' + mode;
        elStatus.textContent = 'Status: ' + msg;
    }

    // ====================================================================
    // HERO STATS HELPERS
    // ====================================================================

    function getHeroAttack() {
        var atk = state.hero.attack;
        if (state.hero.weapon && ITEM_DEFS[state.hero.weapon]) {
            atk += ITEM_DEFS[state.hero.weapon].attackBonus || 0;
        }
        return atk;
    }

    function getHeroDefense() {
        var def = state.hero.defense;
        if (state.hero.armor && ITEM_DEFS[state.hero.armor]) {
            def += ITEM_DEFS[state.hero.armor].defenseBonus || 0;
        }
        return Math.min(80, def); // cap at 80% damage reduction
    }

    function getAttackRange() {
        var range = 58;
        if (state.hero.weapon && ITEM_DEFS[state.hero.weapon]) {
            range += ITEM_DEFS[state.hero.weapon].range || 0;
        }
        return range;
    }

    // ====================================================================
    // BASE STATE
    // ====================================================================

    function makeHero() {
        return {
            x: CANVAS_W / 2,
            y: CANVAS_H / 2,
            speed: 148,
            radius: 14,
            hp: 100,
            maxHp: 100,
            attack: 18,
            defense: 0,
            level: 1,
            xp: 0,
            weapon: null,
            armor: null,
            attackCooldown: 0,
            hitFlash: 0,
            kills: 0
        };
    }

    function makeBaseState() {
        return {
            areaIndex: 0,
            areasVisited: [0],
            hero: makeHero(),
            enemies: [],
            items: [],
            score: 0,
            relics: 0,
            totalKills: 0,
            tick: 0
        };
    }

    // ====================================================================
    // SAVE / LOAD
    // ====================================================================

    function serialize() {
        return {
            version: 2,
            areaIndex: state.areaIndex,
            areasVisited: state.areasVisited,
            hero: state.hero,
            enemies: state.enemies,
            items: state.items,
            score: state.score,
            relics: state.relics,
            totalKills: state.totalKills,
            tick: state.tick,
            theme: document.body.getAttribute('data-theme') || 'dark'
        };
    }

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize())); } catch (e) { /* ignored */ }
    }

    function loadSave() {
        var fresh = false;
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) { fresh = true; }
            else {
                var d = JSON.parse(raw);
                if (!d || d.version !== 2 || !d.hero) { fresh = true; }
                else {
                    state = d;
                    // validate required fields
                    if (!Array.isArray(state.enemies)) { state.enemies = []; }
                    if (!Array.isArray(state.items)) { state.items = []; }
                    if (typeof state.areaIndex !== 'number') { state.areaIndex = 0; }
                    if (!Array.isArray(state.areasVisited)) { state.areasVisited = [0]; }
                    if (typeof state.totalKills !== 'number') { state.totalKills = 0; }
                    // Ensure hero has all fields (migration safety)
                    var base = makeHero();
                    Object.keys(base).forEach(function (k) {
                        if (state.hero[k] === undefined) { state.hero[k] = base[k]; }
                    });
                    if (d.theme === 'light') {
                        document.body.setAttribute('data-theme', 'light');
                    }
                    setStatus('ready', 'Ready (save restored)');
                }
            }
        } catch (e) {
            fresh = true;
        }
        if (fresh) {
            state = makeBaseState();
            populateArea();
        }
    }

    // ====================================================================
    // AREA MANAGEMENT
    // ====================================================================

    function spawnEnemiesForArea() {
        var area = AREAS[state.areaIndex];
        var count = area.enemyCount + Math.floor(state.hero.level * 0.4);
        var enemies = [];
        for (var i = 0; i < count; i++) {
            var typeName = area.enemyTypes[rndInt(0, area.enemyTypes.length - 1)];
            var def = ENEMY_DEFS[typeName];
            var scaledHp = Math.round(def.maxHp * (1 + (area.difficulty - 1) * 0.35));
            var ex, ey, attempts = 0;
            do {
                ex = rnd(50, CANVAS_W - 50);
                ey = rnd(50, CANVAS_H - 50);
                attempts++;
            } while (dist2({ x: ex, y: ey }, state.hero) < 180 && attempts < 20);
            enemies.push({
                type: typeName,
                x: ex, y: ey,
                hp: scaledHp, maxHp: scaledHp,
                wobble: rnd(0, Math.PI * 2),
                attackCooldown: rnd(0.5, 1.5),
                hitFlash: 0
            });
        }
        return enemies;
    }

    function spawnItemsForArea() {
        var items = [];
        // 2-3 relics per area
        var relicCount = rndInt(2, 3);
        for (var i = 0; i < relicCount; i++) {
            items.push({
                type: 'relic',
                x: rnd(60, CANVAS_W - 60),
                y: rnd(60, CANVAS_H - 60),
                radius: 11
            });
        }
        // Optional item based on area
        if (Math.random() < 0.65) {
            var pool = ['flask', 'clotharmor', 'leatherarmor', 'mailarmor',
                'sword1', 'bluesword', 'firepotion'];
            var key = pool[rndInt(0, pool.length - 1)];
            items.push({
                type: key,
                x: rnd(60, CANVAS_W - 60),
                y: rnd(60, CANVAS_H - 60),
                radius: 10
            });
        }
        return items;
    }

    function populateArea() {
        state.enemies = spawnEnemiesForArea();
        state.items = spawnItemsForArea();
        mouseTarget = null;
    }

    function doAreaTransition(nextAreaId) {
        if (transitioning) { return; }
        var total = AREAS.length;
        nextAreaId = ((nextAreaId % total) + total) % total;
        transitioning = true;
        transitionTimer = 1.8;
        var nextArea = AREAS[nextAreaId];
        transitionMsg = 'Entering ' + nextArea.name + '…';
        showNotif(transitionMsg + ' ' + nextArea.description);

        setTimeout(function () {
            state.areaIndex = nextAreaId;
            if (state.areasVisited.indexOf(nextAreaId) === -1) {
                state.areasVisited.push(nextAreaId);
                state.score += 50;
                showNotif('New area discovered: ' + nextArea.name + ' (+50 score)');
            }
            state.hero.x = CANVAS_W / 2;
            state.hero.y = CANVAS_H / 2;
            populateArea();
            persist();
            updateHUD();
            transitioning = false;
            transitionTimer = 0;
        }, 900);
    }

    // ====================================================================
    // COMBAT
    // ====================================================================

    function tryAttack() {
        if (state.hero.attackCooldown > 0) { return; }
        var range = getAttackRange();
        var atk = getHeroAttack();
        var hitCount = 0;

        state.enemies = state.enemies.filter(function (enemy) {
            if (dist2(state.hero, enemy) > range) { return true; }
            var def = ENEMY_DEFS[enemy.type];
            var dmg = Math.max(1, Math.round(atk * (0.85 + Math.random() * 0.3)));
            enemy.hp -= dmg;
            enemy.hitFlash = 0.3;
            addHitFlash(enemy.x, enemy.y, def.size);
            addFloat(enemy.x, enemy.y - def.size - 4, '-' + dmg, '#ff5555', 13);
            hitCount++;
            if (enemy.hp <= 0) {
                state.score += def.xp;
                state.hero.xp += def.xp;
                state.hero.kills++;
                state.totalKills++;
                addFloat(enemy.x, enemy.y, '+' + def.xp + ' XP', '#7ad985', 12);
                // Drop item
                if (Math.random() < def.itemChance) {
                    var dropType = def.items[rndInt(0, def.items.length - 1)];
                    state.items.push({
                        type: dropType,
                        x: enemy.x + rnd(-18, 18),
                        y: enemy.y + rnd(-18, 18),
                        radius: 10
                    });
                }
                checkLevelUp();
                return false;
            }
            return true;
        });

        if (hitCount > 0) {
            state.hero.attackCooldown = 0.38;
            setStatus('playing', 'Playing');
        }
    }

    function checkLevelUp() {
        var hero = state.hero;
        var xpNeeded = XP_TABLE[Math.min(hero.level, XP_TABLE.length - 1)];
        if (hero.xp >= xpNeeded && hero.level < XP_TABLE.length) {
            hero.level++;
            hero.maxHp += 20;
            hero.hp = Math.min(hero.maxHp, hero.hp + 30);
            hero.attack += 4;
            hero.speed = Math.min(220, hero.speed + 4);
            addFloat(state.hero.x, state.hero.y - 32, 'LEVEL UP! ' + hero.level, '#ffd700', 18);
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
                state.relics++;
                state.score += 30;
                addFloat(item.x, item.y, 'Relic! +30', '#ffd76b', 14);
                showNotif('Ancient Relic collected! (' + state.relics + ' total)');

            } else if (def.type === 'weapon') {
                var oldWpn = state.hero.weapon;
                var oldBonus = oldWpn ? (ITEM_DEFS[oldWpn].attackBonus || 0) : 0;
                var newBonus = def.attackBonus || 0;
                if (newBonus > oldBonus) {
                    state.hero.weapon = item.type;
                    addFloat(item.x, item.y, def.name + '!', '#66aaff', 14);
                    showNotif('Equipped: ' + def.name + ' (ATK +' + newBonus + ', Range +' + (def.range || 0) + ')');
                } else {
                    state.score += 8;
                    addFloat(item.x, item.y, def.name, '#9999cc', 12);
                    showNotif('Found ' + def.name + ' (already have better weapon)');
                }

            } else if (def.type === 'armor') {
                var oldAmr = state.hero.armor;
                var oldDef = oldAmr ? (ITEM_DEFS[oldAmr].defenseBonus || 0) : 0;
                var newDef = def.defenseBonus || 0;
                if (newDef > oldDef) {
                    state.hero.armor = item.type;
                    addFloat(item.x, item.y, def.name + '!', '#ffaa33', 14);
                    showNotif('Equipped: ' + def.name + ' (DEF +' + newDef + '%)');
                } else {
                    state.score += 8;
                    addFloat(item.x, item.y, def.name, '#cc9944', 12);
                    showNotif('Found ' + def.name + ' (already have better armor)');
                }

            } else if (def.type === 'heal') {
                var beforeHp = state.hero.hp;
                state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + def.heal);
                var healed = Math.round(state.hero.hp - beforeHp);
                addFloat(item.x, item.y, '+' + healed + ' HP', '#2ecc71', 14);
                showNotif(def.name + ': restored ' + healed + ' HP');
            }

            persist();
            return false;
        });
    }

    // ====================================================================
    // MOVEMENT
    // ====================================================================

    function moveHero(dt) {
        if (transitioning) { return; }
        var vx = 0, vy = 0;
        if (keys.ArrowLeft || keys.a || keys.A) { vx -= 1; }
        if (keys.ArrowRight || keys.d || keys.D) { vx += 1; }
        if (keys.ArrowUp || keys.w || keys.W) { vy -= 1; }
        if (keys.ArrowDown || keys.s || keys.S) { vy += 1; }

        if (vx !== 0 || vy !== 0) {
            mouseTarget = null;
            var len = Math.sqrt(vx * vx + vy * vy) || 1;
            state.hero.x += (vx / len) * state.hero.speed * dt;
            state.hero.y += (vy / len) * state.hero.speed * dt;
        } else if (mouseTarget) {
            var dx = mouseTarget.x - state.hero.x;
            var dy = mouseTarget.y - state.hero.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < 3) { mouseTarget = null; }
            else {
                state.hero.x += (dx / d) * state.hero.speed * dt;
                state.hero.y += (dy / d) * state.hero.speed * dt;
            }
        }

        // Edge transition zones (10px border)
        var edgePad = 10;
        if (state.hero.x < edgePad) {
            doAreaTransition(state.areaIndex - 1);
        } else if (state.hero.x > CANVAS_W - edgePad) {
            doAreaTransition(state.areaIndex + 1);
        } else if (state.hero.y < edgePad) {
            doAreaTransition(state.areaIndex + 1);
        } else if (state.hero.y > CANVAS_H - edgePad) {
            doAreaTransition(state.areaIndex - 1);
        }

        // Clamp inside canvas
        state.hero.x = clamp(state.hero.x, state.hero.radius, CANVAS_W - state.hero.radius);
        state.hero.y = clamp(state.hero.y, state.hero.radius, CANVAS_H - state.hero.radius);
    }

    function moveEnemies(dt) {
        var hero = state.hero;
        var area = AREAS[state.areaIndex];

        state.enemies.forEach(function (enemy) {
            var def = ENEMY_DEFS[enemy.type];
            enemy.wobble += dt;
            enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

            // Move toward hero with wobble offset
            var angle = Math.atan2(hero.y - enemy.y, hero.x - enemy.x) +
                Math.sin(enemy.wobble * 1.8) * 0.45;
            enemy.x += Math.cos(angle) * def.speed * dt;
            enemy.y += Math.sin(angle) * def.speed * dt;
            enemy.x = clamp(enemy.x, def.size, CANVAS_W - def.size);
            enemy.y = clamp(enemy.y, def.size, CANVAS_H - def.size);

            // Enemy contact attack
            if (dist2(hero, enemy) < hero.radius + def.size + 2 &&
                enemy.attackCooldown <= 0) {
                var rawDmg = def.attack * area.difficulty;
                var reduction = getHeroDefense() / 100;
                var dmg = Math.max(1, rawDmg * (1 - reduction) * dt * 2.8);
                hero.hp -= dmg;
                hero.hitFlash = 0.22;
                enemy.attackCooldown = 0.7;

                if (hero.hp <= 0) {
                    hero.hp = 0;
                    paused = true;
                    if (elPauseBtn) { elPauseBtn.textContent = 'Resume'; }
                    setStatus('paused', 'Defeated!');
                    if (elHint) {
                        elHint.textContent = 'You were defeated! Press New Game or N to try again.';
                    }
                    showNotif('Defeated by ' + ENEMY_DEFS[enemy.type].name + '!');
                }
            }
        });

        // Respawn enemies to maintain minimum count
        var minCount = area.enemyCount;
        if (state.enemies.length < minCount && (state.tick % 150 === 0)) {
            var typeName = area.enemyTypes[rndInt(0, area.enemyTypes.length - 1)];
            var def2 = ENEMY_DEFS[typeName];
            var scaledHp = Math.round(def2.maxHp * (1 + (area.difficulty - 1) * 0.35));
            var ex, ey, att = 0;
            do {
                ex = rnd(50, CANVAS_W - 50);
                ey = rnd(50, CANVAS_H - 50);
                att++;
            } while (dist2({ x: ex, y: ey }, hero) < 200 && att < 25);
            state.enemies.push({
                type: typeName,
                x: ex, y: ey,
                hp: scaledHp, maxHp: scaledHp,
                wobble: rnd(0, Math.PI * 2),
                attackCooldown: 1.2,
                hitFlash: 0
            });
        }
    }

    // ====================================================================
    // RENDERING
    // ====================================================================

    function drawBackground() {
        var area = AREAS[state.areaIndex];
        // Fill background
        ctx.fillStyle = area.bgColor;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Grid dots pattern
        ctx.fillStyle = area.gridColor;
        for (var gx = 0; gx < CANVAS_W; gx += 48) {
            for (var gy = 0; gy < CANVAS_H; gy += 48) {
                ctx.fillRect(gx + ((gx + gy) % 14), gy + ((gx + gy) % 11), 3, 3);
            }
        }

        // Edge border glow indicating transition zones
        var bc = area.borderColor;
        ctx.strokeStyle = bc;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);

        // Directional arrows at edges
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', CANVAS_W - 16, CANVAS_H / 2);
        ctx.fillText('◀', 16, CANVAS_H / 2);
        ctx.fillText('▲', CANVAS_W / 2, 16);
        ctx.fillText('▼', CANVAS_W / 2, CANVAS_H - 16);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    function drawStar(cx, cy, spikes, outerR, innerR) {
        var rot = -Math.PI / 2;
        var step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        for (var i = 0; i < spikes; i++) {
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        }
        ctx.closePath();
    }

    function drawItems() {
        state.items.forEach(function (item) {
            var def = ITEM_DEFS[item.type];
            if (!def) { return; }

            ctx.save();
            ctx.translate(item.x, item.y);

            if (def.type === 'relic') {
                // Glowing star
                ctx.fillStyle = def.color;
                drawStar(0, 0, 5, 11, 5);
                ctx.fill();
                ctx.strokeStyle = def.subColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();

            } else if (def.type === 'weapon') {
                // Sword icon
                ctx.fillStyle = def.color;
                ctx.fillRect(-2.5, -11, 5, 15);       // blade
                ctx.fillStyle = def.subColor;
                ctx.fillRect(-7, -1, 14, 3.5);         // crossguard
                ctx.fillRect(-2, 4, 4, 6);             // grip

            } else if (def.type === 'armor') {
                // Shield icon
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.moveTo(0, -11);
                ctx.lineTo(9, -5);
                ctx.lineTo(9, 3);
                ctx.lineTo(0, 11);
                ctx.lineTo(-9, 3);
                ctx.lineTo(-9, -5);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = def.subColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Cross detail
                ctx.strokeStyle = def.subColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -7); ctx.lineTo(0, 7);
                ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
                ctx.stroke();

            } else if (def.type === 'heal') {
                // Flask / potion
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.arc(0, 4, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = def.subColor;
                ctx.fillRect(-2.5, -8, 5, 8);
                ctx.fillRect(-4, -10, 8, 3);
                // Shine
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(-2, 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    function drawEnemy(enemy) {
        var def = ENEMY_DEFS[enemy.type];
        var s = def.size;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Hit flash: tint red
        if (enemy.hitFlash > 0) {
            ctx.globalAlpha = 0.45 + 0.55 * (1 - enemy.hitFlash / 0.3);
        }

        switch (enemy.type) {
            case 'rat':
                ctx.fillStyle = def.color;
                ctx.save();
                ctx.scale(1.2, 0.75);
                ctx.beginPath();
                ctx.arc(0, 0, s, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Tail
                ctx.strokeStyle = '#5a2808';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s * 0.9, 2);
                ctx.bezierCurveTo(s + 6, -3, s + 11, 5, s + 9, 8);
                ctx.stroke();
                // Ears
                ctx.fillStyle = '#cc7755';
                ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.7, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.7, 3, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#ff0000';
                ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.1, 1.8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.1, 1.8, 0, Math.PI * 2); ctx.fill();
                break;

            case 'goblin':
                ctx.fillStyle = def.color;
                ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
                // Pointy ears
                ctx.beginPath();
                ctx.moveTo(-s + 1, -s * 0.3); ctx.lineTo(-s - 5, -s); ctx.lineTo(-s + 4, -s * 0.5);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(s - 1, -s * 0.3); ctx.lineTo(s + 5, -s); ctx.lineTo(s - 4, -s * 0.5);
                ctx.closePath(); ctx.fill();
                // Eyes
                ctx.fillStyle = '#ffee00';
                ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.15, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.15, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.15, 1, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.15, 1, 0, Math.PI * 2); ctx.fill();
                // Mouth
                ctx.strokeStyle = '#1a5a08';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(0, s * 0.3, s * 0.35, 0.2, Math.PI - 0.2); ctx.stroke();
                break;

            case 'bat':
                ctx.fillStyle = def.color;
                // Left wing
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(-s * 2.2, -s * 1.1, -s * 2.8, s * 0.5, -s * 1.1, s * 0.4);
                ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
                // Right wing
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(s * 2.2, -s * 1.1, s * 2.8, s * 0.5, s * 1.1, s * 0.4);
                ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
                // Body
                ctx.fillStyle = '#6a2a8a';
                ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#ff4444';
                ctx.beginPath(); ctx.arc(-2.5, -1, 1.8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(2.5, -1, 1.8, 0, Math.PI * 2); ctx.fill();
                break;

            case 'skeleton':
            case 'skeleton2':
                ctx.fillStyle = def.color;
                // Head
                ctx.beginPath(); ctx.arc(0, -s * 0.55, s * 0.52, 0, Math.PI * 2); ctx.fill();
                // Body
                ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.95);
                // Ribs
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1.2;
                for (var ri = 0; ri < 3; ri++) {
                    ctx.beginPath();
                    ctx.moveTo(-s * 0.28, -s * 0.05 + ri * s * 0.28);
                    ctx.lineTo(s * 0.28, -s * 0.05 + ri * s * 0.28);
                    ctx.stroke();
                }
                // Eye sockets
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.6, s * 0.14, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.6, s * 0.14, 0, Math.PI * 2); ctx.fill();
                // Nose hole
                ctx.beginPath(); ctx.arc(0, -s * 0.46, s * 0.07, 0, Math.PI * 2); ctx.fill();
                break;

            case 'ogre':
                ctx.fillStyle = def.color;
                ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#cc4400';
                ctx.beginPath(); ctx.arc(-s * 0.32, -s * 0.22, s * 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.32, -s * 0.22, s * 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-s * 0.32, -s * 0.22, s * 0.08, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.32, -s * 0.22, s * 0.08, 0, Math.PI * 2); ctx.fill();
                // Club
                ctx.fillStyle = '#3a2208';
                ctx.fillRect(s * 0.75, -s, s * 0.35, s * 1.3);
                ctx.beginPath(); ctx.arc(s * 0.92, -s * 1.0, s * 0.32, 0, Math.PI * 2); ctx.fill();
                // Tusk
                ctx.fillStyle = '#f0e8c0';
                ctx.beginPath();
                ctx.moveTo(-s * 0.2, s * 0.35); ctx.lineTo(-s * 0.1, s * 0.7); ctx.lineTo(0, s * 0.38);
                ctx.closePath(); ctx.fill();
                break;

            case 'eye':
                // Outer glow ring
                ctx.fillStyle = '#550000';
                ctx.beginPath(); ctx.arc(0, 0, s * 1.15, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#aa1111';
                ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#dd2222';
                ctx.beginPath(); ctx.arc(0, 0, s * 0.65, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff4444';
                ctx.beginPath(); ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2); ctx.fill();
                // Tentacles
                ctx.strokeStyle = '#881111';
                ctx.lineWidth = 2;
                for (var ti = 0; ti < 6; ti++) {
                    var ta = (ti / 6) * Math.PI * 2 + enemy.wobble * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(ta) * s, Math.sin(ta) * s);
                    ctx.lineTo(Math.cos(ta) * s * 1.8, Math.sin(ta) * s * 1.8);
                    ctx.stroke();
                }
                break;

            case 'boss':
                // Wings
                ctx.fillStyle = '#3a0000';
                ctx.beginPath();
                ctx.moveTo(-s * 0.8, -s * 0.3);
                ctx.lineTo(-s * 2.8, -s * 2.2);
                ctx.lineTo(-s * 1.6, -s * 0.1);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(s * 0.8, -s * 0.3);
                ctx.lineTo(s * 2.8, -s * 2.2);
                ctx.lineTo(s * 1.6, -s * 0.1);
                ctx.closePath(); ctx.fill();
                // Body
                ctx.fillStyle = def.color;
                ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
                // Scales texture
                ctx.strokeStyle = '#5a0000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); ctx.stroke();
                // Eyes
                ctx.fillStyle = '#ff8800';
                ctx.beginPath(); ctx.arc(-s * 0.38, -s * 0.22, s * 0.22, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.22, s * 0.22, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-s * 0.38, -s * 0.22, s * 0.1, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.22, s * 0.1, 0, Math.PI * 2); ctx.fill();
                // Horn
                ctx.fillStyle = '#c0a040';
                ctx.beginPath();
                ctx.moveTo(-s * 0.15, -s); ctx.lineTo(0, -s * 1.55); ctx.lineTo(s * 0.15, -s);
                ctx.closePath(); ctx.fill();
                break;

            default:
                ctx.fillStyle = def.color;
                ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();

        // HP bar
        var barW = def.size * 2.6;
        var barH = 4;
        var barX = enemy.x - barW / 2;
        var barY = enemy.y - def.size - 9;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        var ratio = enemy.hp / enemy.maxHp;
        ctx.fillStyle = ratio > 0.6 ? '#4cbb6c' : ratio > 0.3 ? '#f0a020' : '#e03030';
        ctx.fillRect(barX, barY, barW * ratio, barH);
    }

    function drawEnemies() {
        state.enemies.forEach(drawEnemy);
    }

    function drawHero() {
        var h = state.hero;
        var s = h.radius;

        ctx.save();
        ctx.translate(h.x, h.y);

        // Hit flash
        if (h.hitFlash > 0) {
            ctx.globalAlpha = 0.5 + 0.5 * (1 - h.hitFlash / 0.22);
            h.hitFlash = Math.max(0, h.hitFlash - 0.016); // rough decay
        }

        // Body / outfit (color by armor)
        var bodyColor = '#2a5a9a';
        if (h.armor) {
            bodyColor = ITEM_DEFS[h.armor] ? ITEM_DEFS[h.armor].color : bodyColor;
        }
        ctx.fillStyle = bodyColor;
        ctx.beginPath(); ctx.arc(0, s * 0.2, s * 0.82, 0, Math.PI * 2); ctx.fill();

        // Head
        ctx.fillStyle = '#f0c090';
        ctx.beginPath(); ctx.arc(0, -s * 0.45, s * 0.58, 0, Math.PI * 2); ctx.fill();

        // Hair
        ctx.fillStyle = '#553311';
        ctx.beginPath(); ctx.arc(0, -s * 0.72, s * 0.5, Math.PI, Math.PI * 2); ctx.fill();

        // Cape/cloak bottom
        ctx.fillStyle = h.armor ? (ITEM_DEFS[h.armor] ? ITEM_DEFS[h.armor].subColor : '#1a3a6a') : '#1a3a6a';
        ctx.beginPath();
        ctx.moveTo(-s * 0.72, s * 0.1);
        ctx.lineTo(-s * 0.6, s * 1.25);
        ctx.lineTo(s * 0.6, s * 1.25);
        ctx.lineTo(s * 0.72, s * 0.1);
        ctx.closePath();
        ctx.fill();

        // Weapon in right hand
        if (h.weapon && ITEM_DEFS[h.weapon]) {
            var wDef = ITEM_DEFS[h.weapon];
            ctx.save();
            ctx.translate(s * 0.85, s * 0.1);
            ctx.rotate(-0.45);
            ctx.fillStyle = wDef.color;
            ctx.fillRect(-2, -s * 1.1, 4, s * 1.1);   // blade
            ctx.fillStyle = wDef.subColor;
            ctx.fillRect(-5, -s * 1.1, 10, 3);          // guard
            ctx.fillStyle = '#8b6914';
            ctx.fillRect(-1.5, -s * 0.05, 3, s * 0.6); // grip
            ctx.restore();
        } else {
            // Fist
            ctx.fillStyle = '#f0c090';
            ctx.beginPath(); ctx.arc(s * 0.82, s * 0.18, 3.5, 0, Math.PI * 2); ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();

        // Attack range indicator (subtle ring, only while cooldown active)
        if (h.attackCooldown > 0.05) {
            var progress = 1 - h.attackCooldown / 0.38;
            ctx.strokeStyle = 'rgba(255,255,200,' + (0.12 * (1 - progress)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(h.x, h.y, getAttackRange(), 0, Math.PI * 2);
            ctx.stroke();
        }

        // HP bar above hero
        var hpBarW = 32;
        var hpBarH = 4;
        var hpRatio = h.hp / h.maxHp;
        var hpX = h.x - hpBarW / 2;
        var hpY = h.y - s - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(hpX - 1, hpY - 1, hpBarW + 2, hpBarH + 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
        ctx.fillStyle = hpRatio > 0.6 ? '#4cbb6c' : hpRatio > 0.3 ? '#f0a020' : '#e03030';
        ctx.fillRect(hpX, hpY, hpBarW * hpRatio, hpBarH);
    }

    function drawFloatTexts(dt) {
        floatTexts = floatTexts.filter(function (ft) {
            ft.age += dt;
            ft.y += ft.vy * dt;
            if (ft.age >= ft.life) { return false; }
            var alpha = 1 - (ft.age / ft.life);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold ' + ft.size + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1;
            return true;
        });
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    function drawHitFlashes(dt) {
        hitFlashes = hitFlashes.filter(function (hf) {
            hf.age += dt;
            if (hf.age >= hf.life) { return false; }
            var alpha = 0.55 * (1 - hf.age / hf.life);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff5555';
            ctx.beginPath(); ctx.arc(hf.x, hf.y, hf.r * 1.6, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            return true;
        });
    }

    function drawTransitionOverlay() {
        if (!transitioning) { return; }
        var elapsed = 1.8 - transitionTimer;
        var alpha = Math.min(0.88, elapsed * 1.2);
        ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(transitionMsg, CANVAS_W / 2, CANVAS_H / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    function drawPauseOverlay() {
        if (!paused) { return; }
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸ PAUSED', CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillStyle = '#dddddd';
        ctx.font = '20px Arial';
        ctx.fillText('Press P or click Resume to continue', CANVAS_W / 2, CANVAS_H / 2 + 50);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    function drawScene(dt) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawBackground();
        drawItems();
        drawHitFlashes(dt);
        drawEnemies();
        drawHero();
        drawFloatTexts(dt);
        drawTransitionOverlay();
        drawPauseOverlay();
    }

    // ====================================================================
    // HUD UPDATE
    // ====================================================================

    function updateHUD() {
        var h = state.hero;
        var area = AREAS[state.areaIndex] || AREAS[0];
        var lvlIdx = Math.min(h.level, XP_TABLE.length - 1);

        if (elHealth) { elHealth.textContent = Math.max(0, Math.round(h.hp)) + ' / ' + h.maxHp; }
        if (elScore) { elScore.textContent = state.score; }
        if (elRelics) { elRelics.textContent = state.relics; }
        if (elLevel) { elLevel.textContent = h.level; }
        if (elXp) { elXp.textContent = h.xp + ' / ' + XP_TABLE[lvlIdx]; }
        if (elArea) { elArea.textContent = area.name; }
        if (elWeapon) { elWeapon.textContent = h.weapon ? (ITEM_DEFS[h.weapon] ? ITEM_DEFS[h.weapon].name : h.weapon) : 'None'; }
        if (elArmor) { elArmor.textContent = h.armor ? (ITEM_DEFS[h.armor] ? ITEM_DEFS[h.armor].name : h.armor) : 'None'; }
        if (elKills) { elKills.textContent = state.totalKills; }
        if (elAtk) { elAtk.textContent = getHeroAttack(); }
        if (elDef) { elDef.textContent = getHeroDefense() + '%'; }
    }

    // ====================================================================
    // GAME LOOP
    // ====================================================================

    function gameTick(ts) {
        try {
            if (!lastTick) { lastTick = ts; }
            var dt = Math.min(0.05, (ts - lastTick) / 1000);
            lastTick = ts;

            if (!paused && !transitioning) {
                state.hero.attackCooldown = Math.max(0, state.hero.attackCooldown - dt);
                moveHero(dt);
                moveEnemies(dt);
                collectItems();
                if (state.tick % 300 === 0) { persist(); }
                state.tick++;
            }

            if (transitioning) {
                transitionTimer = Math.max(0, transitionTimer - dt);
            }

            // Notification tick
            if (notifTimer > 0) {
                notifTimer -= dt;
                if (notifTimer <= 0) { showNextNotif(); }
            }

            drawScene(dt);
            updateHUD();

            animFrame = requestAnimationFrame(gameTick);
        } catch (err) {
            console.error('gameTick error', err);
            setStatus('error', 'Error — see console');
        }
    }

    // ====================================================================
    // GAME CONTROL
    // ====================================================================

    function newGame() {
        // Cancel any running loop before starting fresh
        if (animFrame !== null) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }

        state = makeBaseState();
        paused = false;
        mouseTarget = null;
        transitioning = false;
        transitionTimer = 0;
        floatTexts = [];
        hitFlashes = [];
        notifQueue = [];
        notifTimer = 0;
        lastTick = 0;

        populateArea();
        persist();
        setStatus('playing', 'New Adventure!');
        if (elHint) { elHint.textContent = 'Explore the map! Reach the edges to travel to new areas.'; }
        if (elPauseBtn) { elPauseBtn.textContent = 'Pause'; }
        if (elNotif) { elNotif.textContent = ''; }
        updateHUD();

        animFrame = requestAnimationFrame(gameTick);
    }

    function togglePause() {
        paused = !paused;
        setStatus(paused ? 'paused' : 'playing', paused ? 'Paused' : 'Playing');
        if (elPauseBtn) { elPauseBtn.textContent = paused ? 'Resume' : 'Pause'; }
    }

    // ====================================================================
    // INITIALIZATION
    // ====================================================================

    function init() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) { return; }
        ctx = canvas.getContext('2d');

        // DOM refs
        elStatus = document.getElementById('statusText');
        elHealth = document.getElementById('healthValue');
        elScore = document.getElementById('scoreValue');
        elRelics = document.getElementById('relicValue');
        elLevel = document.getElementById('levelValue');
        elXp = document.getElementById('xpValue');
        elArea = document.getElementById('areaValue');
        elWeapon = document.getElementById('weaponValue');
        elArmor = document.getElementById('armorValue');
        elKills = document.getElementById('killsValue');
        elAtk = document.getElementById('attackValue');
        elDef = document.getElementById('defenseValue');
        elNotif = document.getElementById('notifText');
        elPauseBtn = document.getElementById('pauseBtn');
        elHint = document.getElementById('gameHint');

        var themeToggle = document.getElementById('themeToggle');
        var saveDataEl = document.getElementById('saveData');

        // Keyboard
        window.addEventListener('keydown', function (evt) {
            keys[evt.key] = true;
            if (evt.key === ' ' || evt.key === 'Enter') {
                evt.preventDefault();
                if (!paused && !transitioning) { tryAttack(); }
            } else if (evt.key === 'p' || evt.key === 'P') {
                if (!transitioning) { togglePause(); }
            } else if (evt.key === 'n' || evt.key === 'N') {
                newGame();
            }
        });
        window.addEventListener('keyup', function (evt) {
            keys[evt.key] = false;
        });

        // Mouse click on canvas
        canvas.addEventListener('click', function (evt) {
            if (paused || transitioning) { return; }
            var rect = canvas.getBoundingClientRect();
            mouseTarget = {
                x: (evt.clientX - rect.left) * (CANVAS_W / rect.width),
                y: (evt.clientY - rect.top) * (CANVAS_H / rect.height)
            };
        });

        // Touch
        canvas.addEventListener('touchstart', function (evt) {
            if (!evt.touches || !evt.touches.length) { return; }
            if (paused || transitioning) { return; }
            var rect = canvas.getBoundingClientRect();
            var t = evt.touches[0];
            mouseTarget = {
                x: (t.clientX - rect.left) * (CANVAS_W / rect.width),
                y: (t.clientY - rect.top) * (CANVAS_H / rect.height)
            };
        }, { passive: true });

        // Buttons
        var newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) { newGameBtn.addEventListener('click', newGame); }

        if (elPauseBtn) {
            elPauseBtn.addEventListener('click', function () {
                if (!transitioning) { togglePause(); }
            });
        }

        var attackBtn = document.getElementById('attackBtn');
        if (attackBtn) {
            attackBtn.addEventListener('click', function () {
                if (!paused && !transitioning) { tryAttack(); }
            });
        }

        var saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                persist();
                setStatus(paused ? 'paused' : 'playing', 'Saved!');
            });
        }

        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                persist();
                var raw = '';
                try { raw = localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { /* ignored */ }
                if (saveDataEl) {
                    saveDataEl.value = raw;
                    saveDataEl.focus();
                    saveDataEl.select();
                }
                setStatus(paused ? 'paused' : 'playing', 'Exported!');
            });
        }

        var importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', function () {
                if (!saveDataEl) { return; }
                try {
                    var parsed = JSON.parse(saveDataEl.value);
                    if (!parsed || parsed.version !== 2 || !parsed.hero) {
                        throw new Error('Invalid save data (wrong version or missing hero)');
                    }
                    // Cancel loop, apply save, restart
                    if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null; }
                    state = parsed;
                    if (!Array.isArray(state.enemies)) { state.enemies = []; }
                    if (!Array.isArray(state.items)) { state.items = []; }
                    if (!Array.isArray(state.areasVisited)) { state.areasVisited = [0]; }
                    paused = false;
                    mouseTarget = null;
                    transitioning = false;
                    floatTexts = [];
                    hitFlashes = [];
                    lastTick = 0;
                    persist();
                    setStatus('playing', 'Save imported!');
                    if (elPauseBtn) { elPauseBtn.textContent = 'Pause'; }
                    updateHUD();
                    animFrame = requestAnimationFrame(gameTick);
                } catch (err) {
                    setStatus('error', 'Import failed: ' + err.message);
                }
            });
        }

        var resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (!window.confirm('Reset all progress and start a brand new game?')) { return; }
                try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignored */ }
                newGame();
            });
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                var next = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                document.body.setAttribute('data-theme', next);
                themeToggle.setAttribute('aria-pressed', String(next === 'light'));
                themeToggle.textContent = next === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';
                persist();
            });
        }

        window.addEventListener('beforeunload', persist);

        // Load or fresh state, then start loop
        loadSave();
        updateHUD();
        setStatus('playing', 'Ready — Press New Game or start moving!');
        animFrame = requestAnimationFrame(gameTick);
    }

    // Run after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());
