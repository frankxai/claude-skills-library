<#
.SYNOPSIS
  Stages the daily StarlightTokenDigest scheduled task. Registered DISABLED unless -Enable is passed.

.DESCRIPTION
  Crons on this estate are off until Frank approves (AGENTS.md section 5). Agents stage this file;
  a human runs it. The task runs turn0-digest.mjs once a day at 06:10 local, which appends one row to
  starlight/logs/token-digest.jsonl, rewrites logs/digests/token-digest.md and writes
  logs/heartbeats/heartbeat-token-digest.json.

  pwsh is resolved to its full path because a Scheduled Task running under S4U cannot see the
  Microsoft Store app-execution alias.

.EXAMPLE
  pwsh -File Register-StarlightTokenDigest.ps1            # registers disabled
  pwsh -File Register-StarlightTokenDigest.ps1 -Enable    # registers enabled
#>
[CmdletBinding()]
param(
  [string]$Starlight = 'C:\Users\frank\starlight',
  [string]$Script = (Join-Path $PSScriptRoot 'turn0-digest.mjs'),
  [string]$At = '06:10',
  [switch]$Enable
)

$ErrorActionPreference = 'Stop'
$taskName = 'StarlightTokenDigest'

$node = (Get-Command node.exe -ErrorAction Stop).Source
if (-not (Test-Path $Script)) { throw "digest script not found: $Script" }
if (-not (Test-Path $Starlight)) { throw "starlight root not found: $Starlight" }

$action = New-ScheduledTaskAction -Execute $node -Argument "`"$Script`" --starlight `"$Starlight`"" -WorkingDirectory $Starlight
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -StartWhenAvailable -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
if (-not $Enable) { Disable-ScheduledTask -TaskName $taskName | Out-Null }

$state = (Get-ScheduledTask -TaskName $taskName).State
Write-Host "$taskName registered ($state). Heartbeat: $Starlight\logs\heartbeats\heartbeat-token-digest.json"
