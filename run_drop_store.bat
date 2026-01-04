@echo off
title DROP Store Server
color 0f
cls
echo ===================================================
echo             DROP STORE - HOSTING SETUP
echo ===================================================
echo.
echo [1/2] Starting Local Server...
start /min cmd /k "cd backend && node server.js"
echo.
echo Server started in background. Waiting 5 seconds...
timeout /t 5 >nul
echo.
echo [2/2] initializing Public Access...
echo.
echo ===================================================
echo IMPORTANT: SECURITY CHECK
echo ===================================================
echo If the website asks for a "Tunnel Password", enter this IP:
echo.
call cmd /c "curl -s https://loca.lt/mytunnelpassword"
echo.
echo.
echo Copy the IP above.
echo.
echo Launching Tunnel...
echo.
call cmd /c "npx -y localtunnel --port 5000"
pause
