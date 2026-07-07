# Commit helper script for awesome list repositories
$repos = @(
    @{ Path = "C:/Users/frank/starlight/repos/awesome-agent-operating-systems"; Type = "os" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-agentic-income"; Type = "income" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-ai-coe"; Type = "coe" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-automation-agent-skills"; Type = "automation" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-cosmos-ai-agents"; Type = "cosmos" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-design-agent-skills"; Type = "design" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-gamification-agent-skills"; Type = "gamification" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-hermes-agents"; Type = "hermes" },
    @{ Path = "C:/Users/frank/awesome-hermes-agents"; Type = "hermes-root" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-investor-agent-skills"; Type = "investor" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-motion-design-agent-skills"; Type = "motion" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-sustainability-agent-skills"; Type = "sustainability" },
    @{ Path = "C:/Users/frank/starlight/repos/awesome-wealth-agent-skills"; Type = "wealth" },
    @{ Path = "C:/Users/frank/repos/awesome-suno-agent-skills"; Type = "suno" },
    @{ Path = "C:/Users/frank/mind-intelligence-swarm/awesome-mind-agent-skills"; Type = "mind" }
)

foreach ($repo in $repos) {
    $dir = $repo.Path
    if (-not (Test-Path $dir)) {
        Write-Host "Directory not found: $dir" -ForegroundColor Yellow
        continue
    }

    Write-Host "Processing repo: $dir" -ForegroundColor Cyan

    # Stage standard assets
    if (Test-Path "$dir/README.md") {
        git -C $dir add README.md
    }
    if (Test-Path "$dir/assets") {
        git -C $dir add "$dir/assets/*"
    }
    if (Test-Path "$dir/.gitignore") {
        git -C $dir add .gitignore
    }

    # Stage specific folders for hermes
    if ($repo.Type -match "hermes") {
        if (Test-Path "$dir/docs") {
            git -C $dir add "$dir/docs/*"
        }
        if (Test-Path "$dir/skills") {
            git -C $dir add "$dir/skills/*"
        }
    }

    # Stage specific folders for design, motion, mind
    if ($repo.Type -eq "design" -or $repo.Type -eq "motion" -or $repo.Type -eq "mind") {
        if (Test-Path "$dir/rankings") {
            git -C $dir add "$dir/rankings/*"
        }
        if (Test-Path "$dir/playbooks") {
            git -C $dir add "$dir/playbooks/*"
        }
        if (Test-Path "$dir/rubrics") {
            git -C $dir add "$dir/rubrics/*"
        }
        if (Test-Path "$dir/experiences") {
            git -C $dir add "$dir/experiences/*"
        }
        # Add design-specific lists
        if (Test-Path "$dir/RESOURCES-AGGREGATED.md") {
            git -C $dir add "$dir/RESOURCES-AGGREGATED.md"
        }
        if (Test-Path "$dir/RESOURCES-AGGREGATED-2026.md") {
            git -C $dir add "$dir/RESOURCES-AGGREGATED-2026.md"
        }
    }

    # Check if there are staged changes
    git -C $dir diff --cached --quiet
    $hasChanges = $LASTEXITCODE -ne 0

    if ($hasChanges) {
        Write-Host "Staged changes found, committing..." -ForegroundColor Green
        git -C $dir commit -m "docs: enrich curation lists, resolve broken links, and update visual assets"
    } else {
        Write-Host "No changes staged for commit." -ForegroundColor DarkGray
    }
    Write-Host ""
}
