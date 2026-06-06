# Script to synchronize version information across the project
# Source of truth: /VERSION

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$versionFile = Join-Path $repoRoot "VERSION"

if (-not (Test-Path $versionFile)) {
    Write-Error "Root VERSION file not found at $versionFile"
    exit 1
}

$version = (Get-Content $versionFile).Trim()
Write-Host "Synchronizing version: $version" -ForegroundColor Cyan

# 1. Sync to platform/apps/web/VERSION
$webVersionFile = Join-Path $repoRoot "platform/apps/web/VERSION"
$version | Set-Content $webVersionFile -Encoding UTF8
Write-Host "Updated $webVersionFile"

# 2. Sync to platform/apps/web/package.json
$packageJsonFile = Join-Path $repoRoot "platform/apps/web/package.json"
if (Test-Path $packageJsonFile) {
    $content = Get-Content $packageJsonFile -Raw | ConvertFrom-Json
    if ($content.version -ne $version) {
        $content.version = $version
        $content | ConvertTo-Json -Depth 10 | Set-Content $packageJsonFile -Encoding UTF8
        Write-Host "Updated $packageJsonFile"
    }
}

# 3. Sync to platform/apps/web/src/lib/version.ts (Fallback string)
$versionTsFile = Join-Path $repoRoot "platform/apps/web/src/lib/version.ts"
if (Test-Path $versionTsFile) {
    $tsContent = Get-Content $versionTsFile -Raw
    $newTsContent = $tsContent -replace 'return ".*"; // Final fallback', "return `"$version`"; // Final fallback"
    if ($tsContent -ne $newTsContent) {
        $newTsContent | Set-Content $versionTsFile -Encoding UTF8
        Write-Host "Updated $versionTsFile"
    }
}

Write-Host "Version synchronization complete." -ForegroundColor Green
