@echo off
rem  Frees port 3000 if a previous Samuel window is still holding it.
rem  Closing the window with the X leaves node running, and the next
rem  start silently lands on port 3001 - so the browser keeps showing
rem  the old version and nothing looks wrong.
setlocal enabledelayedexpansion

set "HELDBY="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do set "HELDBY=%%p"

if not defined HELDBY exit /b 0

echo.
echo   Port 3000 is already in use by process !HELDBY!.
echo   That is almost certainly a Samuel window closed without Ctrl+C.
echo.
choice /c YN /n /m "   Stop it and continue?  [Y/N] "
if errorlevel 2 (
  echo.
  echo   Left it running. Nothing was started.
  exit /b 1
)

taskkill /PID !HELDBY! /F >nul 2>&1
rem  Windows releases the socket a moment after the process dies.
ping -n 3 127.0.0.1 >nul
echo   Stopped.
exit /b 0
