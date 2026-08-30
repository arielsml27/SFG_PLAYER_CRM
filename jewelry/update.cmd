@echo off
setlocal
cd /d "%~dp0"

echo.
echo   [1/3] Downloading latest code...
call git pull --ff-only
if errorlevel 1 goto failed

echo.
echo   [2/3] Installing packages...
call pnpm install
if errorlevel 1 goto failed

echo.
echo   [3/3] Updating database structure...
call pnpm db:migrate
if errorlevel 1 goto failed

echo.
echo   ==========================================
echo     DONE - now run start.cmd
echo   ==========================================
echo.
pause
exit /b 0

:failed
echo.
echo   ==========================================
echo     FAILED - send Ariel a screenshot
echo   ==========================================
echo.
pause
exit /b 1
