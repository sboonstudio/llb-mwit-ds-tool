# สคริปต์สำหรับการซิงค์โค้ดจากโครงการหลักไปยังพื้นที่ Public Export อย่างปลอดภัย
# ฉบับปรับปรุง: เพิ่มระบบกู้คืน Worktree อัตโนมัติ (Self-healing) และแก้ปัญหา Encoding
# การใช้งาน: ./scripts/sync-to-public.ps1

# บังคับให้ใช้ UTF8 สำหรับการประมวลผลภายในคอนโซล
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# กำหนดเส้นทางแบบ Absolute
$ScriptPath = $MyInvocation.MyCommand.Path
$ScriptDir = Split-Path -Parent $ScriptPath
$MainRepoPath = Split-Path -Parent $ScriptDir
$ExportPath = Join-Path (Split-Path -Parent $MainRepoPath) "learnlab-bridge-export"
$IgnoreFile = Join-Path $MainRepoPath ".public-ignore"
$TemplateFile = Join-Path $ScriptDir "PUBLIC_README_TEMPLATE.md"
$PublicBranch = "public/export-mwit-ds"

Write-Host "--- Starting Public Export Synchronization ---" -ForegroundColor Cyan

# 1. ตรวจสอบและสร้างโฟลเดอร์ Worktree อัตโนมัติหากไม่พบ
if (-not (Test-Path $ExportPath)) {
    Write-Host "[0/4] Export directory not found. Re-initializing Git Worktree..." -ForegroundColor Yellow
    Set-Location $MainRepoPath
    
    # ตรวจสอบว่า Branch มีอยู่หรือไม่ หากไม่มีให้สร้างจาก main
    $branchExists = git branch --list $PublicBranch
    if (-not $branchExists) {
        Write-Host "Creating branch $PublicBranch from main..."
        git branch $PublicBranch main
    }
    
    # เพิ่ม Worktree ใหม่ (ใช้ -f เพื่อบังคับสร้างหากมีการลงทะเบียนค้างไว้แต่โฟลเดอร์หาย)
    Write-Host "Adding worktree at $ExportPath..."
    git worktree add -f $ExportPath $PublicBranch
    
    if (-not $?) {
        Write-Error "Failed to initialize worktree. Please check if the path is locked or already in use."
        exit
    }
}

if (-not (Test-Path $TemplateFile)) { Write-Error "Template file not found at $TemplateFile"; exit }

# 2. ทำการ Merge โค้ดล่าสุดในพื้นที่ Export
Write-Host "[1/4] Merging latest stable code from 'main' into export branch..." -ForegroundColor Yellow
Set-Location $ExportPath
git checkout $PublicBranch
git merge main --no-edit

# บังคับกู้คืนไฟล์ .env.example และตัวอย่างที่จำเป็น (กรณีเคยถูกลบไปก่อนหน้าใน Branch นี้)
Write-Host "Restoring essential template files from main..." -ForegroundColor Gray
git checkout main -- .env.example 2>$null
git checkout main -- security/secrets/*.example 2>$null

# 3. ลบไฟล์ตาม .public-ignore และลบไฟล์ .md ใน root (เพื่อความปลอดภัย)
Write-Host "[2/4] Scrubbing internal data from export folder..." -ForegroundColor Yellow
if (Test-Path $IgnoreFile) {
    $IgnoreLines = Get-Content $IgnoreFile | Where-Object { $_ -and -not $_.StartsWith("#") }
    $ExcludePatterns = $IgnoreLines | Where-Object { -not $_.StartsWith("!") }
    $IncludePatterns = $IgnoreLines | Where-Object { $_.StartsWith("!") } | ForEach-Object { $_.TrimStart("!") }

    foreach ($pattern in $ExcludePatterns) {
        # ค้นหาไฟล์ที่ตรงกับ Pattern
        $items = Get-ChildItem -Path $ExportPath -Filter $pattern -Recurse -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            # ตรวจสอบว่าไฟล์นี้อยู่ในรายการข้อยกเว้น (!) หรือไม่
            $shouldKeep = $false
            foreach ($inc in $IncludePatterns) {
                if ($item.Name -like $inc -or $item.FullName -replace '\\','/' -like "*$inc*") {
                    $shouldKeep = $true
                    break
                }
            }

            if (-not $shouldKeep -and (Test-Path $item.FullName)) {
                Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
# ล้างไฟล์ Markdown เดิมที่ติดมาจาก main (ยกเว้น README ที่จะสร้างใหม่)
Get-ChildItem -Path $ExportPath -Filter "*.md" | Remove-Item -Force -ErrorAction SilentlyContinue

# 4. สร้าง README.md ใหม่โดยการก๊อปปี้ Byte (รักษา Encoding 100%)
Write-Host "[3/4] Generating Public README.md using Raw Byte Stream..." -ForegroundColor Yellow
$Bytes = [System.IO.File]::ReadAllBytes($TemplateFile)
[System.IO.File]::WriteAllBytes((Join-Path $ExportPath "README.md"), $Bytes)

# 5. สรุปผล
Write-Host "[4/4] Synchronization complete." -ForegroundColor Yellow
git status
Set-Location $MainRepoPath
