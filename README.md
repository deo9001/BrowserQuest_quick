BrowserQuest [updated & with Socket.IO]
============

[![Node.js CI](https://github.com/nenuadrian/BrowserQuest/actions/workflows/node.js.yml/badge.svg)](https://github.com/nenuadrian/BrowserQuest/actions/workflows/node.js.yml)

![alt tag](https://raw.github.com/nenuadrian/BrowserQuest/master/screens/1.png)

Changes
============
* Updated backend and frontend to use Socket.IO server and client
* Main changes were made to ws.js and gameclient.js
* Updated dependencies such as RequireJS and jQuery
* Fixed build script flow
* Added server dispatch behavior for host/port config

This is a fork of Mozilla's BrowserQuest multiplayer HTML5 game experiment.

## No-Install Standalone Mode

For users who cannot install developer tools:

1. Download the repository ZIP.
2. Extract it.
3. Double-click **`standalone.html`** in the root folder.

This mode is different from the full multiplayer app. See **`standalone_info.md`**.

Standalone mode is intentionally honest:
- It is a polished local playable **Standalone/Lite** mode.
- It does **not** claim to be the full multiplayer Socket.IO app.
- It uses local files and works without Node.js/npm/Git/admin setup.

## Full App Developer Setup (Recommended VS Code Path)

Use this path on a normal/admin development PC for the full BrowserQuest app.

1. Install prerequisites:
   - Git
   - Node.js LTS
   - VS Code
2. Clone and open the repository in VS Code.
3. Open VS Code integrated terminal (`Terminal` → `New Terminal`).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the Node.js game server:
   ```bash
   node server/js/main.js
   ```
6. Open the BrowserQuest client at:
   - `http://127.0.0.1:8000/client/index.html`
7. Stop/restart server:
   - Stop: `Ctrl + C` in the terminal
   - Restart: run `node server/js/main.js` again
8. Common troubleshooting:
   - **Node.js not found**: reinstall Node.js LTS and reopen VS Code
   - **Dependencies missing**: run `npm install` again in repo root
   - **Port already in use (8000)**: stop conflicting process or update server config
   - **Client cannot connect**: ensure server terminal is still running and URL is exactly `http://127.0.0.1:8000/client/index.html`

## Windows full-app launcher (developer/server mode)

Use **`Launch Full App.cmd`** from repo root on Windows:
- Detects Node.js and npm availability
- Installs dependencies if needed
- Starts the full BrowserQuest Node.js server
- Opens/prints the local browser URL
- Shows clear errors when prerequisites are missing

If Node.js is unavailable, use `standalone.html` for no-install local play.

## Investigation summary

- Full app type: HTML5/JavaScript client + Node.js/Socket.IO multiplayer server.
- Full multiplayer cannot be reliably run by opening local files via `file://` on restricted PCs.
- Standalone mode exists to provide a practical no-install playable option while preserving full app workflows.

Original README
============
BrowserQuest is a HTML5/JavaScript multiplayer game experiment.

Documentation
-------------
Documentation is located in `client` and `server` directories.

License
-------
Code is licensed under MPL 2.0. Content is licensed under CC-BY-SA 3.0. See `LICENSE`.

Credits
-------
Created by [Little Workshop](http://www.littleworkshop.fr):

* Franck Lecollinet - [@whatthefranck](http://twitter.com/whatthefranck)
* Guillaume Lecollinet - [@glecollinet](http://twitter.com/glecollinet)
