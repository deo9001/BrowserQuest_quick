# BrowserQuest single-click info

## 1. How to use the single-click version
1. Download or extract the repository folder.
2. Open the folder.
3. Double-click **`Start BrowserQuest.html`**.

## 2. What file to click
- **`Start BrowserQuest.html`** at the repository root.

## 3. Is this the full app or a fallback/lite app?
- The root launcher is a **clearly labeled fallback / no-install launcher**.
- The **real existing BrowserQuest app** is still present under `client/` and `server/`.
- The full multiplayer app was investigated first, but it cannot reliably run as a single-click local `file://` app from this repository alone.

## 4. What works
- The launcher opens locally with one click.
- It works from an extracted folder with **no admin rights**.
- It needs **no Git, Node.js, npm, Python, Docker, terminal commands, or build tools** for the launcher itself.
- It explains the real app requirements, limitations, and dependency disclosures.
- It includes local BrowserQuest screenshots and links to the original client files.

## 5. What does not work
- The real multiplayer game does **not** fully run from a clicked local HTML file alone.
- This repository does **not** bundle a portable Node.js runtime or auto-starting game server.
- Opening `client/index.html` directly from `file://` is not a reliable no-install path.

## 6. Investigation findings

### What kind of app this is
- **Backend + frontend HTML5/JavaScript game**
- Multiplayer browser game
- Client/server architecture
- Frontend uses RequireJS, jQuery, canvas rendering, workers, and local assets
- Backend uses Node.js and Socket.IO

### Current run instructions
- `npm install`
- `node server/js/main.js`
- Open `client/index.html`

### Dependencies required by the real app
- Node.js runtime
- npm packages from `package.json`
- Socket.IO client and server
- Browser support for WebSockets, localStorage, Ajax, and workers

### Can it be built into static assets?
- There is a RequireJS build flow in `bin/build.sh`.
- However, even a built client still expects a live multiplayer backend.

### Can the static assets run from `file://`?
- **Not reliably.**
- Reasons:
  - `client/js/config.js` loads JSON config through RequireJS text loading.
  - `client/js/map.js` uses Ajax for map JSON on some devices and `Worker('js/mapworker.js')` plus `importScripts(...)` on others.
  - The client connects to a Socket.IO backend and does not function as a standalone offline game.

### Features that break or are blocked in local-file mode
- Socket.IO network connection to the real game server
- RequireJS text-loaded JSON config
- Ajax map loading
- Web worker map loading/importScripts
- Multiplayer world state, chat, combat, loot, and synchronized players

### Realistic full-feature single-click path
- **Not from this repository alone on a restricted no-install PC.**
- A realistic full-feature single-click path would require a bundled portable Node.js runtime plus a launcher script and local server process, or a separately hosted server.
- This repository does not include that portable runtime, and many restricted PCs block unsigned executables anyway.

## 7. External dependencies / assets disclosure

| Name | Purpose | Source / location | Local or external | Internet required? | What happens if blocked? | License |
|---|---|---|---|---|---|---|
| BrowserQuest source assets | UI, sprites, maps, CSS, JS, screenshots | This repository (`client/`, `server/`, `screens/`) | Local | No for launcher | Launcher still works if files are present | MPL 2.0 code / CC-BY-SA 3.0 content |
| Socket.IO browser client | Browser-side connection for the real game client | `client/js/lib/socket.io.min.js` copied from installed `socket.io` package | Local | No after it is bundled locally | Full client cannot connect to server | MIT |
| Node.js + npm dependencies | Real multiplayer server runtime | User/developer environment, not bundled into single-click fallback | External runtime | No internet after install, but install is required | Full game cannot run locally | Various |

## 8. Is internet access required?
- **For the launcher:** No.
- **For the real app from this repository:** Internet is not the main blocker; the bigger blocker is the missing bundled server/runtime and browser restrictions in `file://` mode.

## 9. Are admin rights required?
- **Launcher:** No.
- **Developer setup for the real app:** Usually no admin rights are needed if Node.js is already available, but a restricted PC may still block it.

## 10. What to do if the app does not launch
- If `Start BrowserQuest.html` does not open, re-extract the folder and try again.
- If screenshots or links fail, your browser or security policy may be blocking local files.
- If `client/index.html` does not run, that is expected in many browsers because the real app needs a live server and non-`file://` loading.
- For the real app, use the developer workflow below on a machine that allows Node.js.

## 11. Difference between single-click mode and developer setup mode

### Single-click mode
- Click `Start BrowserQuest.html`
- No install
- Offline launcher / fallback information mode
- Does **not** pretend to be the full multiplayer game

### Developer setup mode
- Install dependencies with npm
- Start the Node.js game server
- Open the BrowserQuest client in a browser
- Intended for development or for a future packaged release that bundles a runtime
