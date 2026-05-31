$ErrorActionPreference = "Stop"

# Set location to repo root
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location -Path $repoRoot

# Get Version
$version = "Unknown"
if (Test-Path "VERSION") {
    $version = Get-Content "VERSION"
}

Write-Host "`n>>> LearnLab Bridge - Version: $version" -ForegroundColor Cyan
Write-Host ">>> Stopping Docker containers..." -ForegroundColor Yellow

docker compose --env-file .env -f docker-compose.yml down

Write-Host "`n>>> System stopped successfully." -ForegroundColor Green
Write-Host ""
