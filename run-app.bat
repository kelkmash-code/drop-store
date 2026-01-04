@echo off
echo Starting Eldorado Order Management...

:: Start Backend
start cmd /k "cd backend && node server.js"

:: Start Frontend
start cmd /k "cd frontend && npm run dev"

echo App is starting.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
