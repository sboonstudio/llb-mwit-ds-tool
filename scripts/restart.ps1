$ErrorActionPreference = "Stop"

Write-Host "`n>>> Restarting LearnLab Bridge..." -ForegroundColor Yellow

# Execute down then up
& "$PSScriptRoot\down.ps1"
& "$PSScriptRoot\up.ps1" @args
