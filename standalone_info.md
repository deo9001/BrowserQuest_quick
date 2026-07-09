# BrowserQuest Standalone Mode Information

## Standalone Quick Start
1. Download the repository ZIP and extract it.
2. Keep the folder structure intact.
3. Double-click **`standalone.html`** in the repository root.

No terminal commands, Node.js, npm, Git, admin rights, or package installs are required for this mode.

## Full App Inspection Summary
1. **What the full app does**: BrowserQuest is a multiplayer browser RPG with real-time combat, movement, chat, loot, and shared world state.
2. **Current run instructions**: install dependencies and run `node server/js/main.js`, then open the client in a browser.
3. **Required dependencies**: Node.js runtime, npm dependencies (`package.json`), Socket.IO server/client, browser WebSocket support.
4. **Important workflows/features**: create/load character, explore map, fight enemies, collect gear, chat, and interact with other players in synchronized worlds.
5. **What can work in static standalone mode**: local single-player movement/combat/collectibles, HUD/status/help, local save data.
6. **What cannot work in static standalone mode**: multiplayer synchronization, server-hosted world state, live chat, server metrics/dispatch.
7. **Single file vs folder approach**: a root-level single-file entry (`standalone.html`) is best for non-technical users; it still references repository-local assets through relative paths.
8. **External CDNs/assets**: standalone mode uses no CDN. It optionally loads local BrowserQuest art files and gracefully falls back to local shape rendering.
9. **Auto-start local launcher feasibility for full app**: feasible only on developer PCs with Node.js installed; provided by `Launch Full App.cmd` with runtime checks and clear error guidance.

## What Works
- Playable **Standalone Mode** from `standalone.html`.
- Keyboard + click/touch movement.
- Basic combat (attack nearby enemies), health, score, collectible relic objective.
- Status updates (`Ready`, `Loading assets`, `Asset failed`, `Playing`, `Paused`, `Reset`, `Error`).
- Accessible controls and semantic UI (buttons, labels, `aria-live`, keyboard shortcuts, visible focus).
- Local persistence with autosave (`localStorage`) plus export/import/reset flows.
- Responsive layout and theme toggle.
- Offline operation for standalone mode (internet not required).

## What Does Not Work
- Full multiplayer BrowserQuest gameplay in standalone static mode.
- Player-to-player synchronization, global chat, and shared server world events.
- Node.js/Socket.IO server runtime features.

## Why This Exists
The full BrowserQuest app is a client/server multiplayer architecture and depends on a live Node.js + Socket.IO server. Restricted non-admin PCs often cannot install or run required developer/server tooling. Standalone Mode provides a practical, honest, no-install fallback that users can run after extracting the ZIP, while keeping the original full app and developer workflow intact.

## Dependencies

| Name | Purpose | Source/location | Local or CDN | Internet required | Failure behavior | License |
|---|---|---|---|---|---|---|
| Browser APIs (Canvas, localStorage, DOM, JS) | Standalone game loop, rendering, input, save data | User's web browser | Local runtime | No | Game may lose persistence if localStorage blocked; gameplay still runs | Browser/vendor license |
| BrowserQuest local art assets (`client/img/1/coder.png`, `client/img/1/rat.png`) | Optional sprite rendering in standalone mode | This repository | Local | No | If missing/blocked, standalone switches to local shape fallback rendering | MPL 2.0 code / CC-BY-SA 3.0 content |
| BrowserQuest standalone HTML/JS/CSS (`standalone.html`) | No-install playable mode entry | This repository root | Local | No | If file blocked by policy, user cannot launch standalone | MPL 2.0 (repository license) |
| Node.js + npm deps + Socket.IO server (full app mode only) | Real multiplayer server features | `server/` + `package.json` dependencies | External runtime on developer PC | Install step requires internet | Full multiplayer app cannot run without it | License: Not verified in this task; verify before release. |

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `standalone.html` opens but nothing moves | Browser blocked scripts or focus not on page | Click inside the page/canvas, then use Arrow keys/WASD; verify JS is enabled |
| Status shows `Asset failed` | Optional local sprite files failed to load | Keep folder structure intact; re-extract ZIP. Gameplay still works with fallback rendering |
| Save/export/import not working | localStorage blocked or invalid import JSON | Allow local storage for this file and re-try; validate JSON before import |
| Full multiplayer does not work from standalone | Standalone mode is static/local only | Use developer mode with Node.js server (`Launch Full App.cmd` or README steps) |
| `Launch Full App.cmd` shows Node.js missing | Developer runtime not installed | Install Node.js LTS on a developer/admin PC, then run launcher again |

## Full App vs Standalone

| Area | Standalone Mode (`standalone.html`) | Full App / Developer Mode |
|---|---|---|
| Setup | No install, open file directly | Requires Node.js + npm dependencies |
| Multiplayer | No | Yes (Socket.IO server) |
| Server state/chat/world sync | No | Yes |
| Runtime dependency | Browser only | Browser + Node.js server |
| Best use case | Restricted PC local play | Full development and multiplayer testing |
| Entry point | `standalone.html` | Windows: `Launch Full App.cmd`<br>Manual: `node server/js/main.js` then open `http://127.0.0.1:8000/client/index.html` |
