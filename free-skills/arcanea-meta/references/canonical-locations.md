# Canonical Locations — verified 2026-04-15

When two or more copies of the same thing exist, the canonical wins. Drift copies get `DEPRECATED_DELETE_AFTER_VERIFY.md` markers (Move 3 of meta-build).

## ACOS — 5 copies on disk

| Path | Status | Reason |
|---|---|---|
| `~/agentic-creator-os/` | **CANONICAL** | Has FRANK_DNA.md + agents/ + memory.db (irreplaceable state) |
| `~/.claude/acos/` | **ACTIVE INSTALL** | What the harness actually invokes (runtime) |
| `~/Arcanea/agentic/agentic-creator-os/` | DRIFT | Monorepo copy, no unique state |
| `~/Arcanea/intelligence/acos-intelligence-system/` | ARCHIVED | Own README declares it archived (Feb 2026) |
| `~/claude-code-config/agentic-creator-os/` | DRIFT | Config dump copy |
| `~/FrankX/.claude-skills/projects/agentic-creator-os/` | DRIFT | Old projects scratch |

**Archival plan (Move 3):** add `DEPRECATED_DELETE_AFTER_VERIFY.md` to all 4 drift/archived copies pointing to `~/agentic-creator-os/`. Do NOT delete this session — wait 30 days, verify nothing breaks, then `rm -rf`.

## Hooks — 3 registries

| Path | Scope | When to use |
|---|---|---|
| `~/.claude/hooks/` | global (user) | Reusable across all repos |
| `~/.claude/acos/hooks/` | ACOS install | ACOS-specific lifecycle |
| `~/Arcanea/.claude/hooks/` | project | Arcanea-specific automation |

**Rule:** if a hook is Arcanea-specific (uses paths under ~/Arcanea), put project. If reusable (e.g., session-logger), put global. Currently `skill-activation-prompt.sh` exists in 3 places — divergence audit needed.

## Skills — multi-scope

| Path | Scope |
|---|---|
| `~/.claude/skills/` | global |
| `~/Arcanea/.claude/skills/` | project (Arcanea) |
| `~/.claude/plugins/cache/<plugin>/<ver>/skills/` | plugin (read-only) |

Avoid duplication. If a skill is genuinely cross-repo, global; otherwise project.

## Memory

| Path | Status |
|---|---|
| `~/.claude/projects/C--Users-frank-Arcanea/memory/` | **CANONICAL** for Arcanea project |

**Other memory locations are scratch.** Auto-loaded via MEMORY.md every turn.

## Source clones (for absorption)

| Path | Purpose |
|---|---|
| `~/sources/` | Pre-integration staging for absorbed repos |

Created 2026-04-15 as part of absorption contract. First entry: `~/sources/claude-flow/` (Move 4).

## Plugins

| Path | Purpose |
|---|---|
| `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` | Read-only plugin install |
| `~/.claude/plugins/installed_plugins.json` | Registry of what's installed |
| `~/.claude/plugins/marketplaces/` | Cloned marketplace metadata |

Never edit plugin cache directly — re-install.

## When canonical conflicts

If two paths both claim canonical:
1. Read both.
2. The one with unique state (memory.db, secrets, generated artifacts) wins.
3. The other becomes DRIFT.
4. Mark immediately with `DEPRECATED_DELETE_AFTER_VERIFY.md`.

Never silent-merge. Always log the choice in this file.
