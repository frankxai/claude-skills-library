# Update All Repositories Master Orchestrator
Write-Host "==========================================" -ForegroundColor Green
Write-Host "STARTING ENTERPRISE REPOSITORY MAINTENANCE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$scriptsDir = "C:\Users\frank\starlight\repos\claude-skills-library\scripts"

# Step 1: Run Link Checker Sweep
Write-Host "`n[STEP 1/4] Running link health audits..." -ForegroundColor Cyan
node "$scriptsDir\link-checker.mjs"

# Step 2: Validate Custom Skills Library
Write-Host "`n[STEP 2/4] Validating skills schema & security rules..." -ForegroundColor Cyan
node "$scriptsDir\validate-skills.mjs"

# Step 3: Align workspaces and run local commit sweep
Write-Host "`n[STEP 3/4] Aligning workspace files and creating Git commits..." -ForegroundColor Cyan
powershell -File "$scriptsDir\commit-repos.ps1"

# Step 4: Push to Upstream Remotes
Write-Host "`n[STEP 4/4] Pushing changes to GitHub remotes..." -ForegroundColor Cyan
$repos = @(
    "C:/Users/frank/starlight/repos/awesome-agent-operating-systems",
    "C:/Users/frank/starlight/repos/awesome-agentic-income",
    "C:/Users/frank/starlight/repos/awesome-ai-coe",
    "C:/Users/frank/starlight/repos/awesome-automation-agent-skills",
    "C:/Users/frank/starlight/repos/awesome-cosmos-ai-agents",
    "C:/Users/frank/starlight/repos/awesome-design-agent-skills",
    "C:/Users/frank/starlight/repos/awesome-gamification-agent-skills",
    "C:/Users/frank/starlight/repos/awesome-hermes-agents",
    "C:/Users/frank/awesome-hermes-agents",
    "C:/Users/frank/starlight/repos/awesome-investor-agent-skills",
    "C:/Users/frank/starlight/repos/awesome-motion-design-agent-skills",
    "C:/Users/frank/starlight/repos/awesome-sustainability-agent-skills",
    "C:/Users/frank/starlight/repos/awesome-wealth-agent-skills",
    "C:/Users/frank/repos/awesome-suno-agent-skills",
    "C:/Users/frank/mind-intelligence-swarm/awesome-mind-agent-skills"
)

foreach ($dir in $repos) {
    if (Test-Path $dir) {
        # Check if remote exists
        $hasRemote = git -C $dir remote
        if ($hasRemote) {
            Write-Host "Pushing $dir to GitHub remote..." -ForegroundColor Green
            # Redirect stderr to stdout so we can capture git output clearly
            git -C $dir push origin main 2>&1
        } else {
            Write-Host "No remote configured for $dir - skipping push." -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "REPOSITORY MAINTENANCE RUN COMPLETED" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
