@echo off
setlocal
cd /d "%~dp0"

echo.
echo   Starting Samuel...
echo   Browser opens in a moment. Keep this window open.
echo   Press Ctrl+C twice to stop.
echo.

start "" /b cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"
call pnpm dev

echo.
pause
