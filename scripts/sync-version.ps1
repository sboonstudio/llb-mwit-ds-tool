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

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 1. Sync to platform/apps/web/VERSION
$webVersionFile = Join-Path $repoRoot "platform/apps/web/VERSION"
[System.IO.File]::WriteAllText($webVersionFile, $version, $Utf8NoBom)
Write-Host "Updated $webVersionFile"

# 2. Sync to platform/apps/web/package.json
$packageJsonFile = Join-Path $repoRoot "platform/apps/web/package.json"
if (Test-Path $packageJsonFile) {
    $content = Get-Content $packageJsonFile -Raw | ConvertFrom-Json
    if ($content.version -ne $version) {
        $content.version = $version
        $json = $content | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($packageJsonFile, $json, $Utf8NoBom)
        Write-Host "Updated $packageJsonFile"
    }
}

# 3. Sync to platform/apps/web/src/lib/version.ts (Fallback string)
$versionTsFile = Join-Path $repoRoot "platform/apps/web/src/lib/version.ts"
if (Test-Path $versionTsFile) {
    $tsContent = Get-Content $versionTsFile -Raw
    $newTsContent = $tsContent -replace 'return ".*"; // Final fallback', "return `"$version`"; // Final fallback"
    if ($tsContent -ne $newTsContent) {
        [System.IO.File]::WriteAllText($versionTsFile, $newTsContent, $Utf8NoBom)
        Write-Host "Updated $versionTsFile"
    }
}

Write-Host "Version synchronization complete." -ForegroundColor Green
