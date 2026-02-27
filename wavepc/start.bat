@echo off
REM ──────────────────────────────────────────
REM  Wavelength — Quick Start Script
REM  Runs both backend and frontend
REM ──────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      Wavelength — Starting Up        ║
echo  ╚══════════════════════════════════════╝
echo.

REM Activate venv
call .venv\Scripts\activate

REM Start backend in background
echo [1/2] Starting FastAPI backend on port 8000...
start "Wavelength Backend" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo [2/2] Starting Next.js frontend on port 3000...
start "Wavelength Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo  ✓ Backend:  http://localhost:8000
echo  ✓ Frontend: http://localhost:3000
echo  ✓ API Docs: http://localhost:8000/docs
echo.
echo  Press any key to exit this window...
pause > nul
