<#
.SYNOPSIS
  Stages a daily Windows scheduled task that runs the studio sweep. Prints what it would
  register; registers only with -Register.

.DESCRIPTION
  Starlight rule: scheduled work is off until the operator turns it on. This script exists so
  turning it on is one deliberate command, not a hand-built task. The task writes a board, the
  machine scores and a heartbeat whose status is derived from what the run produced, so the
  job is never the only witness to its own health.

.EXAMPLE
  pwsh -File Register-StudioSweep.ps1                      # dry run: shows the task
  pwsh -File Register-StudioSweep.ps1 -Register            # registers it
  pwsh -File Register-StudioSweep.ps1 -Unregister          # removes it
#>
param(
  [string]$Targets = 'C:\Users\frank\starlight\graph\properties.graph.json',
  [string]$OutDir = 'C:\Users\frank\starlight\logs\excellence\sweeps',
  [string]$Heartbeat = 'C:\Users\frank\starlight\logs\heartbeats\heartbeat-studio-sweep.json',
  [string]$At = '07:10',
  [string]$TaskName = 'StarlightStudioSweep',
  [switch]$Register,
  [switch]$Unregister
)
$ErrorActionPreference = 'Stop'

if ($Unregister) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  "Removed $TaskName."
  return
}

$sweep = Join-Path $PSScriptRoot '..\bin\studio-sweep.mjs' | Resolve-Path
$node = (Get-Command node -CommandType Application).Source
foreach ($path in @($Targets)) {
  if (-not (Test-Path $path)) { throw "Targets file not found: $path" }
}

$arguments = "`"$sweep`" --targets `"$Targets`" --out `"$OutDir`" --heartbeat `"$Heartbeat`""
$action = New-ScheduledTaskAction -Execute $node -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -StartWhenAvailable -DontStopIfGoingOnBatteries

"Task:      $TaskName"
"Runs:      daily at $At, 15-minute limit"
"Command:   $node $arguments"
"Heartbeat: $Heartbeat (status ok, degraded or failed from the run's own output)"

if (-not $Register) {
  ''
  'Dry run. Nothing was registered. Re-run with -Register to turn it on.'
  return
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Starlight Web Studio: model-free sweep of every live property; board and heartbeat under logs/.' | Out-Null
"Registered $TaskName."
