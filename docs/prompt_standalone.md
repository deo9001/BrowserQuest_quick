# Prompt: Create the Best Possible Standalone No-Install Version of This App

## Goal

Create the best practical standalone/no-install version of this app for users who cannot run the full developer setup.

This prompt is Plan B.

Use this only after determining that the real full app cannot practically be made single-click using the existing app architecture.

The standalone version may be simpler than the full app, but it should still be useful, polished, honest, and high quality.

---

## User Situation

The target user is on a restricted non-admin PC.

They may not be able to install:

- Git
- Node.js
- npm
- pnpm
- yarn
- Python
- Docker
- VS Code extensions
- native dependencies
- compilers
- package managers
- local servers
- system runtimes

They may also have blocked websites, blocked CDNs, blocked installers, blocked portable executables, or blocked ZIP-based runtime tools.

So the standalone version should require the least possible setup.

Ideal usage:

```text
Download ZIP.
Extract folder.
Open one obvious file.
Use the app.
```

---

## Important Definition: Standalone Version

A standalone version is allowed to be different from the full app.

It can be:

- a single HTML file,
- an HTML file plus local CSS/JS/assets,
- a static browser app,
- a portable folder,
- a no-install lite mode,
- a simplified local version,
- a useful offline fallback.

But it must be honest.

Do not pretend it is the full app if important full-app features are missing.

Use labels like:

```text
Standalone Mode
Lite Mode
No-Install Mode
Local Static Mode
Portable Mode
```

---

## Core Philosophy

The standalone version should not be a lazy placeholder.

It should be the best possible version within the no-install constraints.

The result should feel:

- complete,
- comfortable,
- discoverable,
- reliable,
- polished,
- accessible,
- useful to a non-developer.

If the standalone version cannot support a full feature, it should provide:

- a fallback,
- a clear explanation,
- a visible warning,
- source/output preservation,
- import/export where possible.

---

## First Step: Understand the Full App

Before implementing the standalone version, inspect the existing app and document:

1. What the full app does.
2. Its most important user workflows.
3. Its most important features.
4. Which features can realistically work in standalone mode.
5. Which features cannot work and why.
6. Whether external CDNs or local assets can improve standalone mode.
7. Whether a single-file HTML approach is best.
8. Whether separated local files are better.

Do not blindly recreate the UI without understanding the app’s purpose.

---

## Standalone Architecture Options

Choose the best architecture for this app.

### Option A — Single HTML File

Use this when the app can fit cleanly into one file.

Example:

```text
app_standalone.html
```

Benefits:

- easiest to copy
- easiest to double-click
- fewer broken paths
- best for locked-down users

Downsides:

- harder to maintain
- can become large
- may be limited for complex apps

---

### Option B — HTML Plus Local Assets

Use this when maintainability or functionality benefits from separate files.

Example:

```text
app_standalone.html
standalone/
  css/
    app.css
  js/
    app.js
  assets/
    sample-data.json
```

Requirements:

- all paths must be relative
- app must work after ZIP extraction
- moving only the HTML file may not work, and docs must say so
- local asset dependencies must be listed

---

### Option C — Static App Folder

Use this when the standalone version needs multiple assets.

Example:

```text
standalone-app/
  index.html
  assets/
  js/
  css/
```

Then root can include a launcher:

```text
standalone.html
```

or README instructions saying which file to open.

---

### Option D — CDN-Assisted Standalone

External dependencies are allowed if they greatly improve the app.

Examples:

- MathJax
- KaTeX
- Monaco Editor
- CodeMirror
- pdf.js
- Pyodide
- JSZip
- marked
- Mermaid
- Chart.js
- Three.js

But if CDNs are used:

- disclose them in the app
- disclose them in docs
- explain that internet/CDN blocking may reduce functionality
- degrade gracefully if they fail
- keep core editing/import/export available if possible

---

## Required Files

Create or update:

```text
standalone_info.md
```

This file must explain:

1. What the standalone version is.
2. How to use it.
3. What file to click.
4. Whether it works offline.
5. Whether it uses external CDNs.
6. What dependencies/assets it uses.
7. What full-app features are missing.
8. Why those features are missing.
9. Troubleshooting steps.
10. Difference between standalone mode and full app/developer mode.

Also update README if appropriate.

---

## Required In-App UI

If the standalone version has a user interface, include:

### 1. About / Help / Dependencies Panel

This panel should list:

- what this standalone version is
- what it can do
- what it cannot do
- all external dependencies
- all local asset files
- whether internet is required
- what to do if something is blocked
- link or reference to full app mode if applicable

### 2. Status Area

Show states like:

```text
Ready
Loading dependency...
Dependency failed
Rendering...
Saved
Exported
Warning
Error
```

### 3. Warning / Limitations Area

Unsupported features should be visible and understandable.

Example:

```text
This preview cannot compile full documents. The source is preserved below.
```

### 4. Import / Export

If the app handles user content, provide:

- load file
- drag/drop if feasible
- download/export
- copy output/source
- reset sample/demo

### 5. Fallbacks

If rendering or execution fails:

- do not blank the screen
- show source
- show partial output
- show error details
- preserve user data
- allow export

---

## Browser and Security Constraints

Remember that double-clicked HTML usually runs under:

```text
file://
```

This can restrict:

