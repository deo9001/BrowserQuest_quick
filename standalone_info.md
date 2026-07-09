# BrowserQuest Standalone Mode — Architecture & Documentation

## Quick Start

1. Download the repository ZIP and extract it (or clone).
2. Keep the folder structure intact.
3. Open **`standalone.html`** in any modern browser.

No terminal, Node.js, npm, or admin rights needed for standalone mode.

---

## v2 Architecture (Current)

Standalone mode was refactored from a single 709-line HTML file into three co-located files:

| File | Purpose |
|---|---|
| `standalone.html` | HTML entry point — canvas, HUD elements, About/Help section |
| `standalone.css` | All CSS — full-width game layout, About section below game, HUD grid |
| `standalone.js` | Complete game engine — IIFE module, no external dependencies |

### Why three files?

The single-file approach limited growth. Separate files allow independent editing of layout,
style, and logic; easier code review; and clear scope for future features.

---

## What The Standalone App Is

A canvas-based single-player RPG adventure inspired by Mozilla BrowserQuest.
It uses only browser APIs (Canvas 2D, localStorage, DOM events) — no CDN, no server,
no internet required. Rendering is fully shape-based, so it works everywhere without
needing the sprite sheets.

---

## Current Core Loop

1. **Explore** — Move hero around a 1100×620 canvas map.
2. **Combat** — Press Space/Enter or the Attack button to deal damage to nearby enemies.
   Enemies chase the hero and deal damage on contact.
3. **Collect** — Walk over dropped items and relics to pick them up automatically.
4. **Progress** — Killing enemies earns XP → levels up stats.
   Better equipment (weapons and armor) drops from enemies and the environment.
5. **Travel** — Reach any edge of the map to enter the next area.
6. **Repeat** — Four looping areas of increasing difficulty.

---

## Content & Feature Inventory

| Section | Purpose | Snippet | Explanation |
|---|---|---|---|
| AREAS array | Defines the 4 map areas | `{ name: 'Forest Clearing', enemyTypes: ['rat','goblin'], difficulty: 1.0 }` | Each area has a theme, background color, enemy mix, and difficulty multiplier |
| ENEMY_DEFS | Enemy stats and drop tables | `goblin: { maxHp:6, attack:12, speed:52, xp:12, items:['flask','sword1'] }` | Each type has distinct HP, speed, attack, XP reward, and item drop table |
| ITEM_DEFS | All collectible items | `sword1: { type:'weapon', attackBonus:15, range:10 }` | Weapons boost ATK + range; armor reduces damage %; consumables restore HP |
| XP_TABLE | Level thresholds | `[0,50,120,220,350,520,730,990,1310,1700]` | 10 levels; each awards +4 ATK, +20 max HP, +4 speed |
| drawEnemy() | Per-type canvas shape rendering | `case 'skeleton': ctx.arc(head)… ctx.fillRect(body)…` | Each enemy type has a unique shape so they're visually distinct |
| drawHero() | Hero rendering with equipment | `if(h.weapon) draw sword with weapon color` | Body color reflects armor; sword drawn when weapon equipped |
| tryAttack() | Player attack with range/cooldown | `dmg = atk * (0.85 + Math.random()*0.3)` | Damage randomized ±15%; 0.38s cooldown; drops item on kill |
| doAreaTransition() | Fade + area change | `transitioning=true; setTimeout(populateArea, 900)` | 0.9s fade, then new area enemies/items spawn; hero placed center |
| collectItems() | Radius-based pickup | `if(dist(hero,item) < hero.radius+item.radius+5)` | Auto-equip better weapon/armor; apply heal; track relic count |
| persist() | localStorage auto-save | `localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize()))` | Saves every 300 ticks (~5s) and on beforeunload |
| newGame() | Clean restart | `cancelAnimationFrame(animFrame); state=makeBaseState()` | Cancels old RAF loop before starting fresh — prevents duplicate loops |
| floatTexts | Floating damage/XP numbers | `addFloat(x, y, '-15', '#ff5555', 13)` | Timed text that drifts upward and fades out |

---

## Balancing Notes

| Parameter | Value | Rationale |
|---|---|---|
| Base hero ATK | 18 | Enough to kill rats in 1-2 hits without any weapon |
| Attack cooldown | 0.38s | Prevents spam, rewards positioning |
| Enemy respawn | Every 150 ticks (~2.5s) if count < area minimum | Keeps pressure without overwhelming |
| Defense cap | 80% | Golden Armor at 50% still allows damage; prevents invincibility |
| Area difficulty multiplier | 1.0–3.0 | Dragon's Lair enemies deal 3× base damage before defense |
| XP curve | Quadratic (50→1700) | Early levels fast, later levels require multiple area clears |
| Weapon upgrade (Iron→Blue→Golden) | +15/+30/+50 ATK | Clear power jumps to reward exploration |
| Item drop chance | 0.15–0.85 | Boss drops very reliably; rats rarely drop anything |

---

## Troubleshooting Matrix

