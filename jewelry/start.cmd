@echo off
setlocal
cd /d "%~dp0"

echo.
call "%~dp0_freeport.cmd"
if errorlevel 1 (
  pause
  exit /b 1
)

echo   Starting Samuel...
echo   Browser opens in a moment. Keep this window open.
echo   Press Ctrl+C twice to stop.
echo.

start "" /b cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"
call pnpm dev

echo.
pause
