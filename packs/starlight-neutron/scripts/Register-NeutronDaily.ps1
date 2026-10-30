# Stages a daily Windows scheduled task that runs `neutron.mjs daily`. Prints the plan and changes nothing
# unless -Apply is passed: scheduled tasks on this estate stay off until a human registers them.
#   pwsh -File Register-NeutronDaily.ps1 [-At 06:30] [-Heartbeat <path>] [-Apply]
param(
  [string]$At = '06:30',
  [string]$Heartbeat = (Join-Path $HOME 'starlight\logs\heartbeats\heartbeat-neutron-daily.json'),
  [string]$TaskName = 'StarlightNeutronDaily',
  [switch]$Apply
)
$ErrorActionPreference = 'Stop'

# The real node.exe, never a shim: a task launched without a profile does not see PATH shims or the Store
# alias, and version managers such as fnm hand out per-shell link folders that vanish when the shell exits.
$found = (Get-Command node -CommandType Application | Select-Object -First 1).Source
$node = & $found -p "require('fs').realpathSync(process.execPath)"
$script = Join-Path $PSScriptRoot 'neutron.mjs'
$arguments = "`"$script`" daily --days 14 --heartbeat `"$Heartbeat`""

Write-Host "Task:      $TaskName (daily at $At, as $env:USERNAME, only when logged on)"
Write-Host "Command:   $node $arguments"
Write-Host "Writes:    $(Join-Path $HOME '.starlight\neutron') (daily.jsonl, DAILY.md) and $Heartbeat"

if (-not $Apply) {
  Write-Host 'Dry run. Re-run with -Apply to register.'
  return
}

$action = New-ScheduledTaskAction -Execute $node -Argument $arguments -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $At
# Interactive logon: transcripts and ~/.starlight live in the user profile, and S4U tasks have broken
# profile-dependent launches here before.
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "Registered $TaskName."
