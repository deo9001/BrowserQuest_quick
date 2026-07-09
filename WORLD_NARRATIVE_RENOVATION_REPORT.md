# BrowserQuest Standalone World/Narrative Renovation Report (v4)

## Narrative/story model
- Added `storyState` with:
  - `chapter` (mapped to `STORY_CHAPTERS`)
  - `flags` (`metElder`, `gatheredGuidance`, `relicTargetReached`, `fortressAccess`, `sanctumEntered`, `shadowCleansed`)
  - `loreNotes` discovered by entering story-tagged locations
  - `discoveredLocations` for map visibility
- Core premise: shadow relic corruption spreads from fortress zones; the player investigates, gathers relics, prepares via vendors, and cleanses the Shadow Sanctum.

## NPC definitions and dialogue model
- Data-driven NPCs in `NPC_DEFS` with:
  - `id`, `name`, `role`, `areaId`, `x`, `y`, optional `vendorId`
- Progress-aware dialogue in `getNpcDialogue(npc)` reacts to story flags and quest progression.
- Interaction is proximity-based + `E` key (or Interact button).

## Quest/objective chain
- `questState` persists progression and objective text.
- Quest steps (`QUEST_STEPS`):
  1. Speak to Elder Mira.
  2. Gather guidance in forest/cave routes.
  3. Recover 3 relic fragments.
  4. Gain fortress access (Fortress Sigil).
  5. Prepare via vendor upgrades.
  6. Confront and cleanse Shadow Sanctum.
- HUD objective cell (`objectiveValue`) displays current objective + chapter context.

## Vendor/economy model (relic currency)
- Vendors and stock are data-driven (`VENDOR_STOCK`).
- Purchases use relics and persist in `vendorPurchases` and `purchaseCount`.
- Purchase effects include:
  - healing
  - equipment upgrades
  - map charter reveal
  - lantern darkness mitigation
  - fortress access flag
- Insufficient relic purchases fail with clear notification.

## Enterable building/interior/portal model
- Portals are defined in `PORTALS`:
  - source area/position/radius
  - destination area/spawn
  - label
  - optional lock requirements (`requiresFlag`, `lockedMsg`)
- Added enterable locations:
  - Elder's Hall
  - Ironbound Smithy
  - Relic Cavern
  - Shadow Sanctum
- Door/portal interaction uses `E` near portal markers.

## Region graph and connected-world model
- Open-world edge neighbors continue to use `AREAS[n].neighbors`.
- Portal graph overlays interior links without hardcoding fake claims in map UI.
- Map now draws:
  - neighbor links
  - portal links (dashed)
  - lock state (Sanctum)
  - discovered/known visibility

## Transition preview/buffer collision rules
- Edge transition safety now validates destination spawn clearance before allowing transition.
- Preview strips include blocked segment markers where destination entry points are not traversable.
- This prevents transitioning into blocked destination geometry.

## Safe spawn validation + Shadow Fortress fix
- Added generalized helpers:
  - `isSpawnClear(areaIndex, x, y, radius)`
  - `findSafeSpawn(areaIndex, desiredX, desiredY, radius, maxRange)`
- All edge and portal transitions use safe-spawn fallback before committing transition.
- Shadow Fortress entrance issue is fixed by rejecting blocked edge segments and relocating to nearby safe spawn when available.

## Save/load migration notes
- Save version upgraded to `bq_standalone_v4`.
- Legacy `bq_standalone_v3` saves are loaded and migrated.
- Migration/defaulting includes story, quest, vendors, upgrades, npc flags.
- Saved blocked player positions are auto-relocated using safe-spawn logic.

## How to add a new NPC
1. Add entry to `NPC_DEFS` with id/name/role/area/position.
2. Add dialogue branch in `getNpcDialogue`.
3. Optionally attach a `vendorId` for shop behavior.

## How to add a new dialogue
1. Add condition branch in `getNpcDialogue`.
2. Gate by `storyState.flags`, `questState.step`, or custom `npcFlags`.

## How to add a new vendor item
1. Add item object in `VENDOR_STOCK[vendorId]` with cost/effect metadata.
2. Handle new effect in `applyVendorEffect` when needed.

## How to add an enterable building/interior
1. Add interior area to `AREAS` and obstacle layout in `AREA_OBSTACLES`.
2. Add two-way portal entries in `PORTALS`.
3. Optionally add interior NPC/vendor content.

## How to add a safe portal/transition
1. Define portal source/target in `PORTALS`.
2. Ensure target spawn has clear walkable room.
3. Rely on `findSafeSpawn` fallback and provide a `lockedMsg` if gated.