- JavaScript modules
- `fetch()` of local files
- WebAssembly
- workers
- service workers
- local file access
- CORS requests
- authentication
- network calls
- IndexedDB/local storage in some cases
- dynamic imports
- fonts/assets
- media loading
- PDF workers

Design around those restrictions.

If a feature does not work from `file://`, explain it and provide a fallback.

---

## Dependency Disclosure Requirements

If any dependency is used, document it in both the app and `standalone_info.md`.

For each dependency, include:

```text
Name:
Purpose:
Source:
Local or CDN:
Internet required:
Failure behavior:
License:
```

If the license is not confirmed, say:

```text
License: Not verified in this task; verify before release.
```

Do not hide external dependencies.

---

## Premium Standalone Feature Expectations

Add as many relevant features as practical.

Possible features:

- polished app shell
- responsive layout
- theme toggle
- keyboard shortcuts
- import file
- export file
- copy to clipboard
- sample/demo content
- preview panel
- source panel
- output panel
- warning panel
- status badges
- help/about modal
- dependency modal
- fullscreen/focus mode
- local storage autosave
- reset confirmation
- error recovery
- file metadata display
- drag and drop
- object URL cleanup if using uploaded assets
- render timing
- accessible labels
- skip link
- visible focus states

Do not add irrelevant features just for size, but do make the app feel complete.

---

## BrowserPy-Inspired Ideas

If useful, take inspiration from BrowserPy-style standalone apps:

- clear editor + side/control panel layout
- visible runtime/status indicators
- file upload/import workflows
- preview actions
- managed object URLs
- virtual file list if useful
- same-folder/nested asset awareness where practical
- media previews for uploaded assets
- app host/preview panel
- responsive sidebar
- fullscreen/focus mode
- cleanup/reset lifecycle
- dependency/status reporting

Do not turn the app into BrowserPy unless that is the app’s purpose.

Use these ideas only where they help.

---

## Handling Unsupported Full-App Features

When a full-app feature cannot work in standalone mode, do not ignore it.

Create a visible explanation.

Example format:

```text
Feature: Real-time collaboration
Standalone status: Not available
Reason: Requires network signaling/server or WebRTC coordination not included in static mode
Fallback: Local editing and export are available
```

Examples of features that may need this treatment:

- login/authentication
- cloud sync
- git operations
- database writes
- backend APIs
- native filesystem access
- real compilation
- real-time collaboration
- server rendering
- payment/API integrations
- hardware access
- package installation

---

## Data Preservation

The standalone app should prioritize not losing user work.

If relevant, implement:

- local autosave
- export/download
- copy to clipboard
- warning before reset
- warning before replacing current document
- recover last draft from localStorage
- manual save instructions

If localStorage is used, explain it in About/docs.

---

## Accessibility Requirements

Use:

- semantic HTML
- real buttons
- labels for inputs
- `aria-live` for status updates
- visible focus states
- keyboard operability
- skip link if layout is complex
- readable contrast
- responsive layout

Do not make a mouse-only app if avoidable.

---

## Documentation Requirements

Create or update documentation with these sections:

### Standalone Quick Start

```text
1. Download ZIP.
2. Extract ZIP.
3. Open the folder.
4. Double-click [file name].
```

### What Works

List supported standalone features.

### What Does Not Work

List unsupported full-app features.

### Why This Exists

Explain that some users cannot install developer tools or use hosted websites because of locked-down PCs.

### Dependencies

List external and local assets.

### Troubleshooting

Use this format:

```text
Issue:
Cause:
Fix:
```

Include common issues:

- blank page
- CDN blocked
- file will not open
- browser blocks popup
- export does not download
- local assets missing
- moved HTML file away from assets
- unsupported browser
- feature unavailable in static mode

### Full App vs Standalone

Make clear that developer setup may still be required for the full app.

---

## README Update

If the repo has a README, add a section like:

```text
## No-Install Standalone Mode

For users who cannot install developer tools:

1. Download the ZIP.
2. Extract it.
3. Double-click [standalone file].

This mode is different from the full app. See standalone_info.md.
```

Keep developer instructions separate:

```text
## Developer Setup

npm install
npm run dev
```

---

## Implementation Quality Rules

- Do not break the original app.
- Do not delete original source.
- Do not remove developer setup.
- Use relative paths for local standalone assets.
- Fail gracefully.
- Preserve user data.
- Do not silently hide unsupported features.
- Do not make false claims about full functionality.
- Keep UI polished and understandable.
- Test repeated use/reset flows.
- Test what happens when dependencies fail.
- Test after moving/extracting the folder if possible.

---

## Acceptance Criteria

The standalone task is successful if:

1. There is a clear standalone file or folder to open.
2. The standalone version requires no Git/Node/npm/pnpm/Python/Docker/admin setup.
3. The core user workflow is useful.
4. Unsupported full-app features are clearly explained.
5. Import/export or data preservation exists where relevant.
6. The UI has status, warnings, help/about, and dependency disclosure.
7. External dependencies are documented.
8. `standalone_info.md` exists.
9. README is updated if appropriate.
10. The original full app remains intact.

---

## Final Instruction

Create the best possible no-install standalone version, but be honest about its limits.

The goal is not to fake the full app.

The goal is to give restricted-PC users a useful, polished, accessible version they can actually run.