$ErrorActionPreference = "Stop"

# Get the directory of the script and then the repo root (one level up)
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
# Use forward slashes for Docker compatibility on Windows
$repoRootPath = $repoRoot.Replace('\', '/')
$targetFile = Join-Path $repoRoot ".env"

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "docker-compose.yml"))) {
  throw "Repository root not found or invalid (docker-compose.yml missing): $repoRoot"
}

# Always start from .env.example or existing .env to ensure we can re-sync
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
$content = Get-Content -Raw -Path $targetFile -Encoding UTF8

# 1. Replace all <clone-root> placeholders
$updatedContent = $content -replace '<clone-root>', $repoRootPath

# 2. Force update LLBRIDGE_PROJECT_ROOT and other host paths to current location
$updatedContent = $updatedContent -replace "LLBRIDGE_PROJECT_ROOT=.*", "LLBRIDGE_PROJECT_ROOT=$repoRootPath"
$updatedContent = $updatedContent -replace "JUPYTERHUB_HOST_WORKSPACES=.*", "JUPYTERHUB_HOST_WORKSPACES=$repoRootPath/infrastructure/data/lab-workspaces"
$updatedContent = $updatedContent -replace "JUPYTERHUB_HOST_SHARED_CONTENT=.*", "JUPYTERHUB_HOST_SHARED_CONTENT=$repoRootPath/infrastructure/content/sample-notebooks"
$updatedContent = $updatedContent -replace "JUPYTERHUB_HOST_SINGLEUSER_CONFIG=.*", "JUPYTERHUB_HOST_SINGLEUSER_CONFIG=$repoRootPath/infrastructure/lab/jupyterlab/singleuser-config"

Set-Content -LiteralPath $targetFile -Value $updatedContent -Encoding UTF8
Write-Host "Successfully synced environment paths to: $repoRootPath"
