@echo off
setlocal
cd /d "%~dp0"

if not exist ".env.local" goto nosecret
findstr /b /c:"APP_SECRET=" ".env.local" >nul 2>&1
if errorlevel 1 goto nosecret

if not exist "%USERPROFILE%\.cloudflared\config.yml" goto notunnel

echo.
echo   [1/2] Building for production...
call pnpm build
if errorlevel 1 goto failed

echo.
echo   [2/2] Opening the tunnel in a second window...
start "Samuel tunnel" cmd /k cloudflared tunnel run samuel

echo.
echo   ==========================================
echo     LIVE - keep BOTH windows open.
echo     Closing either one takes the site down.
echo   ==========================================
echo.
call pnpm start

echo.
pause
exit /b 0

:nosecret
echo.
echo   APP_SECRET is not set - refusing to go public.
echo   Run this once:   pnpm setup:secret
echo.
pause
exit /b 1

:notunnel
echo.
echo   The tunnel is not set up yet.
echo   Run this once:   pnpm setup:tunnel shop.samuel-diamonds.io
echo.
pause
exit /b 1

:failed
echo.
echo   BUILD FAILED - send Ariel a screenshot
echo.
pause
exit /b 1
