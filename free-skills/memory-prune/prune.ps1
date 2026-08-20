# Memory Prune — assisted, reviewable
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/skills/memory-prune/prune.ps1

param(
  [int]$AgeDays = 30,
  [switch]$DryRun = $false
)

$memDir = "$env:USERPROFILE/.claude/projects/C--Users-frank-Arcanea/memory"
$indexPath = "$memDir/MEMORY.md"
$archiveBase = "$memDir/archive"

if (-not (Test-Path $memDir)) {
  Write-Host "Memory dir not found: $memDir" -ForegroundColor Red
  exit 1
}

# Identify candidates: project_* older than N days
$cutoff = (Get-Date).AddDays(-$AgeDays)
$candidates = Get-ChildItem $memDir -File -Filter 'project_*.md' -ErrorAction SilentlyContinue |
              Where-Object { $_.LastWriteTime -lt $cutoff } |
              Sort-Object LastWriteTime

Write-Host ""
Write-Host "=== Memory Prune Candidates ===" -ForegroundColor Cyan
Write-Host "Threshold: project_* entries older than $AgeDays days"
Write-Host "Total candidates: $($candidates.Count)"
Write-Host ""

if ($candidates.Count -eq 0) {
  Write-Host "Nothing to prune. Memory is fresh." -ForegroundColor Green
  exit 0
}

# Live counters
$archived = 0
$pinned = 0
$kept = 0
$skipped = 0

# Heuristic recommendation function
function Get-Recommendation {
  param($file)
  $name = $file.BaseName
  $ageDays = [int]((Get-Date) - $file.LastWriteTime).TotalDays
  $size = $file.Length

  if ($name -match 'session|overnight|mega_session|pp_audit') { return 'archive' }
  if ($ageDays -gt 90) { return 'archive' }
  if ($size -gt 4096) { return 'pin' }
  return 'keep'
}

# Process each candidate
$i = 0
foreach ($file in $candidates) {
  $i++
  $ageDays = [int]((Get-Date) - $file.LastWriteTime).TotalDays
  $rec = Get-Recommendation -file $file

  Write-Host ""
  Write-Host "[$i/$($candidates.Count)] $($file.Name)" -ForegroundColor Yellow
  Write-Host "  Age: $ageDays days | Size: $($file.Length) bytes | Recommended: $rec" -ForegroundColor Gray

  # Show preview (first ~200 chars after frontmatter)
  $content = Get-Content $file.FullName -Raw
  $body = if ($content -match '(?s)^---.*?---\s*(.*)') { $matches[1] } else { $content }
  $preview = $body.Substring(0, [Math]::Min(250, $body.Length)).Replace("`n", " ").Trim()
  Write-Host "  Preview: $preview..." -ForegroundColor DarkGray

  if ($DryRun) {
    Write-Host "  [DRY RUN] would suggest: $rec" -ForegroundColor Magenta
    continue
  }

  # Prompt
  Write-Host -NoNewline "  Action [k=keep | a=archive | p=pin | s=skip | q=quit]? " -ForegroundColor Cyan
  $choice = Read-Host

  switch -Regex ($choice.ToLower()) {
    '^a' {
      # Archive: move to memory/archive/YYYY-MM/
      $monthDir = Join-Path $archiveBase $file.LastWriteTime.ToString('yyyy-MM')
      if (-not (Test-Path $monthDir)) { New-Item -ItemType Directory -Force -Path $monthDir | Out-Null }
      $destPath = Join-Path $monthDir $file.Name
      Move-Item -Path $file.FullName -Destination $destPath -Force
      Write-Host "  -> archived to memory/archive/$($file.LastWriteTime.ToString('yyyy-MM'))/" -ForegroundColor Green
      $archived++
    }
    '^p' {
      # Pin: rename with _pinned suffix
      $newName = $file.Name -replace '\.md$', '_pinned.md'
      $newPath = Join-Path $file.DirectoryName $newName
      Rename-Item -Path $file.FullName -NewName $newName
      Write-Host "  -> pinned: $newName" -ForegroundColor Green
      $pinned++
    }
    '^q' {
      Write-Host "  -> quitting prune session" -ForegroundColor Yellow
      break
    }
    '^s' {
      Write-Host "  -> skipped (will resurface next prune)" -ForegroundColor Gray
      $skipped++
    }
    default {
      Write-Host "  -> kept (will resurface in $AgeDays days)" -ForegroundColor DarkGreen
      $kept++
    }
  }
}

# Summary
Write-Host ""
Write-Host "=== Prune Summary ===" -ForegroundColor Cyan
"  archived: $archived"
"  pinned:   $pinned"
"  kept:     $kept"
"  skipped:  $skipped"
Write-Host ""

# Reconcile MEMORY.md against disk
Write-Host "=== Reconciling MEMORY.md ==="
$indexLines = Get-Content $indexPath
$indexed = $indexLines | Select-String -Pattern '\[([^\]]+\.md)\]\(' | ForEach-Object {
  if ($_.Line -match '\[([^\]]+\.md)\]\(') { $matches[1] }
}
$disk = Get-ChildItem $memDir -File -Filter '*.md' | Where-Object { $_.Name -ne 'MEMORY.md' } | ForEach-Object { $_.Name }

$brokenInIndex = $indexed | Where-Object { $disk -notcontains $_ }
$onDiskMissingIndex = $disk | Where-Object { $indexed -notcontains $_ }

"  on disk: $($disk.Count)"
"  indexed: $($indexed.Count)"
"  archived (no longer in disk): $($brokenInIndex.Count)"
"  on disk but unindexed: $($onDiskMissingIndex.Count)"

if ($brokenInIndex.Count -gt 0) {
  Write-Host ""
  Write-Host "  MEMORY.md has $($brokenInIndex.Count) broken refs after prune." -ForegroundColor Yellow
  Write-Host "  Remove these lines manually, or run again to verify."
  $brokenInIndex | ForEach-Object { "    - $_" }
}

Write-Host ""
Write-Host "Prune complete." -ForegroundColor Green
