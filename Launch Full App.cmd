@echo off
setlocal
cd /d "%~dp0"

echo BrowserQuest full app launcher (developer/server mode)
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo The full BrowserQuest server requires Node.js on this PC.
  echo Use standalone.html for no-install local play, or follow README Developer Setup on a developer PC.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  echo Install Node.js LTS (which includes npm), then retry.
  echo Use standalone.html for no-install local play if this PC is restricted.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies with npm install...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Resolve the error above and rerun this launcher.
    exit /b 1
  )
)

echo Starting BrowserQuest server...
echo Client URL: http://127.0.0.1:8000/client/index.html
start "" "http://127.0.0.1:8000/client/index.html"
node server\js\main.js

if errorlevel 1 (
  echo.
  echo Server exited with an error. See output above.
  exit /b 1
)

endlocal
