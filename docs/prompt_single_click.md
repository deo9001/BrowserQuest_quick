# Prompt: Convert This App to a Single-Click No-Install Local App

## Goal

I need you to modify this repository so the app can be launched by a normal non-developer user with a single click, without requiring them to install developer tools or run terminal commands.

This is **not the same as creating a simplified standalone clone**.

The first priority is to make the **real existing app** run in a single-click way using the current codebase, current features, and current app architecture as much as possible.

Only if that is genuinely not practical should you propose or implement a fallback standalone/lite version.

---

## Why This Matters

I am using a restricted non-admin PC.

I may not be able to install:

- Git
- Node.js
- npm
- pnpm
- yarn
- Python
- Docker
- VS Code extensions
- system packages
- build tools
- local servers
- compilers
- admin-required prerequisites

Even “portable ZIP installs” often fail on this PC because security policies still block executables, PATH changes, runtime downloads, or dependency installation.

So instructions like this are **not acceptable as the only user path**:

```bash
git clone ...
npm install
npm run dev
```

or:

```bash
pnpm install
pnpm dev
```

or:

```bash
python app.py
```

Those are developer workflows, not usable workflows for someone on a locked-down computer.

I need the app to be usable after downloading/extracting the repository or release package and clicking one obvious file.

---

## Important Definition: “Single-Click Running”

For this task, “single-click running” means:

A user can download or receive the app folder, open the folder, and launch the app by clicking one obvious file, such as:

```text
app.html
start.html
run_app.bat
launch_app.cmd
App.exe
App.app
index.html
```

No terminal commands should be required from the user.

No developer setup should be required from the user.

No package install should be required from the user.

No admin rights should be required from the user.

---

## Preferred Outcome

The ideal outcome is one of these, in priority order:

### Option 1 — Real App Runs From a Clickable HTML File

If possible, make the real app run by opening a root-level HTML file, for example:

```text
app.html
```

or:

```text
index.html
```

This is best if the app can work directly from `file://` or from static relative assets.

The app should use the real project code/features as much as possible.

Do **not** replace the real app with a toy clone unless there is no practical way to use the real app.

---

### Option 2 — Real App Runs From a Clickable Local Launcher

If the app needs a local server, bundled runtime, or startup step, create a single-click launcher.

Examples:

```text
Start App.bat
Launch App.cmd
Run App.command
App.exe
```

The launcher should start everything needed automatically.

However:

- It must not require admin rights.
- It must not require the user to manually install Node/Python/etc.
- It must not require typing commands.
- It should use bundled or repository-included runtime assets if legally/practically possible.
- It should clearly report errors if the PC blocks execution.

---

### Option 3 — Portable Desktop Build

If appropriate, package or document a portable app layout such as:

```text
App Portable/
  App.exe
  resources/
  assets/
```

Electron, Tauri, Neutralino, or similar may be acceptable **if the result can run without installation**.

Important:

- Prefer portable/extracted-folder execution over an installer.
- Do not require admin rights.
- Do not assume the user can install a system runtime.
- If a portable desktop app cannot be created inside this repo directly, document exactly what release artifact should be produced.

---

### Option 4 — Hosted Web App

If local single-click is not possible but the app can be hosted as a static or server app, document that.

However, a hosted app alone is not enough for this task because websites can be blocked on restricted PCs.

Hosted mode is useful but should not replace the need for a portable or local-click option unless no other option is possible.

---

## Initial Investigation Requirements

Before changing files, inspect the repository and determine:

1. What kind of app this is:
   - static HTML/CSS/JS
   - React/Vue/Svelte/Angular
   - Vite/Next/Nuxt/SvelteKit
   - Python web app
   - Electron/Tauri/desktop app
   - backend + frontend
   - WebAssembly app
   - game engine app
   - other

2. What the current run instructions are.

3. What dependencies are required.

4. Whether the app can be built into static assets.

5. Whether those static assets can run from:
   - `file://`
   - a local static folder
   - a browser using relative paths
   - a bundled local server
   - a portable desktop runtime

6. What features may break under `file://`, such as:
   - JavaScript modules
   - WebAssembly
   - workers
   - service workers
   - local file access
   - network calls
   - authentication
   - database access
   - backend APIs
   - CORS-restricted requests
   - git/network sync
   - collaboration
   - native filesystem access

7. Whether the app has a realistic full-feature single-click path.

---

## Implementation Strategy

Follow this order.

---

## Phase 1 — Try to Make the Existing Full App Single-Click

First, attempt to preserve the full app.

Possible approaches:

### A. Static Build Entrypoint

If the project can be built into static files, add or configure a root-level launcher such as:

```text
app.html
```

or:

```text
index.html
```

Make sure asset paths are relative and work from the extracted folder.

Avoid absolute paths like:

```text
/assets/app.js
```

if they break under local folder use.

Prefer:

```text
./assets/app.js
```

or correct relative paths.

---

### B. Prebuilt Static Assets

If the app requires a build step, consider committing or generating a prebuilt static output folder if appropriate for the repository.

Example:

```text
portable/
  app.html
  assets/
    app.js
    app.css
```

The user should not need to run the build.

Document how maintainers update the build later.

---

### C. Clickable Launcher Script

If the app needs a small local server, create a one-click launcher that starts it.

Examples:

```text
Start App.bat
Launch App.cmd
```

But only use this if the required runtime is bundled or otherwise available without installation.

