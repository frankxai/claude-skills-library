---
name: memory-prune
description: Manual reviewable prune of stale memory entries. Lists project_* entries older than 30 days with content preview; Frank decides per-entry [keep | archive | pin]. Keeps MEMORY.md under the auto-load 200-line truncation. Use when MEMORY.md exceeds 180 lines or session-end after a heavy work week.
---

# Memory Prune — assisted, never autonomous

The memory system at `~/.claude/projects/C--Users-frank-Arcanea/memory/` accumulates ~2-3 entries/day. Once `MEMORY.md` exceeds ~200 lines the auto-loader truncates it and entries silently disappear from future-session context. This skill prevents that without auto-deleting things that might still matter.

## Philosophy

- **Never auto-delete.** Auto-decay is silent and corrupts the wisdom layer of memory.
- **Bias toward keeping `feedback`, `decision`, `reference`, `user`** — these are durable.
- **Bias toward pruning `project_*`** — these are session snapshots; old ones rarely re-load.
- **Always show content before deciding.** A 30-day-old project entry might be the one foundational decision you keep needing.

## How it works

1. Walks `~/.claude/projects/C--Users-frank-Arcanea/memory/` for `.md` files
2. Filters to `project_*.md` last-modified > N days ago (default 30)
3. For each candidate prints:
   - Filename + age in days
   - First 200 chars of body
   - Recommended action based on heuristics (see below)
4. Prompts Frank: `[k]eep | [a]rchive | [p]in | [s]kip`
5. Executes:
   - **archive** → move to `memory/archive/YYYY-MM/`, remove from `MEMORY.md`
   - **pin** → rename to `<original>_pinned.md`, ensure indexed in `MEMORY.md`
   - **keep** → no change (will resurface next prune)
   - **skip** → no change, no resurface this session

## Heuristic recommendations

| Pattern | Recommendation |
|---|---|
| `project_*_session_*.md` (session log) | archive — these are ephemeral by nature |
| `project_pp_audit_*.md` (PP audits) | archive after 60 days |
| `project_*_strategy.md` (strategy docs) | keep or pin — usually evergreen |
| `project_overnight_*.md` | archive — overnight session snapshots |
| `project_mega_session_*.md` | archive — date-bound sessions |
| `project_*_2026_03_*` | archive after 90 days |
| Any with content > 4 KB explaining a decision rationale | suggest pin |

## Invocation

Run via PowerShell in Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE/.claude/skills/memory-prune/prune.ps1"
```

Or set up an alias in your shell:

```powershell
function prune-memory { & "$env:USERPROFILE/.claude/skills/memory-prune/prune.ps1" }
```

## What this skill does NOT do

- Does NOT delete files outright (only moves to archive/)
- Does NOT touch `feedback_*`, `decision_*`, `reference_*`, `user_*`
- Does NOT modify entries you skip
- Does NOT auto-trigger; only runs on explicit invocation

## Cadence recommendation

Run **once per month** or whenever `MEMORY.md` exceeds 180 lines (check via `wc -l MEMORY.md`).

## Decay-when

This skill itself decays only if memory architecture migrates (e.g., to a vector DB). At that point rebuild against the new substrate.