| Issue | Cause | Fix |
|---|---|---|
| Save fails / not restoring | localStorage blocked by browser | Allow local storage for the file; game still runs without it |
| Duplicate player rendering (v1 bug) | v1 drew sprite sheets without frame clipping, producing overlaid frames | v2 uses shape rendering — this issue is gone |
| Invisible enemies (v1 bug) | v1 sprite sheet squished into 24×24 pixels looked like a dot | v2 uses per-type canvas shapes — enemies are always visible |
| Impossible quest / never-ending area | Was not a quest system in v1; v2 has no mandatory quest objective | Collect relics for score; kill enemies for XP/drops; areas loop |
| Item effects not applying | HUD may not refresh instantly | HUD updates every frame. Check Weapon/Armor values in stat grid |
| Area transition failing | Rapid edge-crossing before transition finishes | `transitioning` flag blocks re-entry for 1.8s — wait for fade to complete |
| Duplicate loops on restart | v1 did not cancel RAF before restarting | v2 calls `cancelAnimationFrame(animFrame)` in `newGame()` and `importBtn` handler |
| Performance drops | Too many floatTexts/hitFlashes accumulated | Both arrays are filtered each frame and short-lived (life 0.28–1.6s) |

---

## Extension Guide

### Add a new enemy type

1. Add an entry to `ENEMY_DEFS` in `standalone.js`:
   ```js
   spider: { name:'Spider', color:'#4a4a00', size:10, maxHp:7, attack:14, speed:75, xp:14, itemChance:0.2, items:['flask'] }
   ```
2. Add a `case 'spider':` block inside `drawEnemy()` with canvas shapes.
3. Add `'spider'` to the `enemyTypes` array of any area in `AREAS`.

### Add a new weapon

1. Add to `ITEM_DEFS`:
   ```js
   redsword: { name:'Red Sword', type:'weapon', color:'#e03030', subColor:'#8b0000', attackBonus:40, range:18 }
   ```
2. Add `'redsword'` to relevant enemy drop tables in `ENEMY_DEFS[x].items`.
3. The `collectItems()` auto-equip logic handles it automatically.

### Add a new armor

Same as weapon but use `type:'armor'` and `defenseBonus` instead of `attackBonus`.

### Add a new quest/objective

1. Add a field to `makeBaseState()` (e.g., `questKills: 0`).
2. Increment in `tryAttack()` when an enemy is killed.
3. Check completion in `moveEnemies()` or `gameTick()`.
4. Show notification with `showNotif()`.

### Add a new area/map

1. Push a new entry to `AREAS` with a unique `id`, `name`, `bgColor`, `gridColor`, `borderColor`, `enemyTypes`, `enemyCount`, and `difficulty`.
2. Reference enemy types that already exist in `ENEMY_DEFS`, or add new ones.
3. Area transitions are circular — the new area will be reachable automatically.

### Adjust balance

- Change `difficulty` in an area entry to scale enemy HP and attack.
- Change `attackBonus`/`defenseBonus` in `ITEM_DEFS` for equipment tuning.
- Edit `XP_TABLE` values to slow or speed up leveling.
- Change `itemChance` per enemy to adjust drop rates.

---

## Lessons Learned / Known Limitations

- **Sprite sheets without frame metadata** — Drawing a multi-frame sprite sheet with `drawImage(img, x, y, 24, 24)` compresses all frames into one tile, creating the "duplicate player" appearance reported in v1. Shape rendering avoids this entirely.
- **Single-file size limit** — A 709-line file is already hard to maintain; splitting into HTML/CSS/JS was necessary to allow the game to grow.
- **Defense is percentage-based** — This means low-level heroes with good armor can be overpowered in early areas. Capping at 80% prevents full immunity.
- **No persistent XP across save schema versions** — Save version 2 only restores v2 saves. Importing a v1 save requires starting fresh.
- **No map tiles** — Canvas shape rendering produces a simple grid background. Future improvement: use 2D tile maps or predrawn canvas images.
- **Multiplayer not possible** — Standalone mode is intentionally single-player. See `README.md` for the full Node.js multiplayer server setup.

---

## Full App vs Standalone

| Feature | Standalone Mode | Full App |
|---|---|---|
| Setup | Open `standalone.html` | Node.js + npm install + `node server/js/main.js` |
| Multiplayer | No | Yes (Socket.IO) |
| Chat / shared world | No | Yes |
| Persistence | localStorage | Server-side |
| Internet required | No | Install step only |
| Entry point | `standalone.html` | `http://127.0.0.1:8000/client/index.html` |

---

## Files Changed in v2 Refactor

| File | Change |
|---|---|
| `standalone.html` | Rewritten: full-width layout, About section below game, canvas 1100×620, HUD grid, notification bar, links to CSS/JS |
| `standalone.css` | New: all styles extracted and improved |
| `standalone.js` | New: complete game engine with 4 areas, 7 enemies, equipment, XP, combat feedback |
| `standalone_info.md` | Updated: architecture, troubleshooting matrix, extension guide |
