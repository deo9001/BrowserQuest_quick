# BrowserQuest Standalone — Systems Renovation Report (v3)

This document describes the game systems added or significantly renovated in **standalone.js v3**.
It serves as a developer reference for understanding, extending, and balancing the standalone game mode.

---

## 1. Area / Region Transition Model

### How it works
Areas are arranged in a logical world graph. Each area has a `neighbors` map:
```js
neighbors: { right: <areaId|null>, left: <areaId|null>, up: <areaId|null>, down: <areaId|null> }
```
`null` means a world boundary (no area in that direction).

### Transition threshold
`TRANSITION_THRESHOLD = 80` px from the canvas edge. When the player's position crosses this threshold
*and* a neighbor exists in that direction, `doAreaTransition(dir)` is called immediately — no waiting at
the pixel edge.

### Transition animation
A two-phase fade is used:
1. **Fade-out** (`FADE_OUT_DUR = 0.20 s`): screen fades to black.
2. **Apply midpoint**: hero is repositioned at the entry point of the new area, `populateArea()` runs.
3. **Fade-in** (`FADE_IN_DUR = 0.28 s`): new area fades in from black.

Total transition: ~500 ms. Controlled by the `trans` object:
```js
trans = { active, phase ('fadeout'|'fadein'|'none'), timer, dir, fromAreaId, toAreaId, msg }
```
A `transitionCooldown` (0.6 s) prevents re-triggering immediately after a transition completes.

### Neighbor preview strips
While the hero is near an edge (within `TRANSITION_THRESHOLD * 2.2` pixels), a semi-transparent strip of
the neighboring area's background color is drawn at that edge, with the area name shown. Alpha scales
with proximity, fading in smoothly as the player approaches.

### How to add a new region
1. Add an entry to the `AREAS` array with a unique `id`, `biome`, colors, `neighbors`, enemies, etc.
2. Add obstacle data in `AREA_OBSTACLES[id]`.
3. Set the `neighbors` of adjacent areas to point to the new id.
4. Add a layout entry in `MAP_LAYOUT` with `{ id, col, row }`.

---

## 2. World / Region Map Data Model

### AREAS array
Each area object has:

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique area index |
| `name` | string | Display name |
| `biome` | string | `'meadow'`, `'forest'`, `'town'`, `'cave'`, `'keep'`, `'lair'` |
| `bgColor` | CSS color | Base background fill color |
| `gridColor` | CSS rgba | Subtle grid dot color |
| `borderColor` | CSS rgba | Edge glow stroke color |
| `ambientLight` | 0–1 | 1 = fully lit; values < 1 apply a dark overlay (`opacity = (1-ambient)*0.70`) |
| `neighbors` | object | `{right, left, up, down}` — area id or `null` |
| `enemyTypes` | string[] | Enemy def keys that can spawn here |
| `enemyCount` | number | Base enemy count (scaled by hero level) |
| `difficulty` | number | Scales enemy HP and contact damage |
| `description` | string | Notification text shown on entry |

