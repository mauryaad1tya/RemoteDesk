# RemoteDesk One-Click PowerShell Launcher
Set-Location -Path $PSScriptRoot
$Host.UI.RawUI.WindowTitle = "RemoteDesk - Windows Management"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "              RemoteDesk System Launcher" -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Check .env
if (-not (Test-Path ".env")) {
    Write-Host "[INFO] Creating .env from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

# 3. Check Database
if (-not (Test-Path "services\api\data\remotedesk.db")) {
    Write-Host "[INFO] Seeding initial database..." -ForegroundColor Yellow
    npm run db:seed
}

Write-Host "[INFO] Launching API, Web, and Agent concurrently..." -ForegroundColor Green
Write-Host "[INFO] Opening http://localhost:5173..." -ForegroundColor Green
Write-Host "Press Ctrl+C to gracefully stop all services." -ForegroundColor DarkGray
Write-Host ""

# Open browser after 3 seconds in background job
Start-Job -ScriptBlock { Start-Sleep -Seconds 3; Start-Process "http://localhost:5173" } | Out-Null

# Run all 3 services together
npm run dev
