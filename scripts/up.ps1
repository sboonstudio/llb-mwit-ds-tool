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
Write-Host ">>> Phase 1: Checking environment..." -ForegroundColor Yellow

# --- Integrated Sync Logic ---
$repoRootPath = $repoRoot.Replace('\', '/')
$targetFile = Join-Path $repoRoot ".env"

# Always start from .env.example if .env doesn't exist
if (-not (Test-Path $targetFile)) {
    if (Test-Path (Join-Path $repoRoot ".env.example")) {
        Copy-Item (Join-Path $repoRoot ".env.example") $targetFile
        Write-Host "Created .env from .env.example"
    } else {
        New-Item -ItemType File -Path $targetFile -Force | Out-Null
        Write-Host "Created empty .env"
    }
}

# Read content and perform dynamic replacement
$envLines = Get-Content -Path $targetFile -Encoding UTF8
$updatedLines = @()
$keysToEnsure = @{
    "LLBRIDGE_PROJECT_ROOT" = $repoRootPath
    "JUPYTERHUB_HOST_WORKSPACES" = "$repoRootPath/infrastructure/data/lab-workspaces"
    "JUPYTERHUB_HOST_SHARED_CONTENT" = "$repoRootPath/infrastructure/content/sample-notebooks"
    "JUPYTERHUB_HOST_SINGLEUSER_CONFIG" = "$repoRootPath/infrastructure/lab/jupyterlab/singleuser-config"
    "LLBRIDGE_HOST_LOGGING" = "$repoRootPath/infrastructure/data/logging"
}
$seenKeys = @()

foreach ($line in $envLines) {
    $processedLine = $line -replace '<clone-root>', $repoRootPath
    if ($processedLine -match "^([^=]+)=(.*)$") {
        $key = $Matches[1]
        if ($keysToEnsure.ContainsKey($key)) {
            $updatedLines += "$key=$($keysToEnsure[$key])"
            $seenKeys += $key
        } else {
            $updatedLines += $processedLine
        }
    } else {
        $updatedLines += $processedLine
    }
}

# Append missing essential keys
foreach ($key in $keysToEnsure.Keys) {
    if ($key -notin $seenKeys) {
        $updatedLines += "$key=$($keysToEnsure[$key])"
    }
}

Set-Content -LiteralPath $targetFile -Value $updatedLines -Encoding UTF8
Write-Host "Successfully synced environment paths to: $repoRootPath"

# Create necessary data directories if they don't exist
$dataDirs = @(
    "$repoRoot/infrastructure/data/nextjs",
    "$repoRoot/infrastructure/data/jupyterhub",
    "$repoRoot/infrastructure/data/lab-workspaces",
    "$repoRoot/infrastructure/data/logging"
)

foreach ($dir in $dataDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Gray
    }
}

# Sync VERSION information across the project
$syncVersionScript = Join-Path $PSScriptRoot "sync-version.ps1"
if (Test-Path $syncVersionScript) {
    & $syncVersionScript
}

# -----------------------------

# Determine Docker Arguments and Local Mode
$dockerArgs = @()
$isLocal = $false

foreach ($arg in $args) {
    if ($arg -eq "--local") {
        $isLocal = $true
    } else {
        $dockerArgs += $arg
    }
}

if ($dockerArgs.Count -eq 0) {
    $dockerArgs = @("-d", "--build")
}

$isDetached = $dockerArgs -contains "-d"

if ($isLocal) {
    Write-Host ">>> Mode: Localhost Only (No Cloudflare)" -ForegroundColor Cyan
    # Reset URLs to localhost in .env
    $envLines = Get-Content .env
    $envLines = $envLines | Where-Object { 
        $_ -notmatch "^LLBRIDGE_PUBLIC_URL=" -and 
        $_ -notmatch "^LLBRIDGE_PUBLIC_BASE_URL=" -and 
        $_ -notmatch "^JUPYTERHUB_BASE_URL=" -and
        $_ -notmatch "^AUTH_URL=" -and
        $_ -notmatch "^NEXTAUTH_URL="
    }
    $envLines += "LLBRIDGE_PUBLIC_URL=http://localhost:3000"
    $envLines += "LLBRIDGE_PUBLIC_BASE_URL=http://localhost:3000"
    $envLines += "JUPYTERHUB_BASE_URL=http://localhost:8000"
    $envLines += "AUTH_URL=http://localhost:3000"
    $envLines += "NEXTAUTH_URL=http://localhost:3000"
    Set-Content .env -Value $envLines -Encoding UTF8
}

