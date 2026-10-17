@echo off
setlocal enabledelayedexpansion

:: Set working directory to the script's location
cd /d "%~dp0"
title RemoteDesk - Windows Laptop Management

echo =========================================================
echo               RemoteDesk System Launcher
echo =========================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js LTS (v22+ or v24+) from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Check .env
if not exist ".env" (
    echo [INFO] .env file not found. Initializing from .env.example...
    copy .env.example .env >nul
    echo [INFO] Created .env.
)

:: 3. Check SQLite database
if not exist "services\api\data\remotedesk.db" (
    echo [INFO] Initializing SQLite database and admin account...
    call npm run db:seed
)

echo [INFO] Starting RemoteDesk Services:
echo        - Backend API on http://localhost:4000
echo        - Web Dashboard on http://localhost:5173
echo        - Windows Agent connected and monitoring
echo.
echo Press Ctrl+C in this terminal window to stop all services.
echo.

:: 4. Open dashboard in default browser after 3 seconds in the background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: 5. Launch all 3 services concurrently in this single terminal
call npm run dev

pause
