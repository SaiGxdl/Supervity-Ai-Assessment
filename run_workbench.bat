@echo off
echo ===================================================
echo   Real-Time Exception Resolution Workbench Launcher
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Workbench Backend API" cmd /k "cd /d %~dp0backend && python run.py"

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173 ...
start "Workbench Frontend Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Server processes launched successfully!
echo - Backend API:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo - Dashboard UI: http://127.0.0.1:5173/
echo.
pause