Write-Host "`n>>> Phase 2: Starting Docker containers (Args: $dockerArgs)..." -ForegroundColor Yellow
if ($isLocal) {
    # Exclude tunnel service in local mode, but include log collector
    docker compose --env-file .env -f docker-compose.yml up $dockerArgs llbridge-web llbridge-hub llbridge-proxy llbridge-log-collector
} else {
    docker compose --env-file .env -f docker-compose.yml up $dockerArgs
}

if ($isDetached) {
    # Phase 3: Auto-Admin Provisioning
    Write-Host "`n>>> Phase 3: Auto-Admin Provisioning..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    $envContent = Get-Content .env -ErrorAction SilentlyContinue
    
    $adminEmail = "admin@sboon.org"
    $adminPass = "admin543"

    if ($envContent) {
        $emailMatch = $envContent | Select-String "^INITIAL_ADMIN_EMAIL=(.+)$"
        if ($emailMatch) { $adminEmail = $emailMatch.Matches.Groups[1].Value.Trim() }
        
        $passMatch = $envContent | Select-String "^INITIAL_ADMIN_PASSWORD=(.+)$"
        if ($passMatch) { $adminPass = $passMatch.Matches.Groups[1].Value.Trim() }
    }
    
    Write-Host ">>> Initializing admin: $adminEmail"
    docker compose exec -T llbridge-web node scripts/create-admin.mjs "$adminEmail" "$adminPass" --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host ">>> Warning: Admin auto-provisioning skipped or failed." -ForegroundColor Gray
    }

    Write-Host "`n>>> Success! System is starting up." -ForegroundColor Green
    
    if (-not $isLocal) {
        # Extract Quick Tunnel URL
        Write-Host ">>> Searching for Cloudflare Quick Tunnel URL..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
        $tunnelLog = docker compose logs llbridge-tunnel 2>&1 | Out-String
        if ($tunnelLog -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $quickUrl = $Matches[0]
            Write-Host ">>> Quick Tunnel URL: $quickUrl" -ForegroundColor Cyan
            
            # Update .env with the new public URL so JupyterHub and Web know about it
            Write-Host ">>> Updating .env with public URL..." -ForegroundColor Yellow
            $envContent = Get-Content .env
            $envContent = $envContent | Where-Object { 
                $_ -notmatch "^LLBRIDGE_PUBLIC_URL=" -and 
                $_ -notmatch "^LLBRIDGE_PUBLIC_BASE_URL=" -and 
                $_ -notmatch "^JUPYTERHUB_BASE_URL=" -and
                $_ -notmatch "^AUTH_URL=" -and
                $_ -notmatch "^NEXTAUTH_URL="
            }
            $envContent += "LLBRIDGE_PUBLIC_URL=$quickUrl"
            $envContent += "LLBRIDGE_PUBLIC_BASE_URL=$quickUrl"
            $envContent += "JUPYTERHUB_BASE_URL=$quickUrl"
            $envContent += "AUTH_URL=$quickUrl"
            $envContent += "NEXTAUTH_URL=$quickUrl"
            Set-Content .env -Value $envContent -Encoding UTF8

            Write-Host ">>> Restarting Web and Hub to apply new URL..." -ForegroundColor Yellow
            docker compose up -d llbridge-web llbridge-hub
        }
    }

    Write-Host "`n>>> Access Points:"
    Write-Host "  - Local Web:    http://localhost:3000"
    Write-Host "  - Local Hub:    http://localhost:8000"
    if ($quickUrl) {
        Write-Host "  - Public Access: $quickUrl" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n>>> System stopped (Attached mode finished)." -ForegroundColor Yellow
}
Write-Host ""