### Current world graph (v3)
```
[0] Sunlit Meadow ──right──► [1] Forest Clearing ──right──► [2] Ancient Town
        │                              │                              │
       down                           down                           down
        ▼                              ▼                              ▼
[3] Dark Caves             [4] Cursed Keep ──right──► [5] Shadow Fortress ──right──► [6] Dragon's Lair
        │                                                                                    ▲
       down                                                                                  │
        └───────────────────────────────────────────────────────────────────────────────────┘
                                                                                          (up: 3)
```
Connections summary:
- 0 (Meadow): right→1, down→3
- 1 (Forest): left→0, right→2, down→4
- 2 (Town): left→1, down→5
- 3 (Caves): up→0, down→6
- 4 (Keep): up→1, right→5
- 5 (Shadow Fortress): left→4, up→2, right→6
- 6 (Dragon's Lair): up→3, left→5

---

## 3. Terrain / Obstacle Definitions and Collision Rules

### AREA_OBSTACLES
Each entry is an array of obstacle objects at index matching the area id.

**Obstacle types:**

| `type` | Fields | Description |
|---|---|---|
| `'tree'` | `x, y, r` | Circle; drawn as canopy + trunk |
| `'water'` | `x, y, w, h` | Rectangle; drawn as coloured water with ripples |
| `'rect'` | `x, y, w, h` | Rectangle wall (brick pattern). In town/keep, large rects → buildings |
| `'circle'` | `x, y, r` | Rock/stalagmite — ellipse shape |

All four types are **solid** (impassable) for both the player and enemies.

### Collision helper
```js
isBlocked(px, py, radius) → boolean
```
- For `rect`/`water`: AABB vs circle test (clamp point to rect, distance check).
- For `tree`/`circle`: Circle vs circle test.

### Player movement with collision
`tryMove(hero, nx, ny)` attempts the combined move, then falls back to axis-separated moves
(slide along walls). Enemies use the same pattern in their AI state handlers.

### How to add obstacles
Add entries to `AREA_OBSTACLES[areaId]`. The drawing and collision code handles all four types automatically.

---

## 4. Enemy AI / Aggro / Respawn Model

### AI states
Each enemy has an `aiState` field:

| State | Behaviour |
|---|---|
| `'idle'` | Stands still; counts down `patrolTimer`, then picks a patrol point |
| `'patrol'` | Moves to `patrolTx/patrolTy` near spawn at `def.patrolSpeed` |
| `'chase'` | Moves toward hero at full `def.speed`; applies contact damage on reach |
| `'return'` | Moves back to `spawnX/spawnY` at 65% speed when hero is too far |

### State transitions
```
idle ──(patrolTimer <= 0)──► patrol
idle / patrol ──(dist to hero < aggroRadius)──► chase
chase ──(dist to hero > leashRadius)──► return
return ──(dist to spawn < 12)──► idle
return ──(dist to hero < aggroRadius*0.7)──► chase
```

### Per-type aggro/leash radii
Defined in `ENEMY_DEFS`:
```js
aggroRadius: 90,   // px — how close hero must be to trigger chase
leashRadius: 200,  // px — how far hero can go before enemy gives up
patrolSpeed: 28    // px/s while patrolling (much slower than chase speed)
```

### Respawn model
- Enemies only spawn via `populateArea()`, called on area entry.
- There is **no** automatic in-area respawn (the old `tick % 150` respawn loop has been removed).
- If all enemies in an area are defeated before leaving, `areaEnemyState[areaId].respawnTick` is set
  to `state.tick + RESPAWN_COOLDOWN_TICKS` (600 ticks ≈ 10 s).
- On re-entry, `spawnEnemiesForArea()` checks this: if the cooldown has not expired, it spawns 0 enemies.
- After the cooldown, a full complement spawns again on the next visit.

### How to add an enemy spawn
1. Add a type key to `ENEMY_DEFS` with all required fields including `aggroRadius`, `leashRadius`, `patrolSpeed`.
2. Add the type key to the target area's `enemyTypes` array in `AREAS`.

---

## 5. Lighting / Biome Model

### ambientLight
Every area has `ambientLight: 0–1`. After the biome-specific ground is drawn, a black overlay is applied:
```js
ctx.fillStyle = 'rgba(0,0,0,' + ((1.0 - area.ambientLight) * 0.70) + ')';
```
Values by biome:

| Biome | ambientLight | Visual effect |
|---|---|---|
| meadow | 1.0 | Fully bright, sunny |
| town | 1.0 | Fully bright |
| forest | 0.80 | Slightly filtered canopy light |
| cave | 0.22 | Very dark underground |
| keep | 0.18–0.28 | Dark evil fortress |
| lair | 0.12 | Near-pitch-black with ember glow |

### Biome ground effects
Each biome has a custom ground-layer draw function:
- **meadow**: Sky gradient + scattered flower dots (yellow/pink).
- **forest**: Soft canopy light patches.
- **town**: Cobblestone pattern.
- **cave**: Rocky ellipse patches.
- **lair**: Ember/lava glow patches.

### Background colors
`bgColor` in `AREAS` is a base CSS color; bright greens for outdoor areas, dark tones for caves/evil zones.
The UI theme (dark/light toggle) is completely separate from in-game lighting.

---

## 6. Sword Animation / Combat Timing

### Swing state
```js
swordSwing = { active, progress (0–1), duration (0.22 s), dir (radians), hitDealt }
```

### How it works
1. `tryAttack()` sets `swordSwing.active = true`, aims `swordSwing.dir` toward the nearest enemy (or mouse target / facing direction).
2. `state.hero.attackCooldown` is set to `ATTACK_COOLDOWN_SECS`.
3. Each game tick advances `swordSwing.progress += dt / duration`.
4. At `progress >= 0.45` (midpoint of swing), `applySwingDamage()` is called once (`hitDealt` guard).
5. `applySwingDamage()` hits all enemies within `getAttackRange()` and within an ~80° arc cone
   centred on `swordSwing.dir`.
6. At `progress >= 1.0` the animation ends.

### Drawing
`drawSwordSwingAnim()` draws:
- An arc trail from `startAngle` to the current swing position (fades out as `t` → 1).
- A sword blade at the tip of the arc (rotated to match current angle).
Colors match the equipped weapon, or default silver if no weapon.

### Cooldown
`ATTACK_COOLDOWN_SECS = 0.38` s. `tryAttack()` returns early if `swordSwing.active` or cooldown > 0.

---

## 7. World Map UI

Press **M** (or click the Map button) to toggle the world map overlay.

### MAP_LAYOUT
```js
MAP_LAYOUT = [ { id, col, row }, … ]
```
Maps each area to a grid column/row position in the map panel.

### Display
- **Unvisited areas** shown as dark boxes with "???".
- **Visited areas** shown with biome colour, name, and difficulty stars.
- **Current area** highlighted with a gold border and ★ marker.
- Connection lines drawn between neighbors.
- Click the canvas or press M again to close.

---

## 8. How to Add a New Biome

1. Add a `biome: 'mybiome'` entry to the `AREAS` definition.
2. Add a ground draw function `drawMyBiomeGround()` and call it from `drawBackground()` switch.
3. Set an appropriate `bgColor`, `ambientLight`, and `borderColor`.
4. Add terrain obstacle entries in `AREA_OBSTACLES`.
5. Consider adding a color entry in `BIOME_MAP_COLOR` for the map overlay.

---

## 9. Known Balancing Notes and Limitations

- **Aggro radii** are tuned per enemy type. Later-area enemies have larger aggro radii to compensate for low visibility. Adjust `aggroRadius`/`leashRadius` in `ENEMY_DEFS` to tune.
- **Enemy count scaling** (`area.enemyCount + Math.floor(hero.level * 0.4)`) can make higher levels crowded in small areas. Reduce the 0.4 multiplier if needed.
- **Respawn cooldown** (`RESPAWN_COOLDOWN_TICKS = 600`) is based on `state.tick` which advances at 60 fps ≈ 10 s. Increase for a more permanent "cleared area" feel.
- **Sword swing cone** is ~80° (1.4 radians half-width). Increasing the cone makes AoE feel more powerful.
- **Transition threshold** is 80 px. If the canvas is scaled (CSS), the px values still correspond to logical canvas coordinates.
- **Save migration**: v3 uses a new `STORAGE_KEY`. Old v2 saves are not migrated and result in a fresh game.
- **No multiplayer**: The standalone mode is entirely client-side; the original BrowserQuest server code is unmodified.
- **Obstacle collision for enemies**: Enemies use the same `isBlocked()` check as the player in `chase` and `patrol` states. This means enemies will slide around walls rather than passing through them.