Do not assume Node/Python exists on the user’s machine unless you include a graceful detection message.

If the launcher cannot proceed, it should say plainly:

```text
This app requires Node.js, but Node.js was not found.
This PC may block portable runtimes.
Please use the standalone fallback or hosted version.
```

---

### D. Portable Runtime Folder

If legal and practical, support a portable runtime layout.

Example:

```text
runtime/
  node/
  python/
app/
  ...
Start App.bat
```

The launcher should use the local runtime path, not system PATH.

Be careful about repository size and licensing.

If bundling the runtime is too large for the repo, document the release packaging process.

---

### E. Desktop Wrapper

If the app is a web app that requires server-like behavior, consider whether an Electron/Tauri/Neutralino wrapper is appropriate.

If adding a desktop wrapper:

- Prefer portable output.
- Keep existing web app workflow intact.
- Do not force an installer-only flow.
- Clearly document release build steps for maintainers.
- Clearly document whether the user needs admin rights.

---

## Phase 2 — Identify Hard Blockers

If the real app cannot fully work as single-click, explain exactly why.

Use plain language.

Examples of valid blockers:

- The app needs a backend server.
- The app depends on system-installed Node/Python.
- The app requires WebAssembly or workers that do not run from `file://`.
- The app uses APIs blocked by local file mode.
- The app needs a database or authentication service.
- The app depends on package installation at runtime.
- The app relies on native binaries that cannot be bundled.
- The browser blocks required local file access.
- The organization/security policy may block portable executables.

Do not simply say “not possible.”

Give a technical explanation and a user-friendly explanation.

---

## Phase 3 — Only Then Create a Standalone/Lite Fallback

Only if the existing full app cannot practically be made single-click should you create a fallback standalone version.

The fallback should be clearly labeled as:

```text
Standalone Mode
Lite Mode
No-Install Mode
Emergency Local Mode
```

It must not be falsely presented as the full app if it lacks full features.

The standalone version should preserve the most important user workflow, even if advanced features are unavailable.

Examples:

- editor works but full compilation does not
- preview works but export is limited
- local-only mode works but sync does not
- file import/export works but collaboration does not
- generated output preview works but backend processing does not

If you create this fallback, also create or update documentation explaining:

- what works
- what does not work
- why it is different from the full app
- what external dependencies it uses
- whether it works offline
- what happens if CDN/network access is blocked

---

## Required User-Facing Files

Create or update files as appropriate.

Prefer a clear root-level launcher, such as:

```text
app.html
```

or:

```text
start.html
```

or:

```text
Start App.bat
```

or another obvious name based on the project.

Also create an info file:

```text
single_click_info.md
```

This file must explain:

1. How to use the single-click version.
2. What file to click.
3. Whether it is the full app or a fallback/lite app.
4. What features work.
5. What features do not work.
6. What external dependencies/assets are used.
7. Whether internet access is required.
8. Whether admin rights are required.
9. What to do if the app does not launch.
10. Difference between:
    - user single-click mode
    - developer setup mode

---

## Dependency Disclosure

If the single-click version uses external dependencies, CDNs, bundled assets, runtimes, or generated build files, list them in:

1. The app’s About/Help screen, if the app has UI.
2. `single_click_info.md`.
3. README, if appropriate.

For each dependency, include:

- name
- purpose
- source/location
- local or external/CDN
- whether it requires internet access
- what happens if it is blocked
- license if known

---

## README Updates

Update the README so it clearly separates:

### For normal users

```text
Download ZIP.
Extract it.
Click [launcher file].
```

### For developers

```bash
npm install
npm run dev
```

or equivalent.

Do not mix these in a confusing way.

Make it very clear that the terminal/dependency workflow is for developers, not required for the single-click user path if the implementation supports that.

---

## App UX Requirements

If there is a browser or desktop UI for the single-click version, add:

- clear title
- clear status indicator
- About/Help panel
- dependency list
- limitations notice
- error messages if assets fail
- graceful fallback if external CDN/network fails
- import/export if relevant
- visible loading state
- responsive layout if browser-based
- keyboard accessibility where practical

---

## Technical Quality Requirements

- Keep the existing developer workflow intact.
- Do not delete the original app source.
- Do not break normal development commands.
- Use relative paths for local assets.
- Avoid hidden assumptions about system-installed tools.
- Avoid requiring admin permissions.
- Handle blocked files/CDNs gracefully.
- Document all tradeoffs.
- Prefer preserving full app functionality over creating a simplified clone.
- If a clone/fallback is necessary, label it honestly.

---

## Acceptance Criteria

The task is successful if:

1. There is a clear single-click launch path.
2. A normal user can understand what file to click.
3. The user does not need to manually install Git, Node, npm, pnpm, Python, Docker, or other developer tools.
4. The implementation attempts to run the real existing app first.
5. If the real app cannot be single-clicked, the reasons are documented clearly.
6. If a standalone/lite fallback is created, it is useful and honestly labeled.
7. Dependencies and external assets are disclosed.
8. README and `single_click_info.md` are updated.
9. Existing developer setup remains intact.
10. Errors are graceful and understandable.

---

## Final Instruction

Do not jump straight to making a toy standalone clone.

First, investigate whether the real app can be made single-click.

Only after identifying the technical blockers should you create a standalone/lite fallback.

The goal is access for users on restricted non-admin PCs, not just developer convenience.